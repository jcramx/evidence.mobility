import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "evidence.mobility | Cotiza y Reserva tu Trayecto",
  description: "Plataforma de gestión de viajes y transporte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F4F1EA] text-gray-900 flex flex-col min-h-screen`}>
        
        {/* Header Fijo */}
        <header className="sticky top-0 z-50 bg-[#0b0f19] border-b border-gray-800 text-white px-6 py-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white">evidence<span className="text-[#E63946]">.mobility</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <span className="hover:text-white cursor-pointer">Ruta</span>
            <span className="hover:text-white cursor-pointer">Disponibilidad</span>
            <span className="hover:text-white cursor-pointer">Tarifas</span>
          </nav>
          <div>
            <button className="bg-[#E63946] hover:bg-[#d62839] text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer">
              Reservar Viaje
            </button>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl bg-[#F4F1EA]">
          {children}
        </main>

        {/* Footer Fijo / Estático al final */}
        <footer className="bg-[#0b0f19] border-t border-gray-800 text-gray-400 py-4 px-6 text-center text-xs">
          <p>© {new Date().getFullYear()} evidence.mobility. Todos los derechos reservados.</p>
        </footer>

      </body>
    </html>
  );
}