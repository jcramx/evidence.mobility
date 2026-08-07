import React from 'react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A1128]/80 border-b border-gray-800/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <a href="/" className="text-xl font-bold tracking-tight flex items-center gap-1 text-white">
          evidence<span className="text-[#E63946]">.mobility</span>
        </a>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-300">
          <a href="#mapa" className="hover:text-white transition-colors">Ruta</a>
          <a href="#calendario" className="hover:text-white transition-colors">Disponibilidad</a>
          <a href="#tarifas" className="hover:text-white transition-colors">Tarifas</a>
        </nav>

        <div>
          <a 
            href="#reservar" 
            className="bg-[#E63946] hover:bg-[#d62839] text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
          >
            Reservar Viaje
          </a>
        </div>
      </div>
    </header>
  );
}