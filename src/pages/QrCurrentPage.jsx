import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentQr, useQrHistory, useRegenerateQr } from '../hooks/useQr';
import { useStudent, useStudentAccount } from '../hooks/useStudents';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ResponsiveTable from '../components/ui/ResponsiveTable';
import EmptyState from '../components/shared/EmptyState';
import { formatDateTime } from '../lib/formatters';
import { toast } from 'sonner';

export default function QrCurrentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const { data: student } = useStudent(id);
  const { data: account } = useStudentAccount(id);
  const accountId = account?.account_id;
  const { data: qr, isLoading: loadingQr } = useCurrentQr(accountId);
  const { data: history, isLoading: loadingHistory } = useQrHistory(accountId);
  const regenerateQr = useRegenerateQr();

  const handleRegenerate = async () => {
    try {
      await regenerateQr.mutateAsync(accountId);
      toast.success('QR regenerado correctamente');
      setShowRegenerateModal(false);
    } catch (err) {
      toast.error(err.message || 'Error al regenerar QR');
    }
  };

  if (loadingQr) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const historyColumns = [
    { key: 'version', label: 'Versión', className: 'font-medium', render: (v) => `v${v}` },
    { key: 'created_at', label: 'Generado', render: (v) => formatDateTime(v) },
    { key: 'invalidated_at', label: 'Invalidado', render: (v) => v ? formatDateTime(v) : '-' },
    { key: 'activo', label: 'Estado', align: 'center', render: (v) => (
      <Badge variant={v ? 'activo' : 'inactivo'}>{v ? 'Activo' : 'Inactivo'}</Badge>
    )},
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
          Volver
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900 mt-2">
          Código QR - {student?.nombre} {student?.apellidos}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            <i className="bi bi-qr-code mr-2 text-blue-600" />
            QR Actual
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col items-center">
          {qr?.qrImage ? (
            <div className="mb-4">
              <img src={qr.qrImage} alt="Código QR" className="w-48 h-48 sm:w-64 sm:h-64" />
            </div>
          ) : qr?.qr_payload ? (
            <div className="mb-4 p-4 bg-slate-100 rounded-lg w-full">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(qr.qr_payload, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="bi bi-qr-code text-6xl text-slate-300 mb-4 block" />
              <p className="text-slate-500">No hay QR generado</p>
            </div>
          )}

          {qr && (
            <div className="text-center space-y-2 mb-4">
              <Badge variant={qr.activo ? 'activo' : 'inactivo'}>
                {qr.activo ? 'QR vigente' : 'QR reemplazado'}
              </Badge>
              <p className="text-sm text-slate-500">Versión: {qr.version}</p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {id && (
              <Button
                variant="success"
                onClick={() => navigate(`/pagos/nuevo?studentId=${id}`)}
              >
                <i className="bi bi-plus-circle" />
                Agregar más platos
              </Button>
            )}
            <Button
              variant="warning"
              onClick={() => setShowRegenerateModal(true)}
              disabled={!accountId}
            >
              <i className="bi bi-arrow-clockwise" />
              Regenerar QR
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            <i className="bi bi-clock-history mr-2 text-blue-600" />
            Historial de generaciones
          </h2>
        </CardHeader>
        <CardBody>
          {loadingHistory ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : history && history.length > 0 ? (
            <ResponsiveTable columns={historyColumns} data={history} keyField="version" />
          ) : (
            <EmptyState icon="bi-clock-history" title="Sin historial" description="No hay generaciones de QR registradas" />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        title="Regenerar QR"
      >
        <p className="text-slate-600 mb-4">
          Se generará un nuevo código QR. El QR actual quedará <strong>invalidado</strong> y no podrá usarse.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowRegenerateModal(false)}>
            Cancelar
          </Button>
          <Button variant="warning" loading={regenerateQr.isPending} onClick={handleRegenerate}>
            <i className="bi bi-arrow-clockwise" />
            Confirmar regeneración
          </Button>
        </div>
      </Modal>
    </div>
  );
}
