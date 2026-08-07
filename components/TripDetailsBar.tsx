'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TripDetailsProps {
  onDetailsChange: (details: any) => void;
  initialData?: any;
}

export default function TripDetailsBar({ onDetailsChange, initialData }: TripDetailsProps) {
  const [tripType, setTripType] = useState<'one-way' | 'multi-city' | 'round-trip'>(initialData?.tripType || 'one-way');
  const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false);
  const [isPaxDropdownOpen, setIsPaxDropdownOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [departureDate, setDepartureDate] = useState<string>(initialData?.departureDate || today);
  const [departureTime, setDepartureTime] = useState<string>(initialData?.departureTime || '09:00');
  const [returnDate, setReturnDate] = useState<string>(initialData?.returnDate || today);
  const [returnTime, setReturnTime] = useState<string>(initialData?.returnTime || '18:00');
  const [waitingHours, setWaitingHours] = useState<number>(initialData?.waitingHours || 0);

  const [counts, setCounts] = useState(initialData?.counts || {
    adults: 0,
    teenagers: 0,
    children: 0,
    infants: 0,
    support: 0,
    pets: 0,
    packageOnly: 0
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sincronización automática si initialData cambia desde el modal recurrente
  useEffect(() => {
    if (initialData) {
      if (initialData.tripType) setTripType(initialData.tripType);
      if (initialData.departureDate) setDepartureDate(initialData.departureDate);
      if (initialData.departureTime) setDepartureTime(initialData.departureTime);
      if (initialData.returnDate) setReturnDate(initialData.returnDate);
      if (initialData.returnTime) setReturnTime(initialData.returnTime);
      if (initialData.waitingHours !== undefined) setWaitingHours(initialData.waitingHours);
      if (initialData.counts) setCounts(initialData.counts);
    }
  }, [initialData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTripDropdownOpen(false);
        setIsPaxDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifyChanges = (newTripType: string, newDepDate: string, newDepTime: string, newRetDate: string, newRetTime: string, newWaiting: number, newCounts: any) => {
    onDetailsChange({
      tripType: newTripType,
      departureDate: newDepDate,
      departureTime: newDepTime,
      returnDate: newRetDate,
      returnTime: newRetTime,
      waitingHours: newWaiting,
      counts: newCounts
    });
  };

  const updateCount = (key: keyof typeof counts, delta: number) => {
    let newVal = counts[key] + delta;
    if (newVal < 0) newVal = 0;

    const updated = { ...counts, [key]: newVal };

    const totalOccupants = updated.adults + updated.teenagers + updated.children + updated.infants;
    if (totalOccupants > 4) return;

    if (updated.support > 0 && updated.adults < 2) {
      updated.adults = 2;
    }

    setCounts(updated);
    notifyChanges(tripType, departureDate, departureTime, returnDate, returnTime, waitingHours, updated);
  };

  const handleTripTypeChange = (type: 'one-way' | 'multi-city' | 'round-trip') => {
    setTripType(type);
    setIsTripDropdownOpen(false);
    const resetWaiting = type === 'round-trip' ? waitingHours : 0;
    if (type !== 'round-trip') setWaitingHours(0);
    notifyChanges(type, departureDate, departureTime, returnDate, returnTime, resetWaiting, counts);
  };

  const totalPassengers = counts.adults + counts.teenagers + counts.children + counts.infants;

  const getSummaryText = () => {
    let parts = [];
    if (totalPassengers > 0) parts.push(`${totalPassengers}/4 pasajero(s)`);
    if (counts.support > 0) parts.push('♿ Eq. Asistencia');
    if (counts.pets > 0) parts.push('🐾 Mascotas');
    if (counts.packageOnly > 0) parts.push('📦 Paquete');
    return parts.length > 0 ? parts.join(' | ') : '1/4 pasajero(s) (Opcional)';
  };

  return (
    <div className="bg-[#F4F1EA] border border-gray-200 p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-center relative text-gray-800" ref={dropdownRef}>
      
      {/* 1. Modalidad de Viaje */}
      <div className="relative">
        <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Modalidad</label>
        <button
          type="button"
          onClick={() => { setIsTripDropdownOpen(!isTripDropdownOpen); setIsPaxDropdownOpen(false); }}
          className="bg-white border border-gray-300 hover:border-gray-400 text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition cursor-pointer shadow-2xs"
        >
          <span>{tripType === 'one-way' ? 'Sólo ida' : tripType === 'multi-city' ? 'Multidestino' : 'Ida y vuelta'}</span>
          <span className="text-[#E63946]">▼</span>
        </button>

        {isTripDropdownOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-72 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTripTypeChange('one-way')}
              className={`p-3 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-1 transition cursor-pointer ${tripType === 'one-way' ? 'bg-[#E63946] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              ➔ <span className="text-center">Sólo ida</span>
            </button>
            <button
              type="button"
              onClick={() => handleTripTypeChange('multi-city')}
              className={`p-3 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-1 transition cursor-pointer ${tripType === 'multi-city' ? 'bg-[#E63946] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              🔀 <span className="text-center">Multidestino</span>
            </button>
            <button
              type="button"
              onClick={() => handleTripTypeChange('round-trip')}
              className={`p-3 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-1 transition cursor-pointer ${tripType === 'round-trip' ? 'bg-[#E63946] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              🔄 <span className="text-center">Ida y vuelta</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Fecha y Hora de Salida */}
      <div>
        <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Salida</label>
        <div className="flex gap-2">
          <input
            type="date"
            min={today}
            value={departureDate}
            onChange={(e) => {
              setDepartureDate(e.target.value);
              notifyChanges(tripType, e.target.value, departureTime, returnDate, returnTime, waitingHours, counts);
            }}
            className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs focus:outline-none focus:border-[#E63946] shadow-2xs"
          />
          <input
            type="time"
            value={departureTime}
            onChange={(e) => {
              setDepartureTime(e.target.value);
              notifyChanges(tripType, departureDate, e.target.value, returnDate, returnTime, waitingHours, counts);
            }}
            className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs focus:outline-none focus:border-[#E63946] shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Fecha, Hora de Regreso y Horas de Espera */}
      {tripType === 'round-trip' && (
        <>
          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Regreso</label>
            <div className="flex gap-2">
              <input
                type="date"
                min={departureDate}
                value={returnDate}
                onChange={(e) => {
                  setReturnDate(e.target.value);
                  notifyChanges(tripType, departureDate, departureTime, e.target.value, returnTime, waitingHours, counts);
                }}
                className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs focus:outline-none focus:border-[#E63946] shadow-2xs"
              />
              <input
                type="time"
                value={returnTime}
                onChange={(e) => {
                  setReturnTime(e.target.value);
                  notifyChanges(tripType, departureDate, departureTime, returnDate, e.target.value, waitingHours, counts);
                }}
                className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs focus:outline-none focus:border-[#E63946] shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Estancia / Espera</label>
            <select
              value={waitingHours}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWaitingHours(val);
                notifyChanges(tripType, departureDate, departureTime, returnDate, returnTime, val, counts);
              }}
              className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 text-xs font-bold focus:outline-none focus:border-[#E63946] shadow-2xs h-[38px]"
            >
              <option value={0}>Sin espera (Regreso inmediato)</option>
              <option value={1}>1 hora de espera</option>
              <option value={2}>2 horas de espera</option>
              <option value={3}>3 horas de espera</option>
              <option value={4}>4 horas de espera (Medio día)</option>
              <option value={5}>5 horas de espera</option>
              <option value={6}>6 horas de espera</option>
              <option value={7}>7 horas de espera</option>
              <option value={8}>8 horas de espera (Jornada)</option>
            </select>
          </div>
        </>
      )}

      {/* 4. Selector de Pasajeros */}
      <div className="relative">
        <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Pasajeros / Ocupantes (Máx. 4)</label>
        <button
          type="button"
          onClick={() => { setIsPaxDropdownOpen(!isPaxDropdownOpen); setIsTripDropdownOpen(false); }}
          className="bg-white border border-gray-300 hover:border-gray-400 text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-4 transition cursor-pointer shadow-2xs"
        >
          <span>{getSummaryText()}</span>
          <span className="text-[#E63946]">▼</span>
        </button>

        {isPaxDropdownOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-80 space-y-4 max-h-[400px] overflow-y-auto">
            
            {/* Adultos */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs font-bold text-gray-900">Adulto</p>
                <p className="text-[10px] text-gray-500">Mayores de 18 años</p>
                <p className="text-[10px] text-amber-600">Tercera edad con dificultades, requiere joven o adulto acompañante.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateCount('adults', -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-800 cursor-pointer">-</button>
                <span className="text-sm font-bold text-gray-900 w-4 text-center">{counts.adults}</span>
                <button type="button" onClick={() => updateCount('adults', 1)} className="w-7 h-7 rounded-full border border-[#E63946] bg-[#E63946]/10 flex items-center justify-center text-[#E63946] font-bold cursor-pointer">+</button>
              </div>
            </div>

            {/* Adolescentes */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs font-bold text-gray-900">Adolescente (12 a 17 años)</p>
                <p className="text-[10px] text-amber-600">Requiere adulto acompañante.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateCount('teenagers', -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-800 cursor-pointer">-</button>
                <span className="text-sm font-bold text-gray-900 w-4 text-center">{counts.teenagers}</span>
                <button type="button" onClick={() => updateCount('teenagers', 1)} className="w-7 h-7 rounded-full border border-[#E63946] bg-[#E63946]/10 flex items-center justify-center text-[#E63946] font-bold cursor-pointer">+</button>
              </div>
            </div>

            {/* Niños */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs font-bold text-gray-900">Niño (2 a 11 años)</p>
                <p className="text-[10px] text-amber-600">Requiere adulto acompañante.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateCount('children', -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-800 cursor-pointer">-</button>
                <span className="text-sm font-bold text-gray-900 w-4 text-center">{counts.children}</span>
                <button type="button" onClick={() => updateCount('children', 1)} className="w-7 h-7 rounded-full border border-[#E63946] bg-[#E63946]/10 flex items-center justify-center text-[#E63946] font-bold cursor-pointer">+</button>
              </div>
            </div>

            {/* Infantes */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs font-bold text-gray-900">Infante (menores de 2 años)</p>
                <p className="text-[10px] text-amber-600">Requiere adulto acompañante.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateCount('infants', -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-800 cursor-pointer">-</button>
                <span className="text-sm font-bold text-gray-900 w-4 text-center">{counts.infants}</span>
                <button type="button" onClick={() => updateCount('infants', 1)} className="w-7 h-7 rounded-full border border-[#E63946] bg-[#E63946]/10 flex items-center justify-center text-[#E63946] font-bold cursor-pointer">+</button>
              </div>
            </div>

            {/* Asistencia */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs font-bold text-gray-900">Equipo de asistencia</p>
                <p className="text-[10px] text-amber-600">Mínimo +1 adulto acompañante requerido, si el usuario utiliza silla de ruedas o está enfermo.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateCount('support', -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-800 cursor-pointer">-</button>
                <span className="text-sm font-bold text-gray-900 w-4 text-center">{counts.support}</span>
                <button type="button" onClick={() => updateCount('support', 1)} className="w-7 h-7 rounded-full border border-[#E63946] bg-[#E63946]/10 flex items-center justify-center text-[#E63946] font-bold cursor-pointer">+</button>
              </div>
            </div>

            {/* Mascotas */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs font-bold text-gray-900">Mascotas</p>
                <p className="text-[10px] text-gray-500">Perros y gatos</p>
                <p className="text-[10px] text-amber-600">Requiere transportador, correa y asistencia del usuario.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateCount('pets', -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-800 cursor-pointer">-</button>
                <span className="text-sm font-bold text-gray-900 w-4 text-center">{counts.pets}</span>
                <button type="button" onClick={() => updateCount('pets', 1)} className="w-7 h-7 rounded-full border border-[#E63946] bg-[#E63946]/10 flex items-center justify-center text-[#E63946] font-bold cursor-pointer">+</button>
              </div>
            </div>

            {/* Paquete */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-900">Paquete</p>
                <p className="text-[10px] text-amber-600">Mensajería exprés (requiere inspección física visual)</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateCount('packageOnly', -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-800 cursor-pointer">-</button>
                <span className="text-sm font-bold text-gray-900 w-4 text-center">{counts.packageOnly}</span>
                <button type="button" onClick={() => updateCount('packageOnly', 1)} className="w-7 h-7 rounded-full border border-[#E63946] bg-[#E63946]/10 flex items-center justify-center text-[#E63946] font-bold cursor-pointer">+</button>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}