'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function DriverQuickView() {
  const [pickup, setPickup] = useState('Ubicación Actual (GPS)');
  const [destination, setDestination] = useState('');
  
  const [vehicleConfig, setVehicleConfig] = useState({
    type: 'sedan',
    passengers: 1,
    gasType: 'magna',
    transmission: 'manual',
    kmPerLiter: 12.0
  });
  
  const [isConfigLocked, setIsConfigLocked] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [estimatedKm, setEstimatedKm] = useState<number>(12);
  const [estimatedMins, setEstimatedMins] = useState<number>(25);
  const [isLoading, setIsLoading] = useState(false);

  const [originCoordsState, setOriginCoordsState] = useState<[number, number] | null>(null);
  const [destCoordsState, setDestCoordsState] = useState<[number, number] | null>(null);

  type PlaceSuggestion = {
    id: string;
    place_name: string;
    text: string;
    center: [number, number];
    place_type?: string[];
    properties?: {
      address?: string;
      category?: string;
    };
  };

  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  const originSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destinationSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  /**
   * Busca lugares, POIs y direcciones como lo hace una app de navegación:
   * "T1 AICM", "Museo de Antropología", "Palacio de Bellas Artes", etc.
   *
   * La sugerencia seleccionada conserva sus coordenadas para no depender
   * nuevamente del texto al momento de calcular la ruta.
   */
  const searchPlaces = async (
    text: string,
    referenceCoords?: [number, number]
  ): Promise<PlaceSuggestion[]> => {
    if (!MAPBOX_TOKEN || text.trim().length < 2) return [];

    try {
      const queryText = text.trim();
      const proximityCoords = referenceCoords
        ? `${referenceCoords[0]},${referenceCoords[1]}`
        : '-99.1332,19.4326';

      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryText)}.json` +
        `?access_token=${MAPBOX_TOKEN}` +
        `&autocomplete=true` +
        `&fuzzyMatch=true` +
        `&language=es` +
        `&country=mx` +
        `&limit=6` +
        `&proximity=${proximityCoords}`;

      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();

      return (data.features || []).map((feature: any) => ({
        id: feature.id,
        place_name: feature.place_name,
        text: feature.text || feature.place_name,
        center: feature.center as [number, number],
        place_type: feature.place_type,
        properties: feature.properties,
      }));
    } catch (error) {
      console.error('Error buscando lugares en Mapbox:', error);
      return [];
    }
  };

  const handlePlaceInput = (
    field: 'origin' | 'destination',
    value: string
  ) => {
    if (field === 'origin') {
      setPickup(value);
      setOriginCoordsState(null);

      if (originSearchTimer.current) clearTimeout(originSearchTimer.current);

      if (value.trim().length < 2) {
        setOriginSuggestions([]);
        return;
      }

      setActiveField('origin');
      originSearchTimer.current = setTimeout(async () => {
        setIsSearchingPlaces(true);
        const results = await searchPlaces(value);
        setOriginSuggestions(results);
        setIsSearchingPlaces(false);
      }, 300);
    } else {
      setDestination(value);
      setDestCoordsState(null);

      if (destinationSearchTimer.current) clearTimeout(destinationSearchTimer.current);

      if (value.trim().length < 2) {
        setDestinationSuggestions([]);
        return;
      }

      setActiveField('destination');
      destinationSearchTimer.current = setTimeout(async () => {
        setIsSearchingPlaces(true);
        // El origen ayuda a priorizar resultados cercanos al trayecto.
        const results = await searchPlaces(value, originCoordsState || undefined);
        setDestinationSuggestions(results);
        setIsSearchingPlaces(false);
      }, 300);
    }
  };

  const selectPlace = (
    field: 'origin' | 'destination',
    place: PlaceSuggestion
  ) => {
    if (field === 'origin') {
      setPickup(place.place_name);
      setOriginCoordsState(place.center);
      setOriginSuggestions([]);
    } else {
      setDestination(place.place_name);
      setDestCoordsState(place.center);
      setDestinationSuggestions([]);
    }

    setActiveField(null);
  };

  const getCoordinates = async (
    text: string,
    referenceCoords?: [number, number]
  ): Promise<[number, number]> => {
    if (text.toLowerCase().includes('ubicación actual') || text.toLowerCase().includes('gps')) {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
            () => resolve([-99.1332, 19.4326]),
            { timeout: 5000 }
          );
        } else {
          resolve([-99.1332, 19.4326]);
        }
      });
    }

    const results = await searchPlaces(text, referenceCoords);

    if (results.length > 0) {
      return results[0].center;
    }

    return [-99.1332, 19.4326];
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    
    setIsLoading(true);

    try {
      // 1. Usamos las coordenadas seleccionadas de Mapbox.
      // Si el usuario escribió y no seleccionó una sugerencia, geocodificamos el texto.
      const originCoords = originCoordsState || await getCoordinates(pickup);
      setOriginCoordsState(originCoords);

      // 2. El origen se utiliza como proximidad para mejorar la búsqueda del destino.
      const destCoords = destCoordsState || await getCoordinates(destination, originCoords);
      setDestCoordsState(destCoords);

      let km = 12;
      let mins = 25;

      if (MAPBOX_TOKEN) {
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
        const dirRes = await fetch(directionsUrl);
        const dirData = await dirRes.json();

        if (dirData.routes && dirData.routes.length > 0) {
          const route = dirData.routes[0];
          km = route.distance / 1000;
          mins = Math.round(route.duration / 60);
        }
      }

      setEstimatedKm(parseFloat(km.toFixed(1)));
      setEstimatedMins(mins);

      // Fórmula optimizada para competir con Uber/Taxi en trayectos cortos y largos
      const baseFee = vehicleConfig.type === 'sedan' ? 40 : 100;
      const gasPrice = vehicleConfig.gasType === 'magna' ? 24.50 : 26.20;
      const fuelCostPerKm = gasPrice / (vehicleConfig.kmPerLiter || 12);
      const transmissionMultiplier = vehicleConfig.transmission === 'automatic' ? 1.05 : 1.0;

      const distanceCost = km * (10 + fuelCostPerKm) * transmissionMultiplier;
      const timeCost = mins * 2.0;
      const passengerExtra = vehicleConfig.passengers > 4 ? 1.2 : 1.0;

      const rawTotal = (baseFee + distanceCost + timeCost) * passengerExtra;
      const total = Math.round(rawTotal / 5) * 5;
      
      setEstimatedFare(total);
    } catch (error) {
      console.error('Error general al calcular ruta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(
      `*evidence.mobility - COTIZACIÓN EXPRÉS*\n` +
      `----------------------------------\n` +
      `*Vehículo:* ${vehicleConfig.type === 'sedan' ? 'Sedán Estándar (1-4 pasajeros)' : 'Van / SUV Ejecutiva (5+ pasajeros)'}\n` +
      `*Origen:* ${pickup}\n` +
      `*Destino:* ${destination}\n` +
      `*Pasajeros:* ${vehicleConfig.passengers}\n` +
      `*Distancia real:* ~${estimatedKm} km (${estimatedMins} min)\n` +
      `----------------------------------\n` +
      `*TOTAL ESTIMADO:* $${estimatedFare || 150} MXN\n\n` +
      `Reserva asegurada. Responda a este mensaje para confirmar su viaje.`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  const handleOpenGoogleMaps = () => {
    if (!originCoordsState || !destCoordsState) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${originCoordsState[1]},${originCoordsState[0]}&destination=${destCoordsState[1]},${destCoordsState[0]}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleOpenWaze = () => {
    if (!destCoordsState) return;
    const url = `https://www.waze.com/ul?ll=${destCoordsState[1]},${destCoordsState[0]}&navigate=yes`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#0b0f19] text-white font-sans overflow-hidden">
      <div className="mx-auto w-full max-w-[430px] h-full overflow-y-auto overscroll-contain px-4 py-6">
        <div className="w-full space-y-5">
        
        {/* Cabecera Móvil Exclusiva */}
        <div className="space-y-1 pb-4 border-b border-gray-800/80">
          <div className="flex justify-between items-center">
            <span className="bg-[#E63946] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Modo Conductor ⚡
            </span>
            <span className="text-xl font-bold tracking-tight flex items-center gap-1 text-white">
          evidence<span className="text-[#E63946]">.mobility</span></span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight pt-2">Cotizador Exprés</h1>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleCalculate} className="space-y-4">
          
          {/* Paso 1: Configuración Base de Unidad */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-wider text-red-500 font-bold">1. Configuración Base de Unidad</span>
              <button
                type="button"
                onClick={() => setIsConfigLocked(!isConfigLocked)}
                className="text-[10px] bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-gray-300 transition cursor-pointer"
              >
                {isConfigLocked ? 'Editar' : 'Bloquear'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Combustible</label>
                <select
                  disabled={isConfigLocked}
                  value={vehicleConfig.gasType}
                  onChange={(e) => setVehicleConfig({...vehicleConfig, gasType: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs outline-none disabled:opacity-60 cursor-pointer"
                >
                  <option value="magna">Magna (87 Oct.)</option>
                  <option value="premium">Premium (91+ Oct.)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Transmisión</label>
                <select
                  disabled={isConfigLocked}
                  value={vehicleConfig.transmission}
                  onChange={(e) => setVehicleConfig({...vehicleConfig, transmission: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs outline-none disabled:opacity-60 cursor-pointer"
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automática</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Rendimiento (km/L)</label>
              <input
                type="number"
                step="0.5"
                disabled={isConfigLocked}
                value={vehicleConfig.kmPerLiter}
                onChange={(e) => setVehicleConfig({...vehicleConfig, kmPerLiter: parseFloat(e.target.value) || 12})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs outline-none disabled:opacity-60"
                placeholder="Ej. 12.5"
              />
            </div>
          </div>

          {/* Paso 2: Ruta y Pasajeros */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">2. Ruta y Pasajeros</span>
            <span className="text-[9px] text-gray-500 block">Puedes buscar por dirección, nombre de lugar o punto de interés.</span>

            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-red-500 font-bold block">Origen</label>
                <input
                  type="text"
                  value={pickup}
                  onFocus={() => setActiveField('origin')}
                  onChange={(e) => handlePlaceInput('origin', e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none text-white"
                  placeholder="T1 AICM, ubicación actual, dirección..."
                  autoComplete="off"
                />
                {originCoordsState && (
                  <span className="text-[9px] text-emerald-400 block pt-1">✓ Ubicación identificada</span>
                )}
              </div>

              {activeField === 'origin' && originSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-950 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  {originSuggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectPlace('origin', place)}
                      className="w-full text-left px-3 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800 transition"
                    >
                      <span className="block text-xs font-semibold text-white">📍 {place.text}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{place.place_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-blue-400 font-bold block">Destino</label>
                <input
                  type="text"
                  value={destination}
                  onFocus={() => setActiveField('destination')}
                  onChange={(e) => handlePlaceInput('destination', e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none text-white placeholder-gray-600"
                  placeholder="Museo de Antropología, Bellas Artes..."
                  autoComplete="off"
                  required
                />
                {destCoordsState && (
                  <span className="text-[9px] text-emerald-400 block pt-1">✓ Lugar identificado</span>
                )}
              </div>

              {activeField === 'destination' && destinationSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-950 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  {destinationSuggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectPlace('destination', place)}
                      className="w-full text-left px-3 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800 transition"
                    >
                      <span className="block text-xs font-semibold text-white">📍 {place.text}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{place.place_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selección de Flota */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setVehicleConfig({...vehicleConfig, type: 'sedan'}); if(vehicleConfig.passengers > 4) setVehicleConfig(prev => ({...prev, type: 'sedan', passengers: 4})); }}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                vehicleConfig.type === 'sedan' 
                  ? 'bg-[#E63946]/10 border-[#E63946] text-white' 
                  : 'bg-gray-900 border-gray-800 text-gray-400'
              }`}
            >
              <span className="text-xs font-bold">🚗 Sedán Estándar</span>
              <span className="text-[10px] text-gray-500 mt-1">1 a 4 pasajeros</span>
            </button>

            <button
              type="button"
              onClick={() => { setVehicleConfig({...vehicleConfig, type: 'van'}); if(vehicleConfig.passengers < 5) setVehicleConfig(prev => ({...prev, type: 'van', passengers: 5})); }}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                vehicleConfig.type === 'van' 
                  ? 'bg-[#E63946]/10 border-[#E63946] text-white' 
                  : 'bg-gray-900 border-gray-800 text-gray-400'
              }`}
            >
              <span className="text-xs font-bold">🚐 Van / SUV</span>
              <span className="text-[10px] text-gray-500 mt-1">5+ pax (Flota externa)</span>
            </button>
          </div>

          {/* Selector de Pasajeros */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <span className="text-xs font-medium text-gray-300 block">Número de pasajeros</span>
              <span className="text-[10px] text-gray-500">Tarifa fija por vehículo completo</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setVehicleConfig({...vehicleConfig, passengers: Math.max(1, vehicleConfig.passengers - 1)})}
                className="w-8 h-8 bg-gray-800 rounded-lg font-bold text-sm flex items-center justify-center hover:bg-gray-700 cursor-pointer"
              >
                -
              </button>
              <span className="text-sm font-bold w-4 text-center">{vehicleConfig.passengers}</span>
              <button 
                type="button" 
                onClick={() => setVehicleConfig({...vehicleConfig, passengers: Math.min(8, vehicleConfig.passengers + 1)})}
                className="w-8 h-8 bg-gray-800 rounded-lg font-bold text-sm flex items-center justify-center hover:bg-gray-700 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Botón de cálculo */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#E63946] hover:bg-[#d90429] text-white font-bold py-4 rounded-2xl text-sm transition cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Calculando ruta con Mapbox...' : '⚡ Calcular Oferta Precisa'}
          </button>
        </form>

        {/* Tarjeta de Resultado, Oferta y Navegación Externa */}
        {estimatedFare !== null && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Distancia y tiempo vial:</span>
                <span className="text-xs font-bold text-gray-200">~{estimatedKm} km ({estimatedMins} min)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-medium">Propuesta:</span>
                <span className="text-xl font-extrabold text-emerald-400">${estimatedFare} MXN</span>
              </div>
            </div>

            {/* Botones de Navegación GPS Externa */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenGoogleMaps}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                🗺️ Google Maps
              </button>

              <button
                type="button"
                onClick={handleOpenWaze}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                🚗 Waze
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              💬 Enviar Cotización por WhatsApp
            </button>
          </div>
        )}

        {/* Pie minimalista */}
        <div className="text-center text-[10px] text-gray-500 pt-2 border-t border-gray-800/80 pb-4">
          evidence.mobility • Operación en vía pública
        </div>

        </div>
      </div>
    </div>
  );
}