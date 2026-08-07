'use server';

import { createClient } from '@supabase/supabase-js';

// Inicializamos el cliente de Supabase con la Service Role Key para operaciones de backend seguras
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * 1. Envía y genera el código OTP para un cliente registrado
 */
export async function sendOtpAction(phone: string) {
  try {
    // Verificar si el cliente existe en la base de datos
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('phone, full_name')
      .eq('phone', phone)
      .single();

    if (clientError || !client) {
      return { success: false, message: 'El número telefónico no cuenta con un contrato previo registrado.' };
    }

    // Generar un código aleatorio de 4 dígitos
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Definir expiración a 5 minutos a partir de ahora
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Guardar el OTP en la tabla auth_otps
    const { error: otpError } = await supabaseAdmin
      .from('auth_otps')
      .insert({
        phone: phone,
        code: randomCode,
        expires_at: expiresAt,
        used: false
      });

    if (otpError) {
      throw new Error('Error al registrar la clave de acceso.');
    }

    // TODO: Aquí integrarías tu proveedor de SMS o WhatsApp (ej. Twilio) para enviar `randomCode` al `phone`.
    // Para desarrollo local, lo imprimimos en la consola del servidor:
    console.log(`[DEV MODE] Código OTP para ${phone}: ${randomCode}`);

    return { success: true, message: 'Clave de acceso enviada con éxito.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error interno al procesar la solicitud.' };
  }
}

/**
 * 2. Valida el código OTP y recupera la ruta recurrente del cliente
 */
  export async function verifyOtpAction(phone: string, code: string) {
    try {
      // 1. Buscar un código válido, no usado y no expirado
      const { data: otpRecord, error: otpError } = await supabaseAdmin
        .from('auth_otps')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        return { success: false, message: 'Código incorrecto o expirado.' };
      }

      // 2. Marcar el OTP como utilizado
      await supabaseAdmin
        .from('auth_otps')
        .update({ used: true })
        .eq('id', otpRecord.id);

      // 3. Recuperar la última ruta recurrente asociada a este teléfono
      const { data: routeData } = await supabaseAdmin
        .from('recurring_routes')
        .select('*')
        .eq('phone', phone)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Usamos maybeSingle para evitar errores si no encuentra filas

      // 4. Recuperar datos del cliente
      const { data: clientData } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('phone', phone)
        .single();

      // 5. Mapear los datos de la BD (snake_case) al formato que espera tu Frontend (camelCase)
      const formattedRoute = routeData ? {
        tripType: routeData.trip_type || 'one-way',
        departureDate: new Date().toISOString().split('T')[0],
        departureTime: routeData.departure_time || '09:00',
        counts: routeData.counts || { adults: 1, teenagers: 0, children: 0, infants: 0, support: 0, pets: 0, packageOnly: 0 },
        pickup: routeData.pickup || null,
        dropoff: routeData.dropoff || null,
        stops: routeData.stops || []
      } : null;

      return {
        success: true,
        message: 'Validación exitosa.',
        route: formattedRoute,
        client: clientData || null
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error al validar la clave.' };
    }
}