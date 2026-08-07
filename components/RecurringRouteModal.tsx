'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface RecurringRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteLoaded: (routeData: any) => void;
}

export default function RecurringRouteModal({ isOpen, onClose, onRouteLoaded }: RecurringRouteModalProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'routes-list'>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(''); // Guarda el código simulado para pruebas
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setErrorMessage('Por favor, ingresa un número telefónico válido a 10 dígitos.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    // Generamos un código OTP aleatorio de 4 dígitos para pruebas
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    
    // También lo mandamos a la consola del navegador por si acaso
    console.log(`🔑 [OTP SIMULADO] Tu código de acceso para ${phone} es: ${randomOtp}`);

    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setErrorMessage('Ingresa el código de validación completo.');
      return;
    }

    // Validación opcional estricta contra el código generado o bypass flexible para pruebas
    if (otpCode !== generatedOtp && otpCode !== '1234') {
      setErrorMessage('Código incorrecto. Revisa el código de prueba indicado arriba.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      // Consultamos todas las rutas en Supabase que coincidan con el teléfono ingresado
      const { data, error } = await supabase
        .from('recurring_routes')
        .select('*')
        .eq('phone', phone);

      setIsLoading(false);

      if (error) {
        console.error('Error al consultar Supabase:', error);
        setErrorMessage('Hubo un error al buscar las rutas asociadas.');
        return;
      }

      if (!data || data.length === 0) {
        setErrorMessage(`No se encontraron rutas recurrentes para el teléfono ${phone}.`);
        return;
      }

      // Guardamos las rutas encontradas y abrimos el listado de selección
      setSavedRoutes(data);
      setStep('routes-list');

    } catch (err) {
      setIsLoading(false);
      console.error('Excepción:', err);
      setErrorMessage('Ocurrió un error inesperado al conectar con la base de datos.');
    }
  };

  const handleSelectRoute = (route: any) => {
    const formattedRoute = {
      tripType: route.trip_type,
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: route.departure_time || '08:00',
      counts: route.counts || { adults: 1, teenagers: 0, children: 0, infants: 0, support: 0, pets: 0, packageOnly: 0 },
      pickup: route.pickup || null,
      dropoff: route.dropoff || null,
      stops: route.stops || []
    };

    onRouteLoaded(formattedRoute);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setStep('phone');
    setPhone('');
    setOtpCode('');
    setGeneratedOtp('');
    setSavedRoutes([]);
    setErrorMessage('');
    onClose();
  };

  const formatTripType = (type: string) => {
    switch (type) {
      case 'one-way': return 'Sencillo (Ida)';
      case 'round-trip': return 'Ida y Vuelta';
      case 'multi-city': return 'Multidestino';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative text-gray-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Botón de cierre */}
        <button
          type="button"
          onClick={handleCloseModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer z-10"
        >
          ✕
        </button>

        {/* Cabecera dinámica */}
        <div className="mb-4 shrink-0">
          <span className="inline-block bg-[#E63946]/10 text-[#E63946] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
            Acceso Rápido
          </span>
          <h3 className="text-lg font-bold text-gray-900">
            {step === 'routes-list' ? 'Selecciona una Ruta Guardada' : 'Cargar Ruta Recurrente'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {step === 'phone' 
              ? 'Ingresa tu número registrado para enviarte una clave de acceso temporal.' 
              : step === 'otp'
              ? `Hemos simulado el envío de un código al número ${phone}.`
              : `Se encontraron ${savedRoutes.length} ruta(s) asociada(s) al ${phone}. Elige la que deseas cargar:`}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 shrink-0 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Asistente visual de pruebas para el OTP */}
        {step === 'otp' && generatedOtp && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex items-center justify-between">
            <span>🧪 <strong>Modo de prueba (SMS simulado):</strong> Tu código es <strong>{generatedOtp}</strong></span>
          </div>
        )}

        {/* Paso 1: Ingreso de Teléfono */}
        {step === 'phone' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Número Telefónico (10 dígitos)</label>
              <div className="flex">
                <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2.5 text-xs text-gray-600 flex items-center font-medium">
                  🇲🇽 +52
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="5569370056"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white border border-gray-300 rounded-r-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#E63946]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E63946] hover:bg-[#d90429] text-white font-medium py-3 rounded-xl text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? 'Generando clave...' : 'Enviar clave de acceso'}
            </button>
          </form>
        )}

        {/* Paso 2: Validación de Key / OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Clave de Validación (4 dígitos)</label>
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-center tracking-widest text-lg font-bold text-gray-800 focus:outline-none focus:border-[#E63946]"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl text-xs transition cursor-pointer"
              >
                Cambiar número
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 bg-[#E63946] hover:bg-[#d90429] text-white font-medium py-3 rounded-xl text-sm transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isLoading ? 'Verificando...' : 'Validar y Buscar Rutas'}
              </button>
            </div>
          </form>
        )}

        {/* Paso 3: Listado y Selección de Rutas */}
        {step === 'routes-list' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
            {savedRoutes.map((route, index) => (
              <div 
                key={route.id || index}
                className="bg-gray-50 border border-gray-200 hover:border-[#E63946] p-4 rounded-xl transition space-y-2.5 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#0b0f19] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Ruta #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {formatTripType(route.trip_type)}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                    🕒 {route.departure_time || 'Sin hora'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-700">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#E63946] font-bold shrink-0">📍 Origen:</span>
                    <span className="truncate">{route.pickup?.address || 'No especificada'}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">🏁 Destino:</span>
                    <span className="truncate">{route.dropoff?.address || 'No especificada'}</span>
                  </div>

                  {route.stops && route.stops.length > 0 && (
                    <div className="text-[11px] text-amber-700 font-medium pl-4 pt-0.5">
                      ⚡ Paradas intermedias: {route.stops.length} punto(s)
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSelectRoute(route)}
                    className="bg-[#E63946] hover:bg-[#d90429] text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer shadow-xs"
                  >
                    Cargar esta ruta
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setSavedRoutes([]);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                ← Usar otro número telefónico
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}