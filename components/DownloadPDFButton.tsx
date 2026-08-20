'use client';

import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import QuotePDFDocument from '@/components/QuotePDFDocument';

export default function DownloadPDFButton({ routeData, tripDetails, pricingData }: any) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <button 
        disabled 
        className="bg-gray-300 text-gray-600 px-5 py-2.5 rounded-xl font-bold text-xs opacity-70"
      >
        Cargando generador de PDF...
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <QuotePDFDocument
          routeData={routeData}
          tripDetails={tripDetails}
          pricingData={pricingData}
        />
      }
      fileName={`Cotizacion_Traslado_${tripDetails.departureDate || 'Servicio'}.pdf`}
      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
    >
      {({ loading }) => (loading ? '⏳ Generando PDF...' : '📄 Descargar Cotización PDF')}
    </PDFDownloadLink>
  );
}