'use client';

import React, { useState } from 'react';

interface BookingCalendarProps {
  onSlotSelected: (dateTime: string) => void;
}

export default function BookingCalendar({ onSlotSelected }: BookingCalendarProps) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const timeSlots = [
    '08:00 - 10:00',
    '10:30 - 12:30',
    '13:00 - 15:00',
    '15:30 - 17:30',
    '18:00 - 20:00',
    '20:30 - 22:30'
  ];

  const handleTimeSelect = (slot: string) => {
    setSelectedTimeSlot(slot);
    const fullDateTime = `${selectedDate} ${slot.split(' - ')[0]}`;
    onSlotSelected(fullDateTime);
  };

  return (
    <div id="calendario" className="bg-gray-900/60 border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">2. Agenda del Conductor</h3>
        <p className="text-xs text-gray-400 mb-4">
          Selecciona la fecha de tu servicio y elige una franja horaria disponible.
        </p>

        {/* Selector de Fecha con filtro invertido para forzar icono blanco en navegadores oscuros */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-300 mb-1">Fecha del Servicio</label>
          <input 
            type="date" 
            min={today}
            className="w-full bg-[#0A1128] border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#E63946] transition [color-scheme:dark]"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTimeSlot(null);
            }}
          />
        </div>

        {/* Parrilla Interactiva de Horarios */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-300 mb-2">Franjas Horarias Disponibles</label>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((slot, index) => {
              const isSelected = selectedTimeSlot === slot;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTimeSelect(slot)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium transition border text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#E63946] border-[#E63946] text-white shadow-md'
                      : 'bg-[#0A1128] border-gray-700 text-gray-300 hover:border-[#E63946] hover:text-white'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Estado de confirmación visual */}
      <div className="mt-4 pt-4 border-t border-gray-800 text-xs">
        {selectedTimeSlot ? (
          <div className="bg-green-950/40 border border-green-800/60 p-3 rounded-lg text-green-300 flex items-center justify-between">
            <span>✓ Horario agendado: {selectedDate} ({selectedTimeSlot})</span>
            <span className="font-mono text-[10px] bg-green-900/50 px-2 py-0.5 rounded">evidence.sys</span>
          </div>
        ) : (
          <p className="text-gray-500 italic">Selecciona una fecha y un horario libre para continuar.</p>
        )}
      </div>
    </div>
  );
}