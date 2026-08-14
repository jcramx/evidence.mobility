import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from '../components/Header';
import Footer from '../components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "evidence.mobility | Reserva tu Viaje",
  description: "Plataforma de gestión de viajes y transporte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0b0f19] text-white flex flex-col min-h-screen m-0 p-0 overflow-x-hidden`}>
        {/* Header fijo en la parte superior */}
        <Header />

        {/* Contenido principal flexible */}
        <main className="flex-grow w-full bg-[#0b0f19]">
          {children}
        </main>

        {/* Footer fijo en la parte inferior */}
        <Footer />
      </body>
    </html>
  );
}