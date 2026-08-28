import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReceipt } from '../hooks/useReceipt';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDateTime } from '../lib/formatters';

/**
 * Fuerza tamaño carta al imprimir el comprobante (independiente de lo que
 * el usuario tenga configurado por defecto en su diálogo de impresión).
 * Se inyecta solo mientras esta pantalla está montada para no afectar el
 * ticket térmico de la pantalla de escaneo (QrScanPage), que usa su propio
 * tamaño de página.
 */
function useLetterPrintSize() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'receipt-print-page-size';
    style.textContent = '@page { size: letter; margin: 8mm; }';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}

function ReceiptCopy({ data, title }) {
  return (
    <div className="border border-slate-300 rounded-lg p-4 sm:p-6 bg-white flex flex-col print:flex-1 print:min-h-0 print:rounded-none print:border-slate-400 print:p-3 print:overflow-hidden">
      <div className="text-center mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className="border-b border-slate-300 mt-2" />
      </div>

      <div className="flex flex-col sm:flex-row print:flex-row gap-4 print:gap-3 flex-1 min-h-0">
        <div className="flex-1 min-w-0 space-y-2 print:space-y-1 text-sm print:text-[11px]">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">N. Comprobante:</span>
            <span className="font-mono font-semibold text-right">{data.numero_comprobante}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">Actividad:</span>
            <span className="text-right">{data.actividad}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">Fecha:</span>
            <span className="text-right">{formatDateTime(data.fecha)}</span>
          </div>

          <div className="border-t border-slate-200 my-2 print:my-1" />

          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">Estudiante:</span>
            <span className="font-medium text-right">{data.estudiante}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">Grado:</span>
            <span className="text-right">{data.grado}</span>
          </div>

          <div className="border-t border-slate-200 my-2 print:my-1" />

          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">Monto cuota:</span>
            <span className="text-right">{formatCurrency(data.monto_cuota)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">Platos extra:</span>
            <span className="text-right">{data.cantidad_platos_extra} x {formatCurrency(data.precio_plato_extra)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">Total extras:</span>
            <span className="text-right">{formatCurrency(data.total_extras)}</span>
          </div>
          <div className="flex justify-between font-semibold gap-2">
            <span className="shrink-0">Total recibido:</span>
            <span className="text-right">{formatCurrency(data.total_recibido)}</span>
          </div>

          <div className="border-t border-slate-200 my-2 print:my-1" />

          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">Cuota acumulada:</span>
            <span className="text-right">{formatCurrency(data.cuota_acumulada)}</span>
          </div>
          <div className="flex justify-between gap-2 items-center">
            <span className="text-slate-500 shrink-0">Estado cuota:</span>
            <Badge variant={data.estado_cuota === 'PAGADO' ? 'pagada' : 'pendiente'}>
              {data.estado_cuota}
            </Badge>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 shrink-0">Total platos:</span>
            <span className="font-semibold text-right">{data.total_platos}</span>
          </div>

          <div className="border-t border-slate-200 my-2 print:my-1" />

          <div className="flex justify-between gap-2 text-xs text-slate-500">
            <span className="shrink-0">Registrado por:</span>
            <span className="text-right">{data.usuario}</span>
          </div>
        </div>

        {data.qr_image && (
          <div className="shrink-0 flex flex-col items-center justify-center gap-2 sm:border-l sm:border-slate-200 sm:pl-4 print:border-l print:border-slate-300 print:pl-3">
            <img
              src={data.qr_image}
              alt="Código QR"
              className="w-36 h-36 sm:w-44 sm:h-44 print:w-[42mm] print:h-[42mm]"
            />
            <p className="text-[10px] text-slate-400 text-center leading-tight">
              Presenta este código<br />para tu ingreso
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { data: receipt, isLoading } = useReceipt(paymentId);

  useLetterPrintSize();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <i className="bi bi-receipt text-5xl text-slate-300 mb-3 block" />
          <p className="text-slate-500 font-medium">Comprobante no encontrado</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </CardBody>
      </Card>
    );
  }

  const copies = receipt.copias || ['COPIA CONTRIBUYENTE', 'COPIA REGISTRO'];

  return (
    <div className="space-y-6 print:space-y-0 max-w-2xl mx-auto print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left" />
            Volver
          </Button>
          <h1 className="text-2xl font-semibold text-slate-900 mt-2">Comprobante</h1>
        </div>
        <Button variant="primary" onClick={() => window.print()}>
          <i className="bi bi-printer" />
          Imprimir
        </Button>
      </div>

      {/* Las dos copias siempre caben en una sola hoja carta: en pantalla
          se apilan con espacio libre; al imprimir ocupan cada una la mitad
          exacta del área imprimible (263mm de alto con margen de 8mm). */}
      <div className="space-y-6 print:space-y-0 print:flex print:flex-col print:h-[263mm] print:gap-[6mm]">
        {copies.map((title, i) => (
          <ReceiptCopy key={i} data={receipt} title={title} />
        ))}
      </div>
    </div>
  );
}
