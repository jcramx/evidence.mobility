'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
}

export default function DriverQuickView() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  
  // Estado para la ubicación detectada del usuario
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([]);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDestList, setShowDestList] = useState(false);

  const pickupRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  
  const [vehicleConfig, setVehicleConfig] = useState({
    type: 'sedan',
    passengers: 1,
    gasType: 'magna',
    transmission: 'manual',
    kmPerLiter: 12.0
  });
  
  const [isConfigLocked, setIsConfigLocked] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [estimatedKm, setEstimatedKm] = useState<number>(0);
  const [estimatedMins, setEstimatedMins] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const [originCoordsState, setOriginCoordsState] = useState<[number, number] | null>(null);
  const [destCoordsState, setDestCoordsState] = useState<[number, number] | null>(null);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  // 1. Detectar ubicación real del usuario al montar el componente
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.warn("Ubicación no disponible, usando centro por defecto (CDMX)");
          setUserCoords([-99.1332, 19.4326]);
        }
      );
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(e.target as Node)) setShowPickupList(false);
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowDestList(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Fetch de sugerencias optimizado a nivel nacional (sin sesgo de proximidad estricta que entierre landmarks)
  const fetchSuggestions = async (query: string, isOrigin: boolean) => {
    if (!query || query.length < 3) {
      if (isOrigin) setPickupSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    try {
      // Se elimina el parámetro 'proximity' en el autocompletado de texto. 
      // Al usar únicamente 'country=mx', Mapbox busca en todo el país permitiendo encontrar 
      // con precisión lugares icónicos nacionales (como Hotel Marquis Reforma o AICM) 
      // sin que coincidencias de nombres de calles en otras ciudades bloqueen el resultado.
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&country=mx&types=address,poi`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.features) {
        const formatted: Suggestion[] = data.features.map((f: any) => ({
          id: f.id,
          place_name: f.place_name,
          center: f.center
        }));
        if (isOrigin) setPickupSuggestions(formatted);
        else setDestSuggestions(formatted);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    
    setIsLoading(true);

    try {
      let originCoords: [number, number] = originCoordsState || userCoords || [-99.1332, 19.4326];
      let destCoords: [number, number] = destCoordsState || [-99.1332, 19.4326];

      // Geocodificación de respaldo si escribieron manualmente sin seleccionar de la lista
      if (!originCoordsState && pickup) {
        const urlOrig = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(pickup)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=mx&types=address,poi`;
        const resO = await fetch(urlOrig);
        const dataO = await resO.json();
        if (dataO.features && dataO.features.length > 0) {
          originCoords = dataO.features[0].center;
          setOriginCoordsState(originCoords);
        }
      }

      if (!destCoordsState) {
        const urlDest = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=mx&types=address,poi`;
        const resD = await fetch(urlDest);
        const dataD = await resD.json();
        if (dataD.features && dataD.features.length > 0) {
          destCoords = dataD.features[0].center;
          setDestCoordsState(destCoords);
        }
      }

      let km = 5.0;
      let mins = 15;

      if (MAPBOX_TOKEN && originCoords && destCoords) {
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

      // Fórmula de precios justa y competitiva
      const baseFee = vehicleConfig.type === 'sedan' ? 30 : 80;
      const gasPrice = vehicleConfig.gasType === 'magna' ? 24.50 : 26.20;
      const fuelCostPerKm = gasPrice / (vehicleConfig.kmPerLiter || 12);
      
      const kmRate = 9 + fuelCostPerKm; 
      const distanceCost = km * kmRate;
      const timeCost = mins * 1.0; 
      const minFare = vehicleConfig.type === 'sedan' ? 60 : 120;

      const rawTotal = Math.max(minFare, baseFee + distanceCost + timeCost);
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
      `*Distancia:* ~${estimatedKm} km (${estimatedMins} min)\n` +
      `----------------------------------\n` +
      `*TOTAL ESTIMADO:* $${estimatedFare || 70} MXN\n\n` +
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
        
        {/* Cabecera */}
        <div className="space-y-1 pb-4 border-b border-gray-800/80">
          <div className="flex justify-between items-center">
            <span className="bg-[#E63946] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Modo Conductor ⚡
            </span>
            <span className="text-xl font-bold tracking-tight flex items-center gap-1 text-white">
          evidence<span className="text-[#E63946]">.mobility</span></span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight pt-2">Cotizador Competitivo</h1>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleCalculate} className="space-y-4">
          
          {/* Configuración Base */}
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
          </div>

          {/* Ruta con Autocompletado (Búsqueda Nacional Optimizada) */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">2. Ruta y Pasajeros</span>

            {/* Input Origen */}
            <div ref={pickupRef} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-3 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-red-500 font-bold block">Origen</label>
              <input 
                type="text" 
                value={pickup} 
                onChange={(e) => {
                  setPickup(e.target.value);
                  fetchSuggestions(e.target.value, true);
                  setShowPickupList(true);
                }}
                onFocus={() => setShowPickupList(true)}
                className="w-full bg-transparent text-sm font-semibold focus:outline-none text-white placeholder-gray-600"
                placeholder="Escribe hotel, lugar o dirección..."
                required
              />
              {showPickupList && pickupSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                  {pickupSuggestions.map((item) => (
                    <li 
                      key={item.id}
                      onClick={() => {
                        setPickup(item.place_name);
                        setOriginCoordsState(item.center);
                        setShowPickupList(false);
                      }}
                      className="p-2.5 text-xs text-gray-200 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-none"
                    >
                      {item.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Input Destino */}
            <div ref={destRef} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-3 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-blue-400 font-bold block">Destino</label>
              <input 
                type="text" 
                value={destination} 
                onChange={(e) => {
                  setDestination(e.target.value);
                  fetchSuggestions(e.target.value, false);
                  setShowDestList(true);
                }}
                onFocus={() => setShowDestList(true)}
                className="w-full bg-transparent text-sm font-semibold focus:outline-none text-white placeholder-gray-600"
                placeholder="Escribe hotel, lugar o dirección..."
                required
              />
              {showDestList && destSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                  {destSuggestions.map((item) => (
                    <li 
                      key={item.id}
                      onClick={() => {
                        setDestination(item.place_name);
                        setDestCoordsState(item.center);
                        setShowDestList(false);
                      }}
                      className="p-2.5 text-xs text-gray-200 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-none"
                    >
                      {item.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
            {isLoading ? 'Calculando tarifa justa...' : '⚡ Calcular Oferta Competitiva'}
          </button>
        </form>

        {/* Tarjeta de Resultado */}
        {estimatedFare !== null && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Distancia y tiempo estimado:</span>
                <span className="text-xs font-bold text-gray-200">~{estimatedKm} km ({estimatedMins} min)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-medium">Tarifa Propuesta:</span>
                <span className="text-xl font-extrabold text-emerald-400">${estimatedFare} MXN</span>
              </div>
            </div>

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

        <div className="text-center text-[10px] text-gray-500 pt-2 border-t border-gray-800/80 pb-4 space-y-1">
          <div>Ubicación detectada: {userCoords ? "Activa 🛰️" : "Cargando..."}</div>
          <div>evidence.mobility • Operación en vía pública</div>
        </div>

        </div>
      </div>
    </div>
  );
}