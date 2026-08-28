import { useState, useEffect, useRef } from 'react';
import { validateQr } from '../api/qr.api';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { formatDateTime } from '../lib/formatters';
import { toast } from 'sonner';

const CUOTA_PAGADA_VALUES = ['PAGADA', 'PAGADO'];

/**
 * El QR generado por el sistema codifica un objeto JSON con el token
 * adentro (ver Backend/src/utils/qrGenerator.js: qrPayload → JSON.stringify),
 * no el UUID puro. Hay que extraer `token` del texto decodificado antes de
 * mandarlo a validar; si no es JSON, se usa el texto tal cual (por si algún
 * día se escanea un token plano).
 */
function extractQrToken(decodedText) {
  const trimmed = (decodedText || '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.token === 'string') return parsed.token;
  } catch {
    // no era JSON: seguimos con el texto crudo
  }
  return trimmed;
}

/**
 * Fuerza el tamaño de página a un rollo térmico de 80mm mientras esta
 * pantalla está montada, para el ticket que se imprime al validar un QR.
 * Se retira al salir de la pantalla para no afectar otras impresiones
 * (por ejemplo el comprobante, que usa tamaño carta).
 */
function useThermalPrintSize() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'ticket-print-page-size';
    style.textContent = '@page { size: 80mm auto; margin: 3mm; }';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}

export default function QrScanPage() {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedAt, setScannedAt] = useState(null);
  const scannerRef = useRef(null);

  useThermalPrintSize();

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch { /* ignore */ }
        scannerRef.current = null;
      }
    };
  }, []);

  const startScanner = async () => {
    setScanResult(null);
    setCameraActive(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try { await scanner.stop(); } catch { /* ignore */ }
          setCameraActive(false);
          handleValidate(decodedText);
        },
        () => {}
      );
    } catch {
      setCameraActive(false);
      toast.error('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const handleValidate = async (decodedText) => {
    setLoading(true);
    try {
      const token = extractQrToken(decodedText);
      const result = await validateQr(token);
      setScanResult(result);
      setScannedAt(new Date());
    } catch (err) {
      setScanResult({
        es_valido: false,
        message: err.message || 'Error al validar QR',
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScanResult(null);
    setCameraActive(false);
    if (scannerRef.current) {
      try { scannerRef.current.stop(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-500">Validando código...</p>
      </div>
    );
  }

  if (scanResult) {
    const isValid = scanResult.es_valido;
    const cuotaPagada = CUOTA_PAGADA_VALUES.includes(scanResult.estado_cuota);
    const canPrintTicket = isValid && !!scanResult.estudiante;

    return (
      <>
        {/* Pantalla de resultado: no se imprime, solo se ve en el dispositivo
            que escaneó (celular/tablet). Lo que se imprime es el ticket de
            abajo. */}
        <div className={`no-print flex flex-col items-center justify-center min-h-[60vh] rounded-xl p-6 sm:p-8 ${isValid ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <i className={`bi ${isValid ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} text-7xl sm:text-8xl mb-4 sm:mb-6 ${isValid ? 'text-emerald-500' : 'text-red-500'}`} />
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isValid ? 'text-emerald-800' : 'text-red-800'}`}>
            {isValid ? 'QR VALIDO' : 'QR INVALIDO'}
          </h1>
          <p className={`text-base sm:text-lg mb-6 text-center ${isValid ? 'text-emerald-700' : 'text-red-700'}`}>
            {scanResult.message || (isValid ? 'Acceso autorizado' : 'Acceso denegado')}
          </p>

          {isValid && scanResult.estudiante && (
            <Card className="w-full max-w-sm mb-6">
              <CardBody className="space-y-3 text-center">
                <p className="text-lg font-semibold text-slate-900">{scanResult.estudiante}</p>
                <p className="text-slate-500">{scanResult.grado}</p>
                <p className="text-sm text-slate-600">
                  Total platos: <strong>{scanResult.total_platos}</strong>
                </p>
                <Badge variant={cuotaPagada ? 'pagada' : 'pendiente'}>
                  Cuota {scanResult.estado_cuota}
                </Badge>
              </CardBody>
            </Card>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            {canPrintTicket && (
              <Button variant="success" onClick={() => window.print()}>
                <i className="bi bi-printer" />
                Imprimir ticket
              </Button>
            )}
            <Button variant="primary" onClick={reset}>
              <i className="bi bi-camera" />
              Escanear otro
            </Button>
          </div>
        </div>

        {/* Ticket de entrega de comida: oculto en pantalla, solo aparece al
            imprimir (impresora térmica de 80mm). Los docentes lo usan como
            control físico de los platos entregados a cada estudiante. */}
        {canPrintTicket && (
          <div className="hidden print:flex print:flex-col print:items-center print:text-center print:w-full print:gap-1.5">
            <p className="text-xs font-bold uppercase tracking-widest">Actividad Cultural</p>
            <p className="text-[10px] text-slate-500">Ticket de entrega de comida</p>
            <div className="w-full border-b border-dashed border-slate-500 my-1" />

            <p className="text-[10px] text-slate-500 uppercase">Estudiante</p>
            <p className="text-xl font-extrabold leading-tight">{scanResult.estudiante}</p>
            <p className="text-sm text-slate-700">{scanResult.grado}</p>

            <div className="w-full border-b border-dashed border-slate-500 my-1" />

            <p className="text-[10px] text-slate-500 uppercase">Platos disponibles</p>
            <p className="text-4xl font-black leading-none my-1">{scanResult.total_platos}</p>
            <p className="text-xs text-slate-700">
              Incluidos en cuota: {scanResult.platos_incluidos ?? 0} &middot; Extra: {scanResult.platos_extra ?? 0}
            </p>

            <div className="w-full border-b border-dashed border-slate-500 my-1" />

            <p className="text-xs">Cuota: {scanResult.estado_cuota}</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Escaneado: {scannedAt ? formatDateTime(scannedAt.toISOString()) : ''}
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 text-center">Escanear QR</h1>

      <Card>
        <CardBody className="flex flex-col items-center py-8 sm:py-12">
          {!cameraActive ? (
            <>
              <i className="bi bi-camera text-5xl sm:text-6xl text-slate-300 mb-4" />
              <p className="text-slate-500 mb-6 text-center">
                Presiona el botón para activar la cámara y escanear un código QR
              </p>
              <Button variant="primary" size="lg" onClick={startScanner}>
                <i className="bi bi-camera" />
                Activar cámara
              </Button>
            </>
          ) : (
            <>
              <div id="qr-reader" className="w-full max-w-sm mb-4" />
              <Button variant="danger" onClick={reset}>
                <i className="bi bi-x-circle" />
                Cancelar
              </Button>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
