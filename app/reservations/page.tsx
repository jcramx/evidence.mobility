'use client';

import React, { useState } from 'react';
import RouteMap from '@/components/RouteMap';
import TripDetailsBar, { VEHICLE_CATALOG, VehicleType, TripDetailsData } from '@/components/TripDetailsBar';

interface Point {
  lng: number;
  lat: number;
  address: string;
  applyOnReturn?: boolean;
}

interface RouteMetrics {
  distanceKm: number;
  durationMinutes: number;
}

const VEHICLE_PRICING: Record<VehicleType, {
  baseCost: number;
  costPerKm: number;
  costPerMinute: number;
  waitingHourCost: number;
  perNightViatic: number;
}> = {
  sedan_basic:   { baseCost: 50,  costPerKm: 12, costPerMinute: 2.30, waitingHourCost: 180, perNightViatic: 1200 },
  sedan_premium: { baseCost: 80,  costPerKm: 18, costPerMinute: 3.50, waitingHourCost: 250, perNightViatic: 1500 },
  minivan:       { baseCost: 100, costPerKm: 22, costPerMinute: 4.00, waitingHourCost: 300, perNightViatic: 1800 },
  van_hiace:     { baseCost: 200, costPerKm: 28, costPerMinute: 5.00, waitingHourCost: 380, perNightViatic: 2200 },
  van_sprinter:  { baseCost: 300, costPerKm: 42, costPerMinute: 7.50, waitingHourCost: 500, perNightViatic: 2800 },
  suv_luxury:    { baseCost: 180, costPerKm: 35, costPerMinute: 6.00, waitingHourCost: 450, perNightViatic: 2500 },
  bus_school:    { baseCost: 450, costPerKm: 55, costPerMinute: 9.00, waitingHourCost: 650, perNightViatic: 3500 },
  bus_luxury:    { baseCost: 650, costPerKm: 75, costPerMinute: 12.0, waitingHourCost: 850, perNightViatic: 4500 },
};

// Tarifas de Servicios de Personal (Tarifas base, hora extra y pernocta)
const STAFF_PRICING = {
  tourGuide: {
    dailyRate: 1500,       // Tarifa base por día/servicio
    perNightViatic: 1000,  // Viáticos por noche en estancia
  },
  assistant: {
    dailyRate: 800,        // Tarifa base por día/servicio
    perNightViatic: 700,   // Viáticos por noche en estancia
  }
};

export default function Page() {
  const [routeData, setRouteData] = useState<{
    pickup: Point | null;
    dropoff: Point | null;
    stops: Point[];
    metrics: RouteMetrics | null;
  }>({
    pickup: null,
    dropoff: null,
    stops: [],
    metrics: null
  });

  const [tripDetails, setTripDetails] = useState<TripDetailsData>({
    vehicleType: 'sedan_basic',
    tripType: 'one-way',
    departureDate: '',
    departureTime: '09:00',
    returnDate: '',
    returnTime: '18:00',
    waitingHours: 0,
    passengers: 1,
    hasBabySeat: false,
    hasPet: false,
    needsAssistance: false,
    isPackageOnly: false,
    hasTourGuide: false,
    tourGuideScope: 'at_destination',
    hasAssistant: false,
    assistantScope: 'from_origin',
    hasDifferentReturnPoint: false,
    customReturnAddress: '',
    invertStopsOnReturn: true,
    releaseUnitBetweenTrips: false,
  });

  const [step, setStep] = useState<'selection' | 'summary' | 'payment'>('selection');

  const getStayMetrics = () => {
    if (tripDetails.tripType !== 'round-trip' || !tripDetails.departureDate || !tripDetails.returnDate) {
      return { days: 1, nights: 0, hours: 0, isMultiDay: false, stayText: 'Sin Estancia' };
    }

    const start = new Date(`${tripDetails.departureDate}T${tripDetails.departureTime || '00:00'}:00`);
    const end = new Date(`${tripDetails.returnDate}T${tripDetails.returnTime || '00:00'}:00`);
    const diffMs = end.getTime() - start.getTime();

    if (isNaN(diffMs) || diffMs <= 0) return { days: 1, nights: 0, hours: 0, isMultiDay: false, stayText: 'Mismo día' };

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.max(1, Math.ceil(totalHours / 24));
    const nights = Math.floor(totalHours / 24);

    return {
      days,
      nights,
      hours: totalHours,
      isMultiDay: nights > 0,
      stayText: nights === 0 ? `${totalHours % 24} hrs de estancia` : `${days} día(s) / ${nights} noche(s) de pernocta`
    };
  };

  const calculateScenarioCost = (isIndependent: boolean) => {
    const rawKm = routeData.metrics?.distanceKm || 0;
    const rawMins = routeData.metrics?.durationMinutes || 0;
    const isForeign = rawKm > 60;
    const stay = getStayMetrics();
    const pricing = VEHICLE_PRICING[tripDetails.vehicleType] || VEHICLE_PRICING.sedan_basic;

    let kmToCharge = rawKm;
    let minsToCharge = rawMins;

    if (tripDetails.tripType === 'one-way') {
      kmToCharge = isForeign ? rawKm * 2 : rawKm;
      minsToCharge = isForeign ? rawMins * 2 : rawMins;
    } else if (isIndependent) {
      kmToCharge = rawKm * 4;
      minsToCharge = rawMins * 4;
    } else {
      kmToCharge = rawKm * 2;
      minsToCharge = rawMins * 2;
    }

    const baseCost = pricing.baseCost;
    const distanceCost = kmToCharge * pricing.costPerKm;
    const timeCost = minsToCharge * pricing.costPerMinute;

    let viaticsCost = 0;
    if (tripDetails.tripType === 'round-trip' && !isIndependent) {
      if (stay.isMultiDay) {
        viaticsCost = stay.nights * pricing.perNightViatic;
      } else {
        const effectiveWait = tripDetails.waitingHours < 0 ? 0 : tripDetails.waitingHours;
        viaticsCost = effectiveWait * pricing.waitingHourCost;
      }
    }

    // Cálculo de Servicios Especiales de Personal (Guía y Asistente)
    let staffCost = 0;
    let staffViatics = 0;

    const daysCount = stay.days || 1;
    const nightsCount = stay.nights || 0;

    // 1. Guía de Turistas
    if (tripDetails.hasTourGuide) {
      staffCost += STAFF_PRICING.tourGuide.dailyRate * daysCount;
      // Si va desde el origen o es estancia continua con pernocta, requiere viáticos de hospedaje
      if ((tripDetails.tourGuideScope === 'from_origin' || !isIndependent) && nightsCount > 0) {
        staffViatics += STAFF_PRICING.tourGuide.perNightViatic * nightsCount;
      }
    }

    // 2. Asistente
    if (tripDetails.hasAssistant) {
      staffCost += STAFF_PRICING.assistant.dailyRate * daysCount;
      if ((tripDetails.assistantScope === 'from_origin' || !isIndependent) && nightsCount > 0) {
        staffViatics += STAFF_PRICING.assistant.perNightViatic * nightsCount;
      }
    }

    const extraServices = (tripDetails.hasBabySeat ? 150 : 0);
    const rawTotal = baseCost + distanceCost + timeCost + viaticsCost + staffCost + staffViatics + extraServices;
    const numericTotal = rawKm === 0 ? 0 : Math.round(rawTotal / 10) * 10;

    return {
      isForeign,
      baseCost,
      distanceCost,
      timeCost,
      viaticsCost,
      staffCost,
      staffViatics,
      extraServices,
      kmToCharge,
      minsToCharge,
      numericTotal,
      formattedTotal: rawKm === 0 ? '$0.00' : `$${numericTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
    };
  };

  const scenarioContinuousRes = calculateScenarioCost(false);
  const scenarioIndependentRes = calculateScenarioCost(true);

  const isRoundTrip = tripDetails.tripType === 'round-trip';
  const suggestedScenario: 'continuous' | 'independent' = scenarioContinuousRes.numericTotal <= scenarioIndependentRes.numericTotal ? 'continuous' : 'independent';

  const isSelectedIndependent = isRoundTrip && tripDetails.releaseUnitBetweenTrips;
  const currentMetrics = isSelectedIndependent ? scenarioIndependentRes : scenarioContinuousRes;
  const stay = getStayMetrics();

  const getReturnStops = () => {
    const activeStops = routeData.stops.filter(s => s.applyOnReturn !== false);
    return tripDetails.invertStopsOnReturn ? [...activeStops].reverse() : activeStops;
  };

  const assistancesList: string[] = [];
  if (tripDetails.hasBabySeat) assistancesList.push('👶 Silla de Bebé');
  if (tripDetails.hasPet) assistancesList.push('🐾 Viajo con Mascota');
  if (tripDetails.needsAssistance) assistancesList.push('♿ Silla de ruedas / Asistencia');
  if (tripDetails.isPackageOnly) assistancesList.push('📦 Envío de Paquete Exclusivo');
  if (tripDetails.hasTourGuide) {
    assistancesList.push(`🤠 Guía (${tripDetails.tourGuideScope === 'from_origin' ? 'Origen' : 'Destino'})`);
  }
  if (tripDetails.hasAssistant) {
    assistancesList.push(`🙋‍♂️ Asistente (${tripDetails.assistantScope === 'from_origin' ? 'Origen' : 'Destino'})`);
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] p-2 lg:p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {step === 'selection' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cotizador Avanzado de Viajes</h1>
              <p className="text-xs text-gray-500 mt-1">Sistemas de ruta simétricos e independientes con control de paradas y servicios especiales.</p>
            </div>

            <TripDetailsBar 
              onDetailsChange={setTripDetails} 
              initialData={tripDetails} 
              tripDurationMinutes={routeData.metrics?.durationMinutes || 0}
            />

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <RouteMap 
                initialRoute={routeData} 
                onRouteSelected={(data) => setRouteData(data as any)} 
                onContinue={() => setStep('summary')}
              />
            </div>
          </div>
        )}

        {step === 'summary' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-xl font-bold text-gray-900">Desglose Operativo y Tarifario</h1>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              
              {/* SELECTOR INTERACTIVO EN TONOS CLAROS */}
              {isRoundTrip && (
                <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-5 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Modalidad Operativa del Viaje
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {/* Opción Espera Continua / Pernocta */}
                    <button
                      type="button"
                      onClick={() => setTripDetails(prev => ({ ...prev, releaseUnitBetweenTrips: false }))}
                      className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all relative cursor-pointer ${
                        !isSelectedIndependent
                          ? 'border-[#E63946] bg-white shadow-sm text-slate-900'
                          : 'border-slate-200 bg-slate-100/60 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {suggestedScenario === 'continuous' && (
                        <span className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Sugerido
                        </span>
                      )}
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        🏨 Espera Continua / Pernocta
                      </span>
                      <span className="text-[11px] mt-1 text-slate-500">
                        La unidad permanece en el destino a disposición del usuario.
                      </span>
                      <span className="text-base font-extrabold text-[#E63946] mt-2">
                        {scenarioContinuousRes.formattedTotal}
                      </span>
                    </button>

                    {/* Opción Servicios Independientes */}
                    <button
                      type="button"
                      onClick={() => setTripDetails(prev => ({ ...prev, releaseUnitBetweenTrips: true }))}
                      className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all relative cursor-pointer ${
                        isSelectedIndependent
                          ? 'border-blue-600 bg-white shadow-sm text-slate-900'
                          : 'border-slate-200 bg-slate-100/60 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {suggestedScenario === 'independent' && (
                        <span className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Sugerido / Mejor Precio
                        </span>
                      )}
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        🔄 Servicios Independientes
                      </span>
                      <span className="text-[11px] mt-1 text-slate-500">
                        Dos trayectos sencillos. La unidad retorna a base durante la estancia.
                      </span>
                      <span className="text-base font-extrabold text-blue-600 mt-2">
                        {scenarioIndependentRes.formattedTotal}
                      </span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    * El sistema destaca la opción con mayor eficiencia económica, pero puedes seleccionar la modalidad que mejor se adapte a tu agenda.
                  </p>
                </div>
              )}

              {/* RUTA DE IDA */}
              <div className="space-y-2 border-l-2 border-[#E63946] pl-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase">1. Trayecto de Ida</h3>
                <p className="text-xs text-gray-700"><strong>Origen:</strong> {routeData.pickup?.address}</p>
                {routeData.stops.map((stop, idx) => (
                  <p key={idx} className="text-xs text-gray-600">
                    ↳ <strong>Parada {idx + 1}:</strong> {stop.address}
                  </p>
                ))}
                <p className="text-xs text-gray-700"><strong>Llegada:</strong> {routeData.dropoff?.address}</p>
              </div>

              {/* RUTA DE REGRESO */}
              {isRoundTrip && (
                <div className="space-y-2 border-l-2 border-purple-600 pl-4 bg-purple-50/50 p-3 rounded-r-xl">
                  <h3 className="text-xs font-bold text-purple-900 uppercase">
                    2. Trayecto de Regreso ({tripDetails.returnDate} — {tripDetails.returnTime} hrs)
                  </h3>
                  <p className="text-xs text-purple-950">
                    <strong>Punto Recogida Regreso:</strong> {routeData.dropoff?.address}
                  </p>
                  
                  {getReturnStops().length > 0 ? (
                    getReturnStops().map((stop, idx) => (
                      <p key={idx} className="text-xs text-purple-800">
                        ↳ <strong>Parada Regreso {idx + 1} {tripDetails.invertStopsOnReturn ? '(Secuencia Inversa)' : ''}:</strong> {stop.address}
                      </p>
                    ))
                  ) : (
                    <p className="text-[11px] text-purple-700 italic">Sin paradas intermedias en el regreso (Trayecto directo)</p>
                  )}

                  <p className="text-xs text-purple-950">
                    <strong>Punto Destino Final Regreso:</strong>{' '}
                    {tripDetails.hasDifferentReturnPoint && tripDetails.customReturnAddress?.trim()
                      ? tripDetails.customReturnAddress
                      : `${routeData.pickup?.address} (Punto Origen Inicial)`}
                  </p>
                </div>
              )}

              {/* RESUMEN DE VEHÍCULO, PASAJEROS Y ASISTENCIAS */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Vehículo Solicitado</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                    <span>{VEHICLE_CATALOG[tripDetails.vehicleType].icon}</span>
                    <span>{VEHICLE_CATALOG[tripDetails.vehicleType].label}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Ocupantes</span>
                  <span className="font-semibold text-gray-800 block mt-0.5">
                    {tripDetails.isPackageOnly ? '0 (Solo Paquete)' : `${tripDetails.passengers} Pasajero(s)`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Asistencias / Personal</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {assistancesList.length > 0 ? (
                      assistancesList.map((item, idx) => (
                        <span key={idx} className="bg-white text-gray-700 text-[10px] px-2 py-0.5 rounded border border-gray-200">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gray-500">Sin asistencias adicionales</span>
                    )}
                  </div>
                </div>
              </div>

              {/* TABLA DE DESGLOSE TARIFARIO */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-1.5 uppercase text-[11px] tracking-wider">
                  Desglose Tarifario ({isSelectedIndependent ? 'Servicios Independientes: 2 Viajes Sencillos' : 'Espera Continua / Con Pernocta'})
                </h4>
                
                <div className="flex justify-between text-gray-600">
                  <span>Banderazo / Tarifa Base Vehículo</span>
                  <span className="font-medium">${currentMetrics.baseCost.toFixed(2)} MXN</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Distancia Computada ({currentMetrics.kmToCharge.toFixed(1)} km)</span>
                  <span className="font-medium">${currentMetrics.distanceCost.toFixed(2)} MXN</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Tiempo Estimado en Ruta ({currentMetrics.minsToCharge} min)</span>
                  <span className="font-medium">${currentMetrics.timeCost.toFixed(2)} MXN</span>
                </div>

                {currentMetrics.viaticsCost > 0 && (
                  <div className="flex justify-between text-amber-900 font-semibold bg-amber-50 p-2 rounded border border-amber-200">
                    <span>
                      {stay.isMultiDay 
                        ? `Viáticos de Pernocta / Estancia del Chofer (${stay.nights} Noche(s))` 
                        : `Tiempo de Espera en Destino (${tripDetails.waitingHours} hrs)`}
                    </span>
                    <span>+${currentMetrics.viaticsCost.toFixed(2)} MXN</span>
                  </div>
                )}

                {currentMetrics.staffCost > 0 && (
                  <div className="flex justify-between text-indigo-900 font-semibold bg-indigo-50 p-2 rounded border border-indigo-200">
                    <span>Honorarios de Personal (Guía / Asistente)</span>
                    <span>+${currentMetrics.staffCost.toFixed(2)} MXN</span>
                  </div>
                )}

                {currentMetrics.staffViatics > 0 && (
                  <div className="flex justify-between text-purple-900 font-semibold bg-purple-50 p-2 rounded border border-purple-200">
                    <span>Viáticos y Hotel de Personal en Destino ({stay.nights} Noche(s))</span>
                    <span>+${currentMetrics.staffViatics.toFixed(2)} MXN</span>
                  </div>
                )}

                {currentMetrics.extraServices > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Servicios Adicionales (Silla Bebé / Asistencia)</span>
                    <span className="font-medium">${currentMetrics.extraServices.toFixed(2)} MXN</span>
                  </div>
                )}
              </div>

              {/* TOTAL GENERAL */}
              <div className="flex justify-between items-center bg-[#E63946]/10 p-4 rounded-xl border border-[#E63946]/20">
                <div>
                  <p className="text-xs font-bold text-gray-900">Total Servicio Garantizado</p>
                  <p className="text-[10px] text-gray-500">Incluye chofer, casetas, combustible, seguro de viajero y personal contratado</p>
                </div>
                <span className="text-xl font-extrabold text-[#E63946]">{currentMetrics.formattedTotal}</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep('selection')}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-200 cursor-pointer"
                >
                  ← Modificar Configuración
                </button>
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="bg-[#E63946] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-red-700 transition cursor-pointer"
                >
                  Proceder al Pago →
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}