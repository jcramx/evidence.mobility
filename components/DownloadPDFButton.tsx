'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import QuotePDFDocument from './QuotePDFDocument';
import { TripDetailsData } from './TripDetailsBar';

interface Point {
  address: string;
}

interface DownloadPDFButtonProps {
  routeData: {
    pickup: Point | null;
    dropoff: Point | null;
    stops: Point[];
  };
  tripDetails: TripDetailsData;
  pricingData: {
    baseCost: number;
    distanceCost: number;
    timeCost: number;
    viaticsCost: number;
    staffCost: number;
    staffViatics: number;
    extraServices: number;
    kmToCharge: number;
    minsToCharge: number;
    numericTotal: number;
    formattedTotal: string;
  };
  taxOptions?: {
    includeTax?: boolean;
    applyRetentions?: boolean;
    isrRetentionRate?: number;
    ivaRetentionRate?: number;
  };
}

export default function DownloadPDFButton({
  routeData,
  tripDetails,
  pricingData,
  taxOptions,
}: DownloadPDFButtonProps) {
  const fileName = `Cotizacion_${tripDetails.vehicleType}_${new Date().toISOString().slice(0, 10)}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <QuotePDFDocument
          routeData={routeData}
          tripDetails={tripDetails}
          pricingData={pricingData}
          taxOptions={taxOptions}
        />
      }
      fileName={fileName}
      className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
    >
      {({ loading }) => (loading ? 'Generando PDF...' : '📄 Descargar Cotización PDF')}
    </PDFDownloadLink>
  );
}