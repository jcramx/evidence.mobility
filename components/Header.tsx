'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isReservationsPage = pathname?.includes('/reservations');

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A1128]/90 border-b border-gray-800/80 px-6 py-4 w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-1 text-white">
          evidence<span className="text-[#E63946]">.mobility</span>
        </Link>

        {/* Se oculta el botón si estamos en la ruta de reservations */}
        {!isReservationsPage && (
          <div>
            <Link 
              href="/reservations" 
              className="bg-[#E63946] hover:bg-[#d62839] text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
            >
              Cotiza y Reserva tu Viaje
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}