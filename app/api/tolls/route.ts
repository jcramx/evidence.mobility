import { NextResponse } from 'next/server';

interface Waypoint {
  lat: number;
  lng: number;
}

interface RequestBody {
  origin: Waypoint;
  destination: Waypoint;
  waypoints?: Waypoint[];
  vehicleType?: string; // p. ej. '2AxlesAuto'
  isRoundTrip?: boolean;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.TOLLGURU_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clave de API de TollGuru no configurada en el servidor' },
        { status: 500 }
      );
    }

    const body: RequestBody = await request.json();
    const { origin, destination, waypoints = [], vehicleType = '2AxlesAuto', isRoundTrip = false } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'El origen y el destino son requeridos' },
        { status: 400 }
      );
    }

    // Estructurar el array de coordenadas para TollGuru
    const pathCoordinates = [
      [origin.lng, origin.lat],
      ...waypoints.map((w) => [w.lng, w.lat]),
      [destination.lng, destination.lat],
    ];

    // Consulta a la API de TollGuru (v2 - Polyline / Mapbox / Coordinates)
    const response = await fetch('https://apis.tollguru.com/toll/v2/origin-destination-waypoints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        from: { lat: origin.lat, lng: origin.lng },
        to: { lat: destination.lat, lng: destination.lng },
        waypoints: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
        vehicle: {
          type: vehicleType,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Error al consultar TollGuru', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extraer los peajes de la mejor ruta devuelta
    const routeInfo = data.routes?.[0] || data.route;
    const rawTolls = routeInfo?.tolls || [];

    let tollsList = rawTolls.map((t: any, idx: number) => ({
      id: t.id || `toll-${idx}`,
      name: t.name || t.road || 'Caseta de Peaje',
      cost: t.tagCost ?? t.cashCost ?? 0,
    }));

    // Multiplicador si el viaje es redondo (Ida y Vuelta)
    if (isRoundTrip) {
      tollsList = tollsList.map((t: any) => ({
        ...t,
        name: `${t.name} (Ida y Vuelta)`,
        cost: t.cost * 2,
      }));
    }

    const totalTollsCost = tollsList.reduce((acc: number, item: any) => acc + item.cost, 0);

    return NextResponse.json({
      success: true,
      tolls: tollsList,
      totalTollsCost,
      currency: routeInfo?.costs?.currency || 'MXN',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error.message },
      { status: 500 }
    );
  }
}