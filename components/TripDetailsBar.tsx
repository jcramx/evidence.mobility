'use client';

import React, { useState, useRef, useEffect } from 'react';

export const VEHICLE_CATALOG = {
  sedan_basic: { label: 'Auto Sedán Básico (ej. Vento / Aveo)', maxPax: 4, icon: '🚗' },
  sedan_premium: { label: 'Auto Sedán Premium (ej. Camry / Passat)', maxPax: 4, icon: '🚘' },
  minivan: { label: 'Minivan / Van Compacta (ej. Chevy/Ford Van)', maxPax: 7, icon: '🚐' },
  van_hiace: { label: 'Van Mediana (ej. Hiace / Urvan)', maxPax: 14, icon: '🚌' },
  van_sprinter: { label: 'Van Sprinter / Gran Capacidad', maxPax: 19, icon: '🚐' },
  suv_luxury: { label: 'SUV Ejecutivo (Suburban / Escalade)', maxPax: 6, icon: '🚙' },
  bus_school: { label: 'Autobús Escolar / Urbano', maxPax: 40, icon: '🚌' },
  bus_luxury: { label: 'Autobús de Lujo (Gran Turismo)', maxPax: 50, icon: '🚍' },
};

export type VehicleType = keyof typeof VEHICLE_CATALOG;
export type StaffScope = 'from_origin' | 'at_destination';

export interface TripDetailsData {
  vehicleType: VehicleType;
  tripType: 'one-way' | 'round-trip';
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  waitingHours: number; // 0 = Sin espera (Regreso inmediato), -1 = Sin espera (Regreso programado), >0 = Horas
  passengers: number;
  hasBabySeat: boolean;
  hasPet: boolean;
  needsAssistance: boolean;
  isPackageOnly: boolean;

  // Nuevos servicios de personal
  hasTourGuide: boolean;
  tourGuideScope: StaffScope;
  hasAssistant: boolean;
  assistantScope: StaffScope;

  customReturnAddress?: string;
  hasDifferentReturnPoint: boolean;
  invertStopsOnReturn: boolean;
  releaseUnitBetweenTrips: boolean;
}

interface TripDetailsProps {
  onDetailsChange: (details: TripDetailsData) => void;
  initialData?: Partial<TripDetailsData>;
  tripDurationMinutes?: number;
}

export default function TripDetailsBar({ onDetailsChange, initialData, tripDurationMinutes = 0 }: TripDetailsProps) {
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialData?.vehicleType || 'sedan_basic');
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>(
    initialData?.tripType === 'round-trip' ? 'round-trip' : 'one-way'
  );
  
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false);
  const [isPaxDropdownOpen, setIsPaxDropdownOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [departureDate, setDepartureDate] = useState<string>(initialData?.departureDate || today);
  const [departureTime, setDepartureTime] = useState<string>(initialData?.departureTime || '09:00');
  const [returnDate, setReturnDate] = useState<string>(initialData?.returnDate || today);
  const [returnTime, setReturnTime] = useState<string>(initialData?.returnTime || '12:00');
  const [waitingHours, setWaitingHours] = useState<number>(initialData?.waitingHours ?? 2);

  const [hasDifferentReturnPoint, setHasDifferentReturnPoint] = useState<boolean>(initialData?.hasDifferentReturnPoint || false);
  const [customReturnAddress, setCustomReturnAddress] = useState<string>(initialData?.customReturnAddress || '');
  const [invertStopsOnReturn, setInvertStopsOnReturn] = useState<boolean>(initialData?.invertStopsOnReturn ?? true);
  const [releaseUnitBetweenTrips, setReleaseUnitBetweenTrips] = useState<boolean>(initialData?.releaseUnitBetweenTrips || false);

  const [passengers, setPassengers] = useState<number>(initialData?.passengers ?? 1);
  const [hasBabySeat, setHasBabySeat] = useState<boolean>(initialData?.hasBabySeat || false);
  const [hasPet, setHasPet] = useState<boolean>(initialData?.hasPet || false);
  const [needsAssistance, setNeedsAssistance] = useState<boolean>(initialData?.needsAssistance || false);
  const [isPackageOnly, setIsPackageOnly] = useState<boolean>(initialData?.isPackageOnly || false);

  // Estados de Guía y Asistente
  const [hasTourGuide, setHasTourGuide] = useState<boolean>(initialData?.hasTourGuide || false);
  const [tourGuideScope, setTourGuideScope] = useState<StaffScope>(initialData?.tourGuideScope || 'at_destination');
  const [hasAssistant, setHasAssistant] = useState<boolean>(initialData?.hasAssistant || false);
  const [assistantScope, setAssistantScope] = useState<StaffScope>(initialData?.assistantScope || 'from_origin');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const getDateTime = (dateStr: string, timeStr: string) => {
    return new Date(`${dateStr}T${timeStr}:00`);
  };

  const calculateReturnFromWaiting = (depDate: string, depTime: string, waitHrs: number, durationMins: number) => {
    const dep = getDateTime(depDate, depTime);
    if (isNaN(dep.getTime())) return { date: depDate, time: depTime };

    const effectiveWait = waitHrs < 0 ? 0 : waitHrs;
    const totalMinutesToAdd = Math.round(durationMins) + Math.round(effectiveWait * 60);
    const returnDt = new Date(dep.getTime() + totalMinutesToAdd * 60000);

    const year = returnDt.getFullYear();
    const month = String(returnDt.getMonth() + 1).padStart(2, '0');
    const day = String(returnDt.getDate()).padStart(2, '0');
    const hours = String(returnDt.getHours()).padStart(2, '0');
    const minutes = String(returnDt.getMinutes()).padStart(2, '0');

    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  };

  const calculateWaitingFromReturn = (depDate: string, depTime: string, retDate: string, retTime: string, durationMins: number) => {
    const dep = getDateTime(depDate, depTime);
    const ret = getDateTime(retDate, retTime);

    if (isNaN(dep.getTime()) || isNaN(ret.getTime()) || ret <= dep) return 0;

    const totalDiffMinutes = (ret.getTime() - dep.getTime()) / 60000;
    const netWaitMinutes = totalDiffMinutes - durationMins;

    if (netWaitMinutes <= 0) return 0;
    return Math.round(netWaitMinutes / 60);
  };

  useEffect(() => {
    if (initialData) {
      if (initialData.vehicleType) setVehicleType(initialData.vehicleType);
      if (initialData.tripType) setTripType(initialData.tripType === 'round-trip' ? 'round-trip' : 'one-way');
      if (initialData.departureDate) setDepartureDate(initialData.departureDate);
      if (initialData.departureTime) setDepartureTime(initialData.departureTime);
      if (initialData.returnDate) setReturnDate(initialData.returnDate);
      if (initialData.returnTime) setReturnTime(initialData.returnTime);
      if (initialData.waitingHours !== undefined) setWaitingHours(initialData.waitingHours);
      if (initialData.passengers !== undefined) setPassengers(initialData.passengers);
      if (initialData.hasBabySeat !== undefined) setHasBabySeat(initialData.hasBabySeat);
      if (initialData.hasPet !== undefined) setHasPet(initialData.hasPet);
      if (initialData.needsAssistance !== undefined) setNeedsAssistance(initialData.needsAssistance);
      if (initialData.isPackageOnly !== undefined) setIsPackageOnly(initialData.isPackageOnly);
      if (initialData.hasTourGuide !== undefined) setHasTourGuide(initialData.hasTourGuide);
      if (initialData.tourGuideScope !== undefined) setTourGuideScope(initialData.tourGuideScope);
      if (initialData.hasAssistant !== undefined) setHasAssistant(initialData.hasAssistant);
      if (initialData.assistantScope !== undefined) setAssistantScope(initialData.assistantScope);
      if (initialData.hasDifferentReturnPoint !== undefined) setHasDifferentReturnPoint(initialData.hasDifferentReturnPoint);
      if (initialData.customReturnAddress !== undefined) setCustomReturnAddress(initialData.customReturnAddress);
      if (initialData.invertStopsOnReturn !== undefined) setInvertStopsOnReturn(initialData.invertStopsOnReturn);
      if (initialData.releaseUnitBetweenTrips !== undefined) setReleaseUnitBetweenTrips(initialData.releaseUnitBetweenTrips);
    }
  }, [initialData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsVehicleDropdownOpen(false);
        setIsTripDropdownOpen(false);
        setIsPaxDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifyChanges = (updatedValues: Partial<TripDetailsData> = {}) => {
    onDetailsChange({
      vehicleType: updatedValues.vehicleType ?? vehicleType,
      tripType: updatedValues.tripType ?? tripType,
      departureDate: updatedValues.departureDate ?? departureDate,
      departureTime: updatedValues.departureTime ?? departureTime,
      returnDate: updatedValues.returnDate ?? returnDate,
      returnTime: updatedValues.returnTime ?? returnTime,
      waitingHours: updatedValues.waitingHours ?? waitingHours,
      passengers: updatedValues.passengers ?? passengers,
      hasBabySeat: updatedValues.hasBabySeat ?? hasBabySeat,
      hasPet: updatedValues.hasPet ?? hasPet,
      needsAssistance: updatedValues.needsAssistance ?? needsAssistance,
      isPackageOnly: updatedValues.isPackageOnly ?? isPackageOnly,
      hasTourGuide: updatedValues.hasTourGuide ?? hasTourGuide,
      tourGuideScope: updatedValues.tourGuideScope ?? tourGuideScope,
      hasAssistant: updatedValues.hasAssistant ?? hasAssistant,
      assistantScope: updatedValues.assistantScope ?? assistantScope,
      hasDifferentReturnPoint: updatedValues.hasDifferentReturnPoint ?? hasDifferentReturnPoint,
      customReturnAddress: updatedValues.customReturnAddress ?? customReturnAddress,
      invertStopsOnReturn: updatedValues.invertStopsOnReturn ?? invertStopsOnReturn,
      releaseUnitBetweenTrips: updatedValues.releaseUnitBetweenTrips ?? releaseUnitBetweenTrips,
    });
  };

  const handleDepartureChange = (newDate: string, newTime: string) => {
    setDepartureDate(newDate);
    setDepartureTime(newTime);

    if (tripType === 'round-trip') {
      if (returnDate < newDate) setReturnDate(newDate);
      const targetReturnDate = returnDate < newDate ? newDate : returnDate;
      if (targetReturnDate === newDate) {
        const calculated = calculateReturnFromWaiting(newDate, newTime, waitingHours, tripDurationMinutes);
        setReturnDate(calculated.date);
        setReturnTime(calculated.time);
        notifyChanges({ departureDate: newDate, departureTime: newTime, returnDate: calculated.date, returnTime: calculated.time });
      } else {
        const calculatedWait = calculateWaitingFromReturn(newDate, newTime, targetReturnDate, returnTime, tripDurationMinutes);
        setWaitingHours(calculatedWait);
        notifyChanges({ departureDate: newDate, departureTime: newTime, waitingHours: calculatedWait });
      }
    } else {
      notifyChanges({ departureDate: newDate, departureTime: newTime });
    }
  };

  const handleReturnDateChange = (newReturnDate: string) => {
    setReturnDate(newReturnDate);
    const isSameDay = newReturnDate === departureDate;

    if (isSameDay) {
      const calculated = calculateReturnFromWaiting(departureDate, departureTime, waitingHours, tripDurationMinutes);
      setReturnTime(calculated.time);
      notifyChanges({ returnDate: newReturnDate, returnTime: calculated.time });
    } else {
      const defaultCheckout = '11:00';
      setReturnTime(defaultCheckout);
      const calculatedWait = calculateWaitingFromReturn(departureDate, departureTime, newReturnDate, defaultCheckout, tripDurationMinutes);
      setWaitingHours(calculatedWait);
      notifyChanges({ returnDate: newReturnDate, returnTime: defaultCheckout, waitingHours: calculatedWait });
    }
  };

  const handleReturnTimeChange = (newReturnTime: string) => {
    setReturnTime(newReturnTime);
    if (waitingHours !== -1) {
      const calculatedWait = calculateWaitingFromReturn(departureDate, departureTime, returnDate, newReturnTime, tripDurationMinutes);
      setWaitingHours(calculatedWait);
      notifyChanges({ returnTime: newReturnTime, waitingHours: calculatedWait });
    } else {
      notifyChanges({ returnTime: newReturnTime });
    }
  };

  const handleWaitingChange = (newWaitingHours: number) => {
    setWaitingHours(newWaitingHours);
    if (newWaitingHours !== -1) {
      const calculated = calculateReturnFromWaiting(departureDate, departureTime, newWaitingHours, tripDurationMinutes);
      setReturnDate(calculated.date);
      setReturnTime(calculated.time);
      notifyChanges({ waitingHours: newWaitingHours, returnDate: calculated.date, returnTime: calculated.time });
    } else {
      notifyChanges({ waitingHours: -1 });
    }
  };

  const currentMaxPax = VEHICLE_CATALOG[vehicleType].maxPax;

  const updatePassengers = (delta: number) => {
    let newVal = passengers + delta;
    if (newVal < 0) newVal = 0;
    if (newVal > currentMaxPax) newVal = currentMaxPax;
    setPassengers(newVal);
    notifyChanges({ passengers: newVal });
  };

  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type);
    setIsVehicleDropdownOpen(false);
    const maxPax = VEHICLE_CATALOG[type].maxPax;
    let adjusted = passengers > maxPax ? maxPax : passengers;
    setPassengers(adjusted);
    notifyChanges({ vehicleType: type, passengers: adjusted });
  };

  const handleTripTypeChange = (type: 'one-way' | 'round-trip') => {
    setTripType(type);
    setIsTripDropdownOpen(false);
    const resetWaiting = type === 'round-trip' ? waitingHours : 0;
    
    if (type === 'round-trip') {
      const calculated = calculateReturnFromWaiting(departureDate, departureTime, resetWaiting, tripDurationMinutes);
      setReturnDate(calculated.date);
      setReturnTime(calculated.time);
      notifyChanges({ tripType: type, waitingHours: resetWaiting, returnDate: calculated.date, returnTime: calculated.time });
    } else {
      setWaitingHours(0);
      setHasDifferentReturnPoint(false);
      notifyChanges({ tripType: type, waitingHours: 0, hasDifferentReturnPoint: false });
    }
  };

  const isMultiDay = returnDate > departureDate;

  return (
    <div className="bg-[#F4F1EA] border border-gray-200 p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-center relative text-gray-800" ref={dropdownRef}>
      
      {/* 1. Selector de Vehículo */}
      <div className="relative">
        <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Vehículo</label>
        <button
          type="button"
          onClick={() => {
            setIsVehicleDropdownOpen(!isVehicleDropdownOpen);
            setIsTripDropdownOpen(false);
            setIsPaxDropdownOpen(false);
          }}
          className="bg-white border border-gray-300 hover:border-gray-400 text-gray-800 px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-2xs max-w-[220px] truncate"
        >
          <span>{VEHICLE_CATALOG[vehicleType].icon}</span>
          <span className="truncate">{VEHICLE_CATALOG[vehicleType].label}</span>
          <span className="text-[#E63946] ml-auto">▼</span>
        </button>

        {isVehicleDropdownOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-72 space-y-1 max-h-80 overflow-y-auto">
            {(Object.keys(VEHICLE_CATALOG) as VehicleType[]).map((key) => {
              const item = VEHICLE_CATALOG[key];
              const isSelected = vehicleType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleVehicleTypeChange(key)}
                  className={`w-full p-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                    isSelected ? 'bg-[#E63946] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ml-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Máx. {item.maxPax}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Control de Ocupantes y Servicios Especiales (Reorganizado al lado del Vehículo) */}
      <div className="relative">
        <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">
          Ocupantes (Máx. {currentMaxPax})
        </label>
        <button
          type="button"
          onClick={() => {
            setIsPaxDropdownOpen(!isPaxDropdownOpen);
            setIsVehicleDropdownOpen(false);
            setIsTripDropdownOpen(false);
          }}
          className="bg-white border border-gray-300 hover:border-gray-400 text-gray-800 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-3 transition cursor-pointer shadow-2xs"
        >
          <span>{passengers > 0 ? `${passengers}/${currentMaxPax} pax` : 'Opciones'}</span>
          <span className="text-[#E63946]">▼</span>
        </button>

        {isPaxDropdownOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-80 space-y-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs font-bold text-gray-900">Total Pasajeros</p>
                <p className="text-[10px] text-gray-500">Capacidad máx: {currentMaxPax}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => updatePassengers(-1)} 
                  disabled={isPackageOnly}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 font-bold cursor-pointer disabled:opacity-40"
                >-</button>
                <span className="text-sm font-bold text-gray-900 w-4 text-center">{passengers}</span>
                <button 
                  type="button" 
                  onClick={() => updatePassengers(1)} 
                  disabled={isPackageOnly || passengers >= currentMaxPax}
                  className="w-7 h-7 rounded-full border border-[#E63946] bg-[#E63946]/10 flex items-center justify-center text-[#E63946] font-bold cursor-pointer disabled:opacity-40"
                >+</button>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium text-gray-700">
              {/* Opciones básicas */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hasBabySeat} 
                  onChange={(e) => {
                    setHasBabySeat(e.target.checked);
                    notifyChanges({ hasBabySeat: e.target.checked });
                  }} 
                  className="rounded border-gray-300 text-[#E63946] focus:ring-0 cursor-pointer" 
                />
                <span>👶 Silla para bebé</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hasPet} 
                  onChange={(e) => {
                    setHasPet(e.target.checked);
                    notifyChanges({ hasPet: e.target.checked });
                  }} 
                  className="rounded border-gray-300 text-[#E63946] focus:ring-0 cursor-pointer" 
                />
                <span>🐾 Viajo con mascota</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={needsAssistance} 
                  onChange={(e) => {
                    setNeedsAssistance(e.target.checked);
                    notifyChanges({ needsAssistance: e.target.checked });
                  }} 
                  className="rounded border-gray-300 text-[#E63946] focus:ring-0 cursor-pointer" 
                />
                <span>♿ Asistencia / Silla de ruedas</span>
              </label>

              {/* SECCIÓN GUÍA DE TURISTAS */}
              <div className="border-t border-gray-100 pt-2.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                  <input 
                    type="checkbox" 
                    checked={hasTourGuide} 
                    onChange={(e) => {
                      const val = e.target.checked;
                      setHasTourGuide(val);
                      notifyChanges({ hasTourGuide: val });
                    }} 
                    className="rounded border-gray-300 text-[#E63946] focus:ring-0 cursor-pointer" 
                  />
                  <span>🤠 Guía de Turistas</span>
                </label>
                {hasTourGuide && (
                  <div className="ml-6 space-y-1 bg-amber-50/60 p-2 rounded-lg border border-amber-200/80">
                    <p className="text-[10px] text-amber-900 font-medium">Contratación de Guía:</p>
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-gray-700">
                      <input 
                        type="radio" 
                        name="tourGuideScope" 
                        checked={tourGuideScope === 'from_origin'}
                        onChange={() => {
                          setTourGuideScope('from_origin');
                          notifyChanges({ tourGuideScope: 'from_origin' });
                        }}
                        className="text-[#E63946] focus:ring-0 cursor-pointer"
                      />
                      <span>Incluido desde el origen (Ocupa 1 asiento)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-gray-700">
                      <input 
                        type="radio" 
                        name="tourGuideScope" 
                        checked={tourGuideScope === 'at_destination'}
                        onChange={() => {
                          setTourGuideScope('at_destination');
                          notifyChanges({ tourGuideScope: 'at_destination' });
                        }}
                        className="text-[#E63946] focus:ring-0 cursor-pointer"
                      />
                      <span>Contratado únicamente en destino</span>
                    </label>
                  </div>
                )}
              </div>

              {/* SECCIÓN ASISTENTE DE VIAJE */}
              <div className="border-t border-gray-100 pt-2.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                  <input 
                    type="checkbox" 
                    checked={hasAssistant} 
                    onChange={(e) => {
                      const val = e.target.checked;
                      setHasAssistant(val);
                      notifyChanges({ hasAssistant: val });
                    }} 
                    className="rounded border-gray-300 text-[#E63946] focus:ring-0 cursor-pointer" 
                  />
                  <span>🙋‍♂️ Asistente de Viaje / Logística</span>
                </label>
                {hasAssistant && (
                  <div className="ml-6 space-y-1 bg-blue-50/60 p-2 rounded-lg border border-blue-200/80">
                    <p className="text-[10px] text-blue-900 font-medium">Contratación de Asistente:</p>
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-gray-700">
                      <input 
                        type="radio" 
                        name="assistantScope" 
                        checked={assistantScope === 'from_origin'}
                        onChange={() => {
                          setAssistantScope('from_origin');
                          notifyChanges({ assistantScope: 'from_origin' });
                        }}
                        className="text-[#E63946] focus:ring-0 cursor-pointer"
                      />
                      <span>Acompaña desde el origen (Ocupa 1 asiento)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-gray-700">
                      <input 
                        type="radio" 
                        name="assistantScope" 
                        checked={assistantScope === 'at_destination'}
                        onChange={() => {
                          setAssistantScope('at_destination');
                          notifyChanges({ assistantScope: 'at_destination' });
                        }}
                        className="text-[#E63946] focus:ring-0 cursor-pointer"
                      />
                      <span>Contratado únicamente en destino</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPackageOnly} 
                    onChange={(e) => {
                      const val = e.target.checked;
                      setIsPackageOnly(val);
                      if (val) setPassengers(0);
                      notifyChanges({ isPackageOnly: val, passengers: val ? 0 : 1 });
                    }} 
                    className="rounded border-gray-300 text-[#E63946] focus:ring-0 cursor-pointer" 
                  />
                  <span className="font-semibold text-gray-800">📦 Solo envío de paquete</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Modalidad */}
      <div className="relative">
        <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Modalidad</label>
        <button
          type="button"
          onClick={() => {
            setIsTripDropdownOpen(!isTripDropdownOpen);
            setIsVehicleDropdownOpen(false);
            setIsPaxDropdownOpen(false);
          }}
          className="bg-white border border-gray-300 hover:border-gray-400 text-gray-800 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-3 transition cursor-pointer shadow-2xs"
        >
          <span>{tripType === 'one-way' ? 'Sólo ida' : 'Ida y vuelta'}</span>
          <span className="text-[#E63946]">▼</span>
        </button>

        {isTripDropdownOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-56 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTripTypeChange('one-way')}
              className={`p-3 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                tripType === 'one-way' ? 'bg-[#E63946] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              ➔ <span className="text-center">Sólo ida</span>
            </button>
            <button
              type="button"
              onClick={() => handleTripTypeChange('round-trip')}
              className={`p-3 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                tripType === 'round-trip' ? 'bg-[#E63946] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              🔄 <span className="text-center">Ida y vuelta</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Fecha y Hora de Salida */}
      <div>
        <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Salida</label>
        <div className="flex gap-2">
          <input
            type="date"
            min={today}
            value={departureDate}
            onChange={(e) => handleDepartureChange(e.target.value, departureTime)}
            className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs focus:outline-none focus:border-[#E63946] shadow-2xs"
          />
          <input
            type="time"
            value={departureTime}
            onChange={(e) => handleDepartureChange(departureDate, e.target.value)}
            className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs focus:outline-none focus:border-[#E63946] shadow-2xs"
          />
        </div>
      </div>

      {/* 5. Secciones del Regreso (Si aplica) */}
      {tripType === 'round-trip' && (
        <>
          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">
              {isMultiDay ? 'Regreso (Pernocta Hotel)' : 'Regreso (Sincronizado)'}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                min={departureDate}
                value={returnDate}
                onChange={(e) => handleReturnDateChange(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs focus:outline-none focus:border-[#E63946] shadow-2xs"
              />
              <input
                type="time"
                value={returnTime}
                onChange={(e) => handleReturnTimeChange(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs focus:outline-none focus:border-[#E63946] shadow-2xs"
              />
            </div>
          </div>

          {!isMultiDay ? (
            <div>
              <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Estancia / Espera</label>
              <select
                value={waitingHours}
                onChange={(e) => handleWaitingChange(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs font-bold focus:outline-none focus:border-[#E63946] shadow-2xs h-[38px]"
              >
                <option value={0}>Sin espera (Regreso de la unidad)</option>
                <option value={-1}>Sin espera (Regreso programado a la hora indicada)</option>
                <option value={1}>1 hora de espera</option>
                <option value={2}>2 horas de espera</option>
                <option value={3}>3 horas de espera</option>
                <option value={4}>4 horas de espera (Medio día)</option>
                <option value={5}>5 horas de espera</option>
                <option value={6}>6 horas de espera</option>
                <option value={7}>7 horas de espera</option>
                <option value={8}>8 horas de espera (Jornada completa)</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  const newVal = !releaseUnitBetweenTrips;
                  setReleaseUnitBetweenTrips(newVal);
                  notifyChanges({ releaseUnitBetweenTrips: newVal });
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                  releaseUnitBetweenTrips
                    ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs hover:bg-blue-100'
                    : 'bg-amber-100/90 border-amber-300 text-amber-900 shadow-xs hover:bg-amber-200'
                }`}
              >
                <span>{releaseUnitBetweenTrips ? '🔄' : '🏨'}</span>
                <div className="text-left">
                  <span className="block font-bold">
                    {releaseUnitBetweenTrips
                      ? 'Liberar unidad (2 Viajes)'
                      : `Guardia / Pernocta: ${waitingHours < 0 ? 0 : waitingHours} horas`}
                  </span>
                  <span className="text-[9px] opacity-80 block">
                    {releaseUnitBetweenTrips
                      ? 'Sin pernocta ni chofer en destino (Ahorro)'
                      : 'Chofer a disposición + Viáticos y bolsón local'}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Configuración de Puntos de Regreso */}
          <div className="w-full bg-white/90 border border-amber-200 p-3 rounded-lg flex flex-col gap-2.5 mt-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invertStopsOnReturn}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setInvertStopsOnReturn(val);
                    notifyChanges({ invertStopsOnReturn: val });
                  }}
                  className="rounded border-gray-300 text-[#E63946] focus:ring-0 cursor-pointer"
                />
                <span>🔄 Invertir orden geográfico de paradas en el regreso (Destino ➔ Paradas N...1 ➔ Origen)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDifferentReturnPoint}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setHasDifferentReturnPoint(val);
                    notifyChanges({ hasDifferentReturnPoint: val });
                  }}
                  className="rounded border-gray-300 text-[#E63946] focus:ring-0 cursor-pointer"
                />
                <span>📍 Destino final de regreso es distinto al origen inicial</span>
              </label>
            </div>

            {hasDifferentReturnPoint && (
              <input
                type="text"
                placeholder="Ingresa la dirección exacta del nuevo punto final de regreso..."
                value={customReturnAddress}
                onChange={(e) => {
                  setCustomReturnAddress(e.target.value);
                  notifyChanges({ customReturnAddress: e.target.value });
                }}
                className="bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:border-[#E63946] w-full"
              />
            )}
          </div>
        </>
      )}

    </div>
  );
}