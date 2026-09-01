import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { TripDetailsData, VEHICLE_CATALOG } from '@/components/TripDetailsBar';

export interface TollItem {
  id: string;
  name: string;
  cost: number;
}

interface Point {
  address: string;
}

interface QuotePDFProps {
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
    isNightShift?: boolean;
    nightSurcharge?: number;
    tollCost?: number;
    tollsList?: TollItem[];
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

const styles = StyleSheet.create({
  page: {
    paddingTop: 90,
    paddingBottom: 55,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1F2937',
    lineHeight: 1.4,
  },
  headerContainer: {
    position: 'absolute',
    top: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logoBox: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextWhite: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 13.5,
  },
  logoTextRed: {
    color: '#E63946',
    fontFamily: 'Helvetica-Bold',
    fontSize: 13.5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
    textAlign: 'right',
  },
  docDate: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 2,
  },
  recipientBlock: {
    marginBottom: 8,
  },
  recipientText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  subjectText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#E63946',
  },
  bodyParagraph: {
    fontSize: 9.5,
    color: '#334155',
    marginBottom: 8,
    textAlign: 'justify',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 3,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#E63946',
  },
  regimeBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  rowDetail: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  labelDetail: {
    width: '30%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#475569',
  },
  valueDetail: {
    width: '70%',
    fontSize: 9,
    color: '#0F172A',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tableSubRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 9,
  },
  tableSubCell: {
    fontSize: 8.5,
    color: '#475569',
  },
  subtotalRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  subtotalLabel: {
    width: '70%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#334155',
  },
  subtotalValue: {
    width: '30%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#334155',
    textAlign: 'right',
  },
  taxRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
  },
  taxLabel: {
    width: '70%',
    fontSize: 9,
    color: '#475569',
  },
  taxValue: {
    width: '30%',
    fontSize: 9,
    color: '#475569',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    alignItems: 'center',
  },
  totalLabelBox: {
    width: '65%',
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#991B1B',
  },
  totalSubtitle: {
    fontSize: 7.5,
    color: '#B91C1C',
    marginTop: 1.5,
  },
  totalValue: {
    width: '35%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    color: '#991B1B',
    textAlign: 'right',
  },
  section3Container: {
    marginBottom: 8,
  },
  termsBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  termTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  termText: {
    fontSize: 8.5,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 1.35,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signatureBrand: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  contactInfo: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 1.5,
  },
  pageNumberText: {
    fontSize: 8,
    color: '#94A3B8',
    fontFamily: 'Helvetica',
  },
});

export default function QuotePDFDocument({
  routeData,
  tripDetails,
  pricingData,
  taxOptions = { includeTax: false, applyRetentions: false }
}: QuotePDFProps) {
  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const vehicleInfo = VEHICLE_CATALOG[tripDetails.vehicleType];
  const isRoundTrip = tripDetails.tripType === 'round-trip';

  // Cálculos Fiscales
  const subtotal = pricingData.numericTotal;
  const includeTax = taxOptions.includeTax ?? false;
  const applyRetentions = taxOptions.applyRetentions ?? false;

  const isrRate = taxOptions.isrRetentionRate ?? 0.10;
  const ivaRate = taxOptions.ivaRetentionRate ?? (2 / 3 * 0.16);

  const ivaAmount = includeTax ? subtotal * 0.16 : 0;
  const isrRetentionAmount = applyRetentions ? subtotal * isrRate : 0;
  const ivaRetentionAmount = applyRetentions ? subtotal * ivaRate : 0;

  const grandTotal = subtotal + ivaAmount - isrRetentionAmount - ivaRetentionAmount;

  let regimeLabel = 'PÚBLICO EN GENERAL';
  let totalDescription = 'Total sin desglose de comprobante fiscal digital (CFDI)';

  if (applyRetentions) {
    regimeLabel = 'PERSONA MORAL (CON RETENCIONES)';
    totalDescription = 'Total considerando retenciones fiscales correspondientes a Persona Moral';
  } else if (includeTax) {
    regimeLabel = 'PERSONA FÍSICA (CON IVA)';
    totalDescription = 'Total facturado incluyendo I.V.A. (16%)';
  }

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const validTolls = pricingData.tollsList?.filter(t => t.cost > 0) || [];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        
        {/* Cabecera Fija */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.logoBox}>
            <Text style={styles.logoTextWhite}>evidence</Text>
            <Text style={styles.logoTextRed}>.mobility</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>COTIZACIÓN DE SERVICIO</Text>
            <Text style={styles.docTitle}>DE TRANSPORTE</Text>
            <Text style={styles.docDate}>Fecha: {formattedDate}</Text>
          </View>
        </View>

        {/* Destinatario */}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientText}>A QUIEN CORRESPONDA</Text>
          <Text style={styles.recipientText}>Presente</Text>
        </View>

        {/* Asunto */}
        <Text style={styles.subjectText}>ASUNTO: Propuesta Económica para Traslado Ejecutivo</Text>

        {/* Introducción */}
        <Text style={styles.bodyParagraph}>
          Por medio de la presente, ponemos a su disposición la cotización formal para el servicio de traslado privado de personal, programado del {tripDetails.departureDate || 'N/A'} {isRoundTrip ? `al ${tripDetails.returnDate}` : ''}. A continuación, se detallan las especificaciones operativas y la propuesta económica según los requerimientos solicitados:
        </Text>

        {/* 1. Logística Operativa */}
        <View wrap={false}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>1. Detalle de la Logística Operativa</Text>
          </View>
          <View style={styles.detailBox}>
            <View style={styles.rowDetail}>
              <Text style={styles.labelDetail}>Modalidad:</Text>
              <Text style={styles.valueDetail}>{isRoundTrip ? 'Ida y Vuelta' : 'Sólo Ida'}</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.labelDetail}>Vehículo:</Text>
              <Text style={styles.valueDetail}>{vehicleInfo.label} (Capacidad máx. {vehicleInfo.maxPax} pax)</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.labelDetail}>Salida:</Text>
              <Text style={styles.valueDetail}>{tripDetails.departureDate} a las {tripDetails.departureTime} hrs</Text>
            </View>
            {isRoundTrip && (
              <View style={styles.rowDetail}>
                <Text style={styles.labelDetail}>Regreso:</Text>
                <Text style={styles.valueDetail}>{tripDetails.returnDate} a las {tripDetails.returnTime} hrs</Text>
              </View>
            )}
            <View style={styles.rowDetail}>
              <Text style={styles.labelDetail}>Punto de Origen:</Text>
              <Text style={styles.valueDetail}>{routeData.pickup?.address || 'No especificado'}</Text>
            </View>
            {routeData.stops.map((stop, idx) => (
              <View style={styles.rowDetail} key={idx}>
                <Text style={styles.labelDetail}>Parada Intermedia {idx + 1}:</Text>
                <Text style={styles.valueDetail}>{stop.address}</Text>
              </View>
            ))}
            <View style={styles.rowDetail}>
              <Text style={styles.labelDetail}>Punto de Destino:</Text>
              <Text style={styles.valueDetail}>{routeData.dropoff?.address || 'No especificado'}</Text>
            </View>
          </View>
        </View>

        {/* 2. Propuesta Económica y Desglose Fiscal */}
        <View wrap={false}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>2. Propuesta Económica y Desglose Fiscal</Text>
            <Text style={styles.regimeBadge}>Régimen: {regimeLabel}</Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '60%' }]}>Concepto / Servicio</Text>
              <Text style={[styles.tableHeaderCell, { width: '40%', textAlign: 'right' }]}>Monto (MXN)</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '60%' }]}>Tarifa Base y Banderazo</Text>
              <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>${pricingData.baseCost.toFixed(2)}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '60%' }]}>Kilometraje ({pricingData.kmToCharge.toFixed(1)} km)</Text>
              <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>${pricingData.distanceCost.toFixed(2)}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '60%' }]}>Tiempo Estimado ({pricingData.minsToCharge} min)</Text>
              <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>${pricingData.timeCost.toFixed(2)}</Text>
            </View>

            {pricingData.isNightShift && (pricingData.nightSurcharge ?? 0) > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '60%' }]}>Recargo por Horario Nocturno (23:00 - 06:00 hrs) [20%]</Text>
                <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>+${(pricingData.nightSurcharge ?? 0).toFixed(2)}</Text>
              </View>
            )}

            {/* Casetas Desglosadas en PDF */}
            {(pricingData.tollCost ?? 0) > 0 && (
              <>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '60%', fontFamily: 'Helvetica-Bold' }]}>
                    Casetas y Peajes Estimados ({validTolls.length})
                  </Text>
                  <Text style={[styles.tableCell, { width: '40%', textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                    +${(pricingData.tollCost ?? 0).toFixed(2)}
                  </Text>
                </View>
                {validTolls.map((toll, idx) => (
                  <View style={styles.tableSubRow} key={toll.id || idx}>
                    <Text style={[styles.tableSubCell, { width: '60%', paddingLeft: 12 }]}>
                      • {toll.name.trim() || `Caseta ${idx + 1}`}
                    </Text>
                    <Text style={[styles.tableSubCell, { width: '40%', textAlign: 'right' }]}>
                      ${toll.cost.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {pricingData.viaticsCost > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '60%' }]}>Tiempo de Espera / Pernocta de Chofer</Text>
                <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>+${pricingData.viaticsCost.toFixed(2)}</Text>
              </View>
            )}

            {pricingData.staffCost > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '60%' }]}>Honorarios de Personal Especializado</Text>
                <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>+${pricingData.staffCost.toFixed(2)}</Text>
              </View>
            )}

            {pricingData.staffViatics > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '60%' }]}>Viáticos de Personal en Destino</Text>
                <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>+${pricingData.staffViatics.toFixed(2)}</Text>
              </View>
            )}

            {pricingData.extraServices > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '60%' }]}>Servicios Adicionales</Text>
                <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>+${pricingData.extraServices.toFixed(2)}</Text>
              </View>
            )}

            {/* Subtotal */}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>SUBTOTAL</Text>
              <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
            </View>

            {/* Desglose de IVA */}
            {includeTax && (
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>(+) I.V.A. (16.00%)</Text>
                <Text style={styles.taxValue}>+{formatCurrency(ivaAmount)}</Text>
              </View>
            )}

            {/* Desglose de Retenciones */}
            {applyRetentions && (
              <>
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>(-) Retención I.S.R. (10.00%)</Text>
                  <Text style={styles.taxValue}>-{formatCurrency(isrRetentionAmount)}</Text>
                </View>
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>(-) Retención I.V.A. (10.66%)</Text>
                  <Text style={styles.taxValue}>-{formatCurrency(ivaRetentionAmount)}</Text>
                </View>
              </>
            )}

            {/* Total Neto */}
            <View style={styles.totalRow}>
              <View style={styles.totalLabelBox}>
                <Text style={styles.totalLabel}>
                  {applyRetentions ? 'TOTAL NETO A PAGAR' : includeTax ? 'TOTAL CON FACTURA' : 'TOTAL GARANTIZADO'}
                </Text>
                <Text style={styles.totalSubtitle}>{totalDescription}</Text>
              </View>
              <Text style={styles.totalValue}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* 3. Términos y Condiciones */}
        <View style={styles.section3Container} wrap={false}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>3. Términos y Condiciones de Contratación</Text>
          </View>
          <View style={styles.termsBox}>
            <Text style={styles.termTitle}>Reservación:</Text>
            <Text style={styles.termText}>
              Para confirmar la agenda de la(s) unidad(es), se requiere un anticipo del 30% al aceptar la presente cotización. El 70% restante se liquidará el primer día de servicio.
            </Text>
            <Text style={styles.termTitle}>Facturación y Comprobantes:</Text>
            <Text style={styles.termText}>
              {applyRetentions
                ? 'Cotización estructurada para Persona Moral con retenciones del 10% ISR y 10.66% IVA. Favor de remitir Constancia de Situación Fiscal actualizada para emisión del CFDI.'
                : includeTax
                ? 'Cotización estructurada para Persona Física con traslado de IVA (16%). Favor de remitir Constancia de Situación Fiscal actualizada para emisión del CFDI.'
                : 'Cotización en esquema Público en General sin desglose de comprobante fiscal digital (CFDI). En caso de requerir factura, solicite el recálculo bajo el régimen correspondiente.'}
            </Text>
          </View>
        </View>

        <Text style={styles.bodyParagraph}>
          Quedamos a su entera disposición para cualquier aclaración o ajuste en la logística.
        </Text>

        {/* Pie de Página */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.signatureBrand}>evidence.mobility</Text>
            <Text style={styles.contactInfo}>Atención y Soporte: 5569370056 | evidence.sys@gmail.com</Text>
          </View>
          <Text
            style={styles.pageNumberText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  );
}