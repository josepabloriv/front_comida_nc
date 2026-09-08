import { useState, useEffect, useRef } from 'react';
import { validateQr, getCurrentQr } from '../api/qr.api';
import { getStudentAccount } from '../api/students.api';
import { useStudents } from '../hooks/useStudents';
import { useDebounce } from '../hooks/useDebounce';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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
 * Fuerza el tamaño de página a un rollo térmico de 58mm (impresora 3nStar
 * RPT001) mientras esta pantalla está montada, para el ticket que se
 * imprime al validar un QR. Se retira al salir de la pantalla para no
 * afectar otras impresiones (por ejemplo el comprobante, que usa tamaño
 * carta). El margen de 4mm por lado deja ~50mm de ancho imprimible, que es
 * el área útil real de la mayoría de impresoras térmicas de 58mm (el rollo
 * mide 58mm pero el cabezal no imprime hasta el borde).
 */
function useThermalPrintSize() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'ticket-print-page-size';
    style.textContent = '@page { size: 58mm auto; margin: 4mm 4mm; }';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}

export default function QrScanPage() {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedAt, setScannedAt] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [resolvingStudentId, setResolvingStudentId] = useState(null);
  const scannerRef = useRef(null);

  const debouncedStudentSearch = useDebounce(studentSearch, 300);
  const { data: studentResults, isLoading: searchingStudents } = useStudents({
    search: debouncedStudentSearch,
    enabled: debouncedStudentSearch.trim().length >= 2,
  });

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
    setStudentSearch('');
    if (scannerRef.current) {
      try { scannerRef.current.stop(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
  };

  /**
   * Imprime el ticket de un estudiante sin pasar por la cámara: busca su QR
   * vigente (mismo endpoint que /qr/:id) y lo valida con el mismo RPC
   * validar_qr() que usa un escaneo real, así el ticket resultante es
   * idéntico y respeta la regla de que el token siempre se verifica en
   * PostgreSQL (nunca se confía en datos calculados en el frontend).
   */
  const handleSelectStudent = async (student) => {
    const studentId = student.student_id || student.id;
    setResolvingStudentId(studentId);
    try {
      const account = await getStudentAccount(studentId);
      // v_estado_cuentas expone el id de cuenta como `account_id`
      // (Backend/sql/04_sin_deuda_por_pago_parcial.sql: `aa.id AS account_id`).
      const accountId = account?.account_id;
      if (!accountId) throw new Error('Este estudiante no tiene una cuenta de actividad.');

      const qr = await getCurrentQr(accountId);
      const token = qr?.qr_payload?.token || qr?.qr_token;
      if (!token) throw new Error('Este estudiante no tiene un QR generado.');

      setStudentSearch('');
      await handleValidate(token);
    } catch (err) {
      toast.error(err.message || 'No se pudo obtener el QR del estudiante.');
    } finally {
      setResolvingStudentId(null);
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

      {!cameraActive && (
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-700 mb-1">
              ¿No puedes usar la cámara?
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Busca al estudiante por nombre e imprime su ticket directamente, sin escanear el QR.
            </p>
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Nombre, apellidos o grado..."
            />

            {debouncedStudentSearch.trim().length >= 2 && (
              <div className="mt-3 space-y-2">
                {searchingStudents ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : studentResults && studentResults.length > 0 ? (
                  studentResults.map((student) => {
                    const studentId = student.student_id || student.id;
                    const isResolving = resolvingStudentId === studentId;
                    return (
                      <button
                        key={studentId}
                        type="button"
                        disabled={!!resolvingStudentId}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-50"
                      >
                        <span>
                          <span className="block text-sm font-medium text-slate-900">
                            {student.nombre} {student.apellidos}
                          </span>
                          <span className="block text-xs text-slate-500">{student.grado}</span>
                        </span>
                        {isResolving ? <Spinner size="sm" /> : <i className="bi bi-printer text-slate-400" />}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">Sin resultados.</p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
