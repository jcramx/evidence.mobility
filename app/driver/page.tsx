'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Suggestion {
  id: string;
  place_name: string;
}

export default function DriverQuickView() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  
  // Estado para la etiqueta dinámica de ubicación
  const [locationLabel, setLocationLabel] = useState('Ubicación Base (CDMX)');
  const [userCoords, setUserCoords] = useState<[number, number]>([-99.1605, 19.4270]);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([]);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDestList, setShowDestList] = useState(false);

  const pickupRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  
  const [sessionToken, setSessionToken] = useState<string>('');
  
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

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  useEffect(() => {
    setSessionToken(generateUUID());
  }, []);

  const fetchRegionName = async (lng: number, lat: number) => {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=region&language=es&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        setLocationLabel(`${data.features[0].text} 📍`);
      } else {
        setLocationLabel('GPS Activo 📍');
      }
    } catch (error) {
      setLocationLabel('GPS Activo 📍');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          setUserCoords([lng, lat]);
          setGpsActive(true);
          fetchRegionName(lng, lat);
        },
        () => {
          setGpsActive(false);
          setLocationLabel('Ubicación Base (CDMX) 🏙️');
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Navegación
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

  const fetchSuggestions = async (query: string, isOrigin: boolean) => {
    if (!query || query.length < 3) {
      if (isOrigin) setPickupSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    try {
      const proximity = `${userCoords[0]},${userCoords[1]}`;
      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}&country=mx&proximity=${proximity}&language=es&limit=6`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.suggestions) {
        const formatted: Suggestion[] = data.suggestions.map((s: any) => ({
          id: s.mapbox_id,
          place_name: s.full_address || s.name
        }));
        if (isOrigin) setPickupSuggestions(formatted);
        else setDestSuggestions(formatted);
      }
    } catch (e) { console.error(e); }
  };

  const handleSelectSuggestion = async (mapboxId: string, placeName: string, isOrigin: boolean) => {
    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const coords = data.features[0].geometry.coordinates as [number, number];
        if (isOrigin) { setPickup(placeName); setOriginCoordsState(coords); setShowPickupList(false); }
        else { setDestination(placeName); setDestCoordsState(coords); setShowDestList(false); }
        setSessionToken(generateUUID());
      }
    } catch (e) { console.error(e); }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    setIsLoading(true);

    try {
      let originCoords = originCoordsState || userCoords;
      let destCoords = destCoordsState || userCoords;

      // Calcular ruta
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
      const dirRes = await fetch(directionsUrl);
      const dirData = await dirRes.json();
      
      let km = 5.0; let mins = 15;
      if (dirData.routes && dirData.routes.length > 0) {
        km = dirData.routes[0].distance / 1000;
        mins = Math.round(dirData.routes[0].duration / 60);
      }

      setEstimatedKm(parseFloat(km.toFixed(1)));
      setEstimatedMins(mins);

      // Tarifa
      const baseFee = vehicleConfig.type === 'sedan' ? 30 : 80;
      const gasPrice = vehicleConfig.gasType === 'magna' ? 24.50 : 26.20;
      const fuelCostPerKm = gasPrice / vehicleConfig.kmPerLiter;
      const kmRate = 9 + fuelCostPerKm;
      const total = Math.round((Math.max(vehicleConfig.type === 'sedan' ? 60 : 120, baseFee + (km * kmRate) + (mins * 1.0))) / 5) * 5;
      
      setEstimatedFare(total);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#0b0f19] text-white font-sans overflow-hidden">
      <div className="mx-auto w-full max-w-[430px] h-full overflow-y-auto overscroll-contain px-4 py-6">
        <div className="w-full space-y-5">
        
        {/* Cabecera */}
        <div className="space-y-1 pb-4 border-b border-gray-800/80">
          <div className="flex justify-between items-center">
            <span className="bg-[#E63946] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Modo Conductor ⚡</span>
            <span className="text-xl font-bold text-white">evidence<span className="text-[#E63946]">.mobility</span></span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <h1 className="text-xl font-extrabold tracking-tight">Cotizador Competitivo</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded ${gpsActive ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-700' : 'bg-amber-900/60 text-amber-400 border border-amber-700'}`}>
              {locationLabel}
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-red-500 uppercase tracking-wider">
              1. Configuración Base 
              <button type="button" onClick={() => setIsConfigLocked(!isConfigLocked)} className="text-gray-400 underline">{isConfigLocked ? 'Editar' : 'Bloquear'}</button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">km/l</label>
                <input type="number" disabled={isConfigLocked} value={vehicleConfig.kmPerLiter} onChange={(e) => setVehicleConfig({...vehicleConfig, kmPerLiter: parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Gas</label>
                <select disabled={isConfigLocked} value={vehicleConfig.gasType} onChange={(e) => setVehicleConfig({...vehicleConfig, gasType: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white outline-none">
                  <option value="magna">Magna</option><option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Transm</label>
                <select disabled={isConfigLocked} value={vehicleConfig.transmission} onChange={(e) => setVehicleConfig({...vehicleConfig, transmission: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white outline-none">
                  <option value="manual">Manual</option><option value="automatic">Auto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rutas */}
          <div className="space-y-3">
             <div ref={pickupRef} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-3">
              <label className="text-[10px] font-bold text-red-500 uppercase">Origen</label>
              <input type="text" value={pickup} onChange={(e) => { setPickup(e.target.value); fetchSuggestions(e.target.value, true); setShowPickupList(true); }} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Ej. Palacio de Bellas Artes..." />
              {showPickupList && pickupSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto">
                  {pickupSuggestions.map((item) => <li key={item.id} onClick={() => handleSelectSuggestion(item.id, item.place_name, true)} className="p-2.5 text-xs hover:bg-gray-700 cursor-pointer">{item.place_name}</li>)}
                </ul>
              )}
            </div>
            <div ref={destRef} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-3">
              <label className="text-[10px] font-bold text-blue-400 uppercase">Destino</label>
              <input type="text" value={destination} onChange={(e) => { setDestination(e.target.value); fetchSuggestions(e.target.value, false); setShowDestList(true); }} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Ej. Ej. Terminal 2 del AICM..." />
              {showDestList && destSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto">
                  {destSuggestions.map((item) => <li key={item.id} onClick={() => handleSelectSuggestion(item.id, item.place_name, false)} className="p-2.5 text-xs hover:bg-gray-700 cursor-pointer">{item.place_name}</li>)}
                </ul>
              )}
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-[#E63946] text-white font-bold py-4 rounded-2xl text-sm hover:opacity-90 transition">
            {isLoading ? 'Calculando...' : '⚡ Calcular Oferta Competitiva'}
          </button>
        </form>

        {/* Resultado */}
        {estimatedFare !== null && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div><span className="text-[10px] text-gray-400">Distancia/Tiempo:</span><span className="text-xs font-bold block">~{estimatedKm} km ({estimatedMins} min)</span></div>
              <div className="text-right"><span className="text-[10px] text-gray-400">Tarifa:</span><span className="text-xl font-extrabold text-emerald-400">${estimatedFare} MXN</span></div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleOpenGoogleMaps} className="bg-blue-600 py-2.5 rounded-xl text-[10px] font-bold">🗺️ Google Maps</button>
              <button onClick={handleOpenWaze} className="bg-sky-600 py-2.5 rounded-xl text-[10px] font-bold">🚗 Waze</button>
            </div>
            
            <button onClick={() => window.open(`https://api.whatsapp.com/send?text=Cotización: $${estimatedFare} MXN`, '_blank')} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs">💬 Enviar por WhatsApp</button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}