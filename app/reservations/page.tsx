'use client';

import React, { useState } from 'react';
import RouteMap from '@/components/RouteMap';
import TripDetailsBar from '@/components/TripDetailsBar';
import RecurringRouteModal from '@/components/RecurringRouteModal';

interface Point {
  lng: number;
  lat: number;
  address: string;
}

interface RouteMetrics {
  distanceKm: number;
  durationMinutes: number;
}

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

  const [tripDetails, setTripDetails] = useState({
    tripType: 'one-way',
    departureDate: '',
    departureTime: '09:00',
    returnDate: '',
    returnTime: '18:00',
    waitingHours: 0, // Nuevo campo para horas de espera
    counts: {
      adults: 0,
      teenagers: 0,
      children: 0,
      infants: 0,
      support: 0,
      pets: 0,
      packageOnly: 0
    }
  });

  const [step, setStep] = useState<'selection' | 'summary' | 'payment'>('selection');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [isPaid, setIsPaid] = useState(false);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

  const handleRecurringRouteLoaded = (loadedData: any) => {
    if (loadedData) {
      setTripDetails(prev => ({
        ...prev,
        tripType: loadedData.tripType || prev.tripType,
        departureDate: loadedData.departureDate || prev.departureDate,
        departureTime: loadedData.departureTime || prev.departureTime,
        returnDate: loadedData.returnDate || prev.returnDate,
        returnTime: loadedData.returnTime || prev.returnTime,
        waitingHours: loadedData.waitingHours || prev.waitingHours,
        counts: loadedData.counts || prev.counts
      }));

      setRouteData(prev => ({
        ...prev,
        pickup: loadedData.pickup || null,
        dropoff: loadedData.dropoff || null,
        stops: loadedData.stops || []
      }));
    }
  };

  const handleContinue = () => {
    setStep('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmService = () => {
    setIsConfirmed(true);
    setTimeout(() => {
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);
  };

  const handleExecutePayment = () => {
    setIsPaid(true);
  };

  const calculateMetrics = () => {
    const rawKm = routeData.metrics?.distanceKm || 0;
    const rawMins = routeData.metrics?.durationMinutes || 0;

    // Si es ida y vuelta, duplicamos la distancia y el tiempo en ruta
    const multiplier = tripDetails.tripType === 'round-trip' ? 2 : 1;

    const km = Number((rawKm * multiplier).toFixed(2));
    const mins = Math.round(rawMins * multiplier);

    // Cálculo de horas de espera / estancia del conductor
    const waitingHours = tripDetails.tripType === 'round-trip' ? Number(tripDetails.waitingHours || 0) : 0;
    const costPerWaitingHour = 180.00;
    const waitingCost = waitingHours * costPerWaitingHour;

    const baseCost = 40;
    const costPerKm = 12;
    const costPerMinute = 2.30;

    const distanceCost = km * costPerKm;
    const timeCost = mins * costPerMinute;

    const rawTotal = baseCost + distanceCost + timeCost + waitingCost;
    const total = km === 0 ? 0 : Math.round(rawTotal / 5) * 5;

    const fuel = Math.round(km * 3.2 * 10) / 10; 
    const maintenance = Math.round(km * 1.5 * 10) / 10; 
    const driver = Math.round(mins * 3.5) + Math.round(waitingCost * 0.6); 

    return {
      basePickupKm: 'Base GAM',
      basePickupTime: 'Operación local',
      basePickupCost: `$${baseCost}.00`,
      routeKm: `${km} km${multiplier === 2 ? ' (Ida y vuelta)' : ''}`,
      routeTime: `${mins} min${multiplier === 2 ? ' (Ida y vuelta)' : ''}`,
      waitingText: waitingHours > 0 ? `${waitingHours} hora(s) de espera ($${waitingCost.toFixed(2)})` : 'Sin horas de espera',
      fuelCost: `$${fuel.toFixed(2)}`,
      maintenanceCost: `$${maintenance.toFixed(2)}`,
      driverSalary: `$${driver}.00`,
      total: km === 0 ? '$0.00' : `$${total}.00`
    };
  };

  const metrics = calculateMetrics();

  const getTotalPassengers = () => {
    const c = tripDetails.counts;
    const total = c.adults + c.teenagers + c.children + c.infants;
    if (c.packageOnly > 0 && total === 0) return '1 Paquete (Mensajería)';
    if (total === 0) return 'No especificado (Estadística)';
    return `${total} pasajero(s)`;
  };

  const getModalidadText = () => {
    if (tripDetails.tripType === 'one-way') return 'Sólo ida';
    if (tripDetails.tripType === 'round-trip') {
      const waiting = tripDetails.waitingHours > 0 ? ` (${tripDetails.waitingHours} hrs de espera)` : ' (Sin espera)';
      return `Ida y vuelta${waiting}`;
    }
    return 'Multidestino';
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] p-2 lg:p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {step === 'selection' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cotiza y Reserva tu Viaje</h1>
              <p className="text-xs text-gray-500 mt-1">Selecciona la modalidad, fecha opcional y define la ruta en el mapa al instante.</p>
            </div>

            <div className="bg-[#E63946]/5 border border-[#E63946]/20 p-3.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-800">
                <span>⚡</span>
                <span><strong>¿Usuario Recurrente?</strong> Carga tu última ruta guardada o destino frecuente.</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsRecurringModalOpen(true)}
                className="bg-[#E63946] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-700 transition cursor-pointer"
              >
                Cargar Ruta Recurrente
              </button>
            </div>

            <TripDetailsBar onDetailsChange={setTripDetails} initialData={tripDetails} />

            <div className="bg-white p-4 lg:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Selecciona la ruta, paradas y destinos</h2>
              <RouteMap 
                initialRoute={routeData} 
                onRouteSelected={(data) => setRouteData(data as any)} 
                onContinue={handleContinue}
              />
            </div>
          </div>
        )}

        {step === 'summary' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Detalles de Servicio Solicitado</h1>
              <p className="text-xs text-gray-500 mt-1">Verifique que la información del servicio sea correcta antes de confirmar.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-gray-500">Modalidad</span>
                  <span className="font-bold text-gray-900 text-sm">{getModalidadText()}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-gray-500">Fecha y Salida</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {tripDetails.departureDate ? `${tripDetails.departureDate} a las ${tripDetails.departureTime}` : 'Programación inmediata'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-gray-500">Ocupantes (Estadística)</span>
                  <span className="font-bold text-gray-900 text-sm">{getTotalPassengers()}</span>
                </div>
              </div>

              <div className="space-y-3">
                {routeData.pickup && (
                  <div className="flex items-center gap-3 bg-red-50/50 border border-red-100 p-3.5 rounded-xl">
                    <span className="bg-[#E63946] text-white text-[10px] font-bold px-2.5 py-1 rounded-md">Origen</span>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-gray-500">Punto de Recogida</p>
                      <p className="text-xs font-bold text-gray-900">{routeData.pickup.address}</p>
                    </div>
                  </div>
                )}

                {routeData.stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-yellow-50/50 border border-yellow-100 p-3.5 rounded-xl">
                    <span className="bg-yellow-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">Parada {idx + 1}</span>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-gray-500">Parada Intermedia</p>
                      <p className="text-xs font-bold text-gray-900">{stop.address}</p>
                    </div>
                  </div>
                ))}

                {routeData.dropoff && (
                  <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">Destino</span>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-gray-500">Destino Final</p>
                      <p className="text-xs font-bold text-gray-900">{routeData.dropoff.address}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Desglose Técnico y Costos Operativos del Servicio</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <span className="block text-gray-500 text-[10px] uppercase font-semibold">Costo Base / Trayecto Inicial</span>
                    <p className="text-sm font-bold text-gray-900 mt-1">{metrics.basePickupCost}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">({metrics.basePickupKm} / {metrics.basePickupTime})</p>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <span className="block text-gray-500 text-[10px] uppercase font-semibold">Distancia y Tiempo de Ruta</span>
                    <p className="text-sm font-bold text-gray-900 mt-1">{metrics.routeKm}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Tiempo en ruta: {metrics.routeTime}</p>
                    <p className="text-[10px] text-[#E63946] font-semibold mt-1">Estancia: {metrics.waitingText}</p>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <span className="block text-gray-500 text-[10px] uppercase font-semibold">Costos Operativos Unidad</span>
                    <p className="text-sm font-bold text-gray-900 mt-1">{metrics.fuelCost}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Combustible y Mantenimiento</p>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <span className="block text-gray-500 text-[10px] uppercase font-semibold">Honorarios Conductor</span>
                    <p className="text-sm font-bold text-gray-900 mt-1">{metrics.driverSalary}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Salario operativo y guardia</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[#0b0f19] text-white p-4 rounded-xl shadow-md">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Costo Total Estimado</p>
                    <p className="text-xs text-gray-300">Incluye todos los impuestos y comisiones</p>
                  </div>
                  <div className="text-xl font-extrabold text-[#E63946]">
                    {metrics.total}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStep('selection')}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  ← Modificar ruta o detalles
                </button>

                <button
                  onClick={handleConfirmService}
                  disabled={isConfirmed}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    isConfirmed
                      ? 'bg-green-600 text-white cursor-default'
                      : 'bg-[#E63946] text-white hover:bg-red-700 cursor-pointer'
                  }`}
                >
                  {isConfirmed ? '✓ Procesando confirmación...' : 'Confirmar servicio'}
                </button>
              </div>

            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pasarela de Pago — evidence.mobility</h1>
              <p className="text-xs text-gray-500 mt-1">Complete su transacción para asegurar el compromiso y agendar formalmente a su conductor.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              
              <div className="bg-[#F4F1EA] border border-gray-300 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E63946] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">evidence.mobility</span>
                  <span className="text-xs font-bold text-gray-700">Sistema de Gestión de Trayectos</span>
                </div>
                <h2 className="text-base font-extrabold text-gray-900">¡Muchas gracias por viajar con evidence.mobility!</h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Su servicio solicitado ha sido registrado y asegurado con éxito en nuestro sistema. A continuación, realice el pago correspondiente para formalizar el compromiso operativo y proceder inmediatamente con la asignación y agendamiento del conductor y vehículo.
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-3 rounded-xl font-medium">
                  ⚠️ <strong>Aviso importante:</strong> En este punto, los detalles del viaje se han consolidado y <strong>ya no podrán modificarse</strong>.
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Seleccione Método de Pago Seguro</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${paymentMethod === 'stripe' ? 'border-[#E63946] bg-red-50/30 ring-1 ring-[#E63946]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">💳</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-gray-900">Stripe</p>
                        <p className="text-[10px] text-gray-500">Tarjeta de Crédito / Débito</p>
                      </div>
                    </div>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'stripe' ? 'border-[#E63946] bg-[#E63946]' : 'border-gray-400'}`}>
                      {paymentMethod === 'stripe' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🅿️</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-gray-900">PayPal</p>
                        <p className="text-[10px] text-gray-500">Saldo o Cuenta Vinculada</p>
                      </div>
                    </div>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}>
                      {paymentMethod === 'paypal' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs text-gray-700">
                    <span>Monto a pagar por el servicio:</span>
                    <span className="font-bold text-sm text-gray-900">{metrics.total}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-700">
                    <span>Procesador activo:</span>
                    <span className="font-bold uppercase text-gray-900">{paymentMethod === 'stripe' ? 'Stripe Secure Gateway' : 'PayPal Checkout'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={handleExecutePayment}
                  disabled={isPaid}
                  className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    isPaid
                      ? 'bg-green-600 text-white cursor-default'
                      : 'bg-[#E63946] text-white hover:bg-red-700 cursor-pointer'
                  }`}
                >
                  {isPaid ? '✓ Pago Exitoso — Conductor Agendado' : `Pagar ${metrics.total} y Agendar Conductor`}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      <RecurringRouteModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onRouteLoaded={handleRecurringRouteLoaded}
      />
    </main>
  );
}