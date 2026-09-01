'use client';

import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Point {
  lng: number;
  lat: number;
  address: string;
}

interface TollItem {
  id: string;
  name: string;
  cost: number;
}

interface RouteMetrics {
  distanceKm: number;
  durationMinutes: number;
  tolls?: TollItem[];
  totalTollsCost?: number;
}

interface RouteData {
  pickup: Point | null;
  dropoff: Point | null;
  stops: Point[];
  metrics: RouteMetrics | null;
}

interface RouteMapProps {
  initialRoute: RouteData;
  onRouteSelected: (data: RouteData) => void;
  onContinue: () => void;
}

export default function RouteMap({ initialRoute, onRouteSelected, onContinue }: RouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  const [viewState, setViewState] = useState({
    latitude: 19.4326,
    longitude: -99.1332,
    zoom: 12
  });

  const [pickup, setPickup] = useState<Point | null>(initialRoute?.pickup || null);
  const [dropoff, setDropoff] = useState<Point | null>(initialRoute?.dropoff || null);
  const [stops, setStops] = useState<Point[]>(initialRoute?.stops || []);

  const [pickupInput, setPickupInput] = useState(initialRoute?.pickup?.address || '');
  const [dropoffInput, setDropoffInput] = useState(initialRoute?.dropoff?.address || '');
  const [stopInput, setStopInput] = useState('');
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | 'stop' | null>(null);

  const [metrics, setMetrics] = useState<RouteMetrics | null>(initialRoute?.metrics || null);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [isCalculatingTolls, setIsCalculatingTolls] = useState<boolean>(false);

  // Sincronización automática de ruta inicial
  useEffect(() => {
    if (initialRoute) {
      setPickup(initialRoute.pickup || null);
      setDropoff(initialRoute.dropoff || null);
      setStops(initialRoute.stops || []);
      setPickupInput(initialRoute.pickup?.address || '');
      setDropoffInput(initialRoute.dropoff?.address || '');
      setMetrics(initialRoute.metrics || null);
      
      if (initialRoute.pickup && initialRoute.dropoff && !initialRoute.metrics) {
        fetchRouteMetrics(initialRoute.pickup, initialRoute.dropoff, initialRoute.stops || []);
      }
    }
  }, [initialRoute]);

  // Ajustar cámara para encuadrar la ruta (fitBounds)
  const fitMapToBounds = (points: Point[]) => {
    if (!mapRef.current || points.length < 2) return;

    const lngs = points.map(p => p.lng);
    const lats = points.map(p => p.lat);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat]
      ],
      { padding: 60, duration: 1200 }
    );
  };

  // Función para estimar peajes usando API backend / Tollguru mock
  const fetchTolls = async (pickupPoint: Point, dropoffPoint: Point): Promise<TollItem[]> => {
    setIsCalculatingTolls(true);
    try {
      // Sustituir este bloque por la petición real a tu API backend/Tollguru
      // const res = await fetch('/api/calculate-tolls', { method: 'POST', body: JSON.stringify({ pickupPoint, dropoffPoint }) });
      // const data = await res.json();
      
      // Simulación de cálculo automático según el trayecto
      const isTolucaRoute = dropoffPoint.address.toLowerCase().includes('toluca') || pickupPoint.address.toLowerCase().includes('toluca');
      
      if (isTolucaRoute) {
        return [
          { id: '1', name: 'Caseta La Venta (Aut. México-Toluca)', cost: 105.00 },
          { id: '2', name: 'Caseta La Marquesa / Lerma', cost: 95.00 }
        ];
      }
      return [];
    } catch (e) {
      console.error('Error calculando peajes:', e);
      return [];
    } finally {
      setIsCalculatingTolls(false);
    }
  };

  // Obtener ruta, distancia, tiempo y peajes
  const fetchRouteMetrics = async (currentPickup: Point, currentDropoff: Point, currentStops: Point[]) => {
    try {
      let coordinatesString = `${currentPickup.lng},${currentPickup.lat}`;
      
      if (currentStops.length > 0) {
        const stopsString = currentStops.map(s => `${s.lng},${s.lat}`).join(';');
        coordinatesString += `;${stopsString}`;
      }
      
      coordinatesString += `;${currentDropoff.lng},${currentDropoff.lat}`;

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&geometries=geojson&overview=full`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Number((route.distance / 1000).toFixed(2));
        const durationMinutes = Math.round(route.duration / 60);

        // Guardar la geometría para dibujar la línea en el mapa
        setRouteGeometry({
          type: 'Feature',
          geometry: route.geometry
        });

        // Obtener peajes estimados
        const tolls = await fetchTolls(currentPickup, currentDropoff);
        const totalTollsCost = tolls.reduce((sum, item) => sum + item.cost, 0);

        const newMetrics: RouteMetrics = {
          distanceKm,
          durationMinutes,
          tolls,
          totalTollsCost
        };

        setMetrics(newMetrics);

        // Ajustar zoom para mostrar la ruta completa
        fitMapToBounds([currentPickup, ...currentStops, currentDropoff]);

        if (onRouteSelected) {
          onRouteSelected({ 
            pickup: currentPickup, 
            dropoff: currentDropoff, 
            stops: currentStops,
            metrics: newMetrics 
          });
        }
      }
    } catch (error) {
      console.error('Error calculando la ruta con Mapbox:', error);
    }
  };

  const updateRouteState = (newPickup: Point | null, newDropoff: Point | null, newStops: Point[]) => {
    setPickup(newPickup);
    setDropoff(newDropoff);
    setStops(newStops);

    if (newPickup && newDropoff) {
      fetchRouteMetrics(newPickup, newDropoff, newStops);
    } else {
      setMetrics(null);
      setRouteGeometry(null);
      if (onRouteSelected) {
        onRouteSelected({ pickup: newPickup, dropoff: newDropoff, stops: newStops, metrics: null });
      }
    }
  };

  const searchAddress = async (query: string, type: 'pickup' | 'dropoff' | 'stop') => {
    if (type === 'pickup') setPickupInput(query);
    else if (type === 'dropoff') setDropoffInput(query);
    else setStopInput(query);

    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setActiveInput(type);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&autocomplete=true&language=es&country=mx`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const selectLocation = (feature: any) => {
    const [lng, lat] = feature.center;
    const address = feature.place_name;
    const newPoint: Point = { lng, lat, address };

    let updatedPickup = pickup;
    let updatedDropoff = dropoff;
    let updatedStops = stops;

    if (activeInput === 'pickup') {
      setPickupInput(address);
      updatedPickup = newPoint;
    } else if (activeInput === 'dropoff') {
      setDropoffInput(address);
      updatedDropoff = newPoint;
    } else if (activeInput === 'stop') {
      updatedStops = [...stops, newPoint];
      setStopInput('');
    }

    setSuggestions([]);
    setActiveInput(null);
    updateRouteState(updatedPickup, updatedDropoff, updatedStops);
  };

  const handleMapClick = async (event: any) => {
    const { lng, lat } = event.lngLat;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&language=es`
      );
      const data = await response.json();
      const address = data.features?.[0]?.place_name || 'Ubicación seleccionada en mapa';
      const newPoint: Point = { lng, lat, address };

      let updatedPickup = pickup;
      let updatedDropoff = dropoff;

      if (!pickup) {
        setPickupInput(address);
        updatedPickup = newPoint;
      } else {
        setDropoffInput(address);
        updatedDropoff = newPoint;
      }

      updateRouteState(updatedPickup, updatedDropoff, stops);
    } catch (e) {
      console.error('Error en geocodificación inversa:', e);
    }
  };

  const removeStop = (index: number) => {
    const updatedStops = stops.filter((_, i) => i !== index);
    updateRouteState(pickup, dropoff, updatedStops);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
      {/* Panel de Controles Lateral */}
      <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          
          {/* Origen */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Punto de Origen</label>
            <input
              type="text"
              placeholder="Dirección de recogida..."
              value={pickupInput}
              onChange={(e) => searchAddress(e.target.value, 'pickup')}
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#E63946] shadow-sm"
            />
            {activeInput === 'pickup' && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl w-full max-h-48 overflow-y-auto">
                {suggestions.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    onClick={() => selectLocation(item)}
                    className="p-2.5 text-xs text-gray-800 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-none"
                  >
                    {item.place_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Destino */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Destino Final</label>
            <input
              type="text"
              placeholder="Dirección de llegada..."
              value={dropoffInput}
              onChange={(e) => searchAddress(e.target.value, 'dropoff')}
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#E63946] shadow-sm"
            />
            {activeInput === 'dropoff' && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl w-full max-h-48 overflow-y-auto">
                {suggestions.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    onClick={() => selectLocation(item)}
                    className="p-2.5 text-xs text-gray-800 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-none"
                  >
                    {item.place_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paradas Intermedias */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-200 relative shadow-sm">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Paradas Intermedias (Opcional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Añadir parada en el trayecto..."
                value={stopInput}
                onChange={(e) => searchAddress(e.target.value, 'stop')}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-[#E63946]"
              />
            </div>

            {activeInput === 'stop' && suggestions.length > 0 && (
              <div className="absolute z-50 left-3.5 right-3.5 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    onClick={() => selectLocation(item)}
                    className="p-2.5 text-xs text-gray-800 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-none"
                  >
                    {item.place_name}
                  </div>
                ))}
              </div>
            )}

            {stops.length > 0 && (
              <div className="mt-2 space-y-1">
                {stops.map((stop, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded border border-gray-200 text-xs text-gray-800 shadow-sm">
                    <span>📍 Parada {idx + 1}: {stop.address}</span>
                    <button onClick={() => removeStop(idx)} className="text-[#E63946] hover:text-red-700 font-bold ml-2 cursor-pointer">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desglose Automático de Casetas / Peajes (Debajo de Paradas) */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-700">Casetas / Peajes Estimados</span>
              {isCalculatingTolls && <span className="text-[10px] text-gray-400 animate-pulse">Calculando...</span>}
            </div>

            {metrics?.tolls && metrics.tolls.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {metrics.tolls.map((toll) => (
                  <div key={toll.id} className="flex justify-between items-center text-xs bg-gray-50 px-2.5 py-1.5 rounded border border-gray-100">
                    <span className="text-gray-700 truncate max-w-[180px]">{toll.name}</span>
                    <span className="font-bold text-gray-900">${toll.cost.toFixed(2)} MXN</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs font-bold text-[#E63946]">
                  <span>Total Peajes:</span>
                  <span>${metrics.totalTollsCost?.toFixed(2)} MXN</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic">
                {pickup && dropoff ? 'No se detectaron casetas de cobro en esta ruta.' : 'Selecciona origen y destino para calcular casetas.'}
              </p>
            )}
          </div>

          {/* Panel de Métricas (Distancia y Tiempo) */}
          {metrics && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-500 block">Distancia:</span>
                <span className="font-bold text-gray-900">{metrics.distanceKm} km</span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block">Tiempo estimado:</span>
                <span className="font-bold text-gray-900">{metrics.durationMinutes} min</span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={onContinue}
            disabled={!pickup || !dropoff}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              pickup && dropoff
                ? 'bg-[#E63946] text-white hover:bg-red-700 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continuar la reserva
          </button>
        </div>
      </div>

      {/* Mapa Visual con Mapbox */}
      <div className="lg:col-span-8 h-full min-h-[420px]">
        <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 relative shadow-sm">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={(evt: any) => setViewState(evt.viewState)}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            onClick={handleMapClick}
            cursor="crosshair"
          >
            {/* Trazado de la Ruta */}
            {routeGeometry && (
              <Source id="route-source" type="geojson" data={routeGeometry}>
                <Layer
                  id="route-layer"
                  type="line"
                  paint={{
                    'line-color': '#E63946',
                    'line-width': 5,
                    'line-opacity': 0.85
                  }}
                  layout={{
                    'line-join': 'round',
                    'line-cap': 'round'
                  }}
                />
              </Source>
            )}

            {/* Marcadores */}
            {pickup && (
              <Marker longitude={pickup.lng} latitude={pickup.lat} anchor="bottom">
                <div className="bg-[#E63946] text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md">
                  Origen
                </div>
              </Marker>
            )}

            {stops.map((stop, idx) => (
              <Marker key={idx} longitude={stop.lng} latitude={stop.lat} anchor="bottom">
                <div className="bg-yellow-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md">
                  Parada {idx + 1}
                </div>
              </Marker>
            ))}

            {dropoff && (
              <Marker longitude={dropoff.lng} latitude={dropoff.lat} anchor="bottom">
                <div className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md">
                  Destino
                </div>
              </Marker>
            )}
          </Map>

          <div className="absolute top-3 left-3 bg-[#0b0f19]/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-gray-700 text-[11px] text-gray-200 pointer-events-none shadow-md">
            💡 Clic en mapa: 1º Origen, 2º Destino
          </div>
        </div>
      </div>
    </div>
  );
}