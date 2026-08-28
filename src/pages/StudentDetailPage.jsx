import { useParams, useNavigate } from 'react-router-dom';
import { useStudent, useStudentAccount } from '../hooks/useStudents';
import { useStudentPayments } from '../hooks/usePayments';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ResponsiveTable from '../components/ui/ResponsiveTable';
import EmptyState from '../components/shared/EmptyState';
import EstadoCuotaBadge from '../components/shared/EstadoCuotaBadge';
import MoneyDisplay from '../components/shared/MoneyDisplay';
import { formatCurrency, formatDateTime } from '../lib/formatters';
import { Link } from 'react-router-dom';

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: student, isLoading: loadingStudent } = useStudent(id);
  const { data: account, isLoading: loadingAccount } = useStudentAccount(id);
  const { data: payments, isLoading: loadingPayments } = useStudentPayments(id);

  if (loadingStudent || loadingAccount) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!student) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <i className="bi bi-person-x text-5xl text-slate-300 mb-3 block" />
          <p className="text-slate-500 font-medium">Estudiante no encontrado</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/estudiantes')}>
            Volver al listado
          </Button>
        </CardBody>
      </Card>
    );
  }

  const cuenta = account || {};
  const cuotaPagada = cuenta.cuota_pagada || 0;
  const cuotaBase = cuenta.cuota_base || 150;
  const progress = Math.min((cuotaPagada / cuotaBase) * 100, 100);

  const paymentColumns = [
    { key: 'created_at', label: 'Fecha', render: (v) => formatDateTime(v) },
    { key: 'monto_cuota', label: 'Cuota', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'cantidad_platos_extra', label: 'Extras', align: 'right' },
    { key: 'total_pago', label: 'Total', align: 'right', className: 'font-semibold', render: (v) => formatCurrency(v) },
    { key: 'payment_id', label: 'Acción', align: 'right', render: (v, row) => (
      <Link
        to={`/pagos/${v || row.id}/comprobante`}
        className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-sm inline-flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <i className="bi bi-receipt" />
        <span className="hidden sm:inline">Comprobante</span>
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/estudiantes')}>
            <i className="bi bi-arrow-left" />
            Volver
          </Button>
          <h1 className="text-2xl font-semibold text-slate-900 mt-2">
            {student.nombre} {student.apellidos}
          </h1>
          <p className="text-slate-500">
            <i className="bi bi-mortarboard mr-1" />
            {student.grado}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="success" onClick={() => navigate(`/pagos/nuevo?studentId=${id}`)}>
            <i className="bi bi-credit-card" />
            Registrar pago
          </Button>
          {cuenta.activity_account_id && (
            <Button variant="primary" onClick={() => navigate(`/estudiantes/${id}/qr`)}>
              <i className="bi bi-qr-code" />
              Ver QR
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            <i className="bi bi-wallet2 mr-2 text-blue-600" />
            Estado de cuenta
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-sm text-slate-500">Cuota pagada</p>
              <p className="text-lg sm:text-xl font-semibold text-slate-900">
                <MoneyDisplay amount={cuotaPagada} /> / <MoneyDisplay amount={cuotaBase} />
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Estado cuota</p>
              <div className="mt-1">
                <EstadoCuotaBadge estado={cuenta.estado_cuota || 'SIN PAGO'} />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total platos</p>
              <p className="text-lg sm:text-xl font-semibold text-slate-900">
                {cuenta.total_platos || 0}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-500 mb-1">
              <span>Progreso cuota</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            <i className="bi bi-clock-history mr-2 text-blue-600" />
            Historial de pagos
          </h2>
        </CardHeader>
        <CardBody>
          {loadingPayments ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : payments && payments.length > 0 ? (
            <ResponsiveTable
              columns={paymentColumns}
              data={payments}
              keyField="payment_id"
            />
          ) : (
            <EmptyState icon="bi-receipt" title="Sin pagos" description="No hay pagos registrados para este estudiante" />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
