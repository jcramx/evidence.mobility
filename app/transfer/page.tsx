// app/transfer/page.tsx

import React from 'react';
import Link from 'next/link';

export default function TransferWelcomePage() {
  const tripDetails = {
    date: "Martes, 18 de agosto de 2026",
    origin: "Zona Residencial / Hotel",
    destination: "Embajada de Dinamarca, Ciudad de México",
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8">
      
      {/* Fondo fotográfico de alto impacto, ocupando todo el viewport */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2400&auto=format&fit=crop"
          alt="Movilidad ejecutiva"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-slate-900/30" />
      </div>

      {/* Contenedor adaptativo */}
      <section className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 py-10">
        
        {/* Bloque de texto con el nuevo enfoque diplomático */}
        <div className="flex-1 space-y-4 text-left md:pr-10">
          <div className="inline-block bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded shadow-sm">
            Trazabilidad y Estándares Superiores
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Es un honor <br/> <span className="text-red-600">contar con su preferencia.</span>
          </h2>
          <p className="text-lg text-slate-700 max-w-md italic">
            "Su traslado con confianza y seguridad es nuestro compromiso de excelencia en cada kilómetro recorrido."
          </p>
        </div>

        {/* Tarjeta de detalles - Ajustada a mayor anchura */}
        <div className="w-full md:w-[420px] bg-white/95 backdrop-blur-md border border-white shadow-2xl rounded-xl p-8 space-y-6">
          <div className="space-y-5">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Fecha</span>
              <span className="text-sm font-semibold text-slate-900">{tripDetails.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Origen</span>
              <span className="text-sm font-medium text-slate-900 bg-slate-100 px-4 py-3 rounded block">{tripDetails.origin}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Destino</span>
              <span className="text-sm font-medium text-slate-900 bg-slate-100 px-4 py-3 rounded block">{tripDetails.destination}</span>
            </div>
          </div>

          <Link
            href="/reservations"
            className="block w-full text-center bg-slate-900 hover:bg-red-600 text-white font-bold py-4 px-6 rounded shadow-lg transition-all duration-300 text-sm tracking-widest uppercase"
          >
            Nueva Reserva
          </Link>
        </div>
      </section>
    </main>
  );
}