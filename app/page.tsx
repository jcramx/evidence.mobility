'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="w-full bg-[#0b0f19] text-white font-sans selection:bg-[#E63946] selection:text-white">
      <section className="relative min-h-[85vh] flex items-center pt-16 pb-16 px-4 md:px-12">
        {/* Contenedor de la imagen de fondo con mayor visibilidad */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1920&auto=format&fit=crop" alt="Interior y Tecnología Ejecutiva"className="w-full h-full object-cover object-center opacity-50"
          />
          {/* Gradiente sutil para mantener el contraste detrás de los textos sin oscurecer de más */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19]/90 via-[#0b0f19]/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19]/80 via-transparent to-[#0b0f19]/30"></div>
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-red-950/70 border border-red-800/60 text-red-400 text-xs px-3.5 py-1.5 rounded-full font-semibold backdrop-blur-md">
            <span>🛡️</span> Plataforma Inteligente de Movilidad
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-3xl drop-shadow-md">
            Tu traslado comienza con <span className="text-[#E63946]">confianza y seguridad.</span>
          </h1>
          <p className="text-sm md:text-base text-gray-200 max-w-2xl leading-relaxed drop-shadow">
            Conectamos conductores y vehículos certificados con usuarios que valoran la seguridad, la confianza y la calidad superior en cada experiencia de movilidad.
          </p>
          <div className="pt-4">
            <Link 
              href="/reservations" 
              className="bg-[#E63946] hover:bg-red-700 text-white font-bold px-8 py-4 rounded-2xl text-sm transition shadow-2xl shadow-red-950/80 inline-block"
            >
              Iniciar Cotización y Reserva
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}