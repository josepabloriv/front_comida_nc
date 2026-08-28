import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudents } from '../hooks/useStudents';
import { useStudentPayments } from '../hooks/usePayments';
import { useDebounce } from '../hooks/useDebounce';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import ResponsiveTable from '../components/ui/ResponsiveTable';
import EmptyState from '../components/shared/EmptyState';
import { formatCurrency, formatDateTime } from '../lib/formatters';

export default function ReceiptsListPage() {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedSearch = useDebounce(studentSearch, 300);

  const { data: students, isLoading: loadingStudents } = useStudents({ search: debouncedSearch });
  const { data: payments, isLoading: loadingPayments } = useStudentPayments(selectedStudentId);

  const studentsList = students || [];

  const paymentColumns = [
    { key: 'created_at', label: 'Fecha', render: (v) => formatDateTime(v) },
    { key: 'numero_comprobante', label: 'N. Comprobante', className: 'font-mono font-semibold' },
    { key: 'monto_cuota', label: 'Cuota', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'cantidad_platos_extra', label: 'Extras', align: 'right' },
    { key: 'total_pago', label: 'Total', align: 'right', className: 'font-semibold', render: (v) => formatCurrency(v) },
    { key: 'payment_id', label: '', align: 'right', render: (v, row) => (
      <Link
        to={`/pagos/${v || row.id}/comprobante`}
        className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <i className="bi bi-receipt" />
        Ver comprobante
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Comprobantes</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            <i className="bi bi-search mr-2 text-blue-600" />
            Buscar por estudiante
          </h2>
        </CardHeader>
        <CardBody>
          <div className="max-w-md">
            <Input
              placeholder="Buscar por nombre, apellidos o grado..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>
          {loadingStudents && studentSearch && (
            <div className="flex justify-center py-2"><Spinner size="sm" /></div>
          )}
          {!loadingStudents && studentSearch && studentsList.length > 0 && (
            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto mt-2 max-w-md">
              {studentsList.slice(0, 10).map((s) => (
                <button
                  key={s.student_id || s.id}
                  type="button"
                  className={`w-full text-left px-4 py-2 border-b border-slate-100 last:border-0 ${
                    selectedStudentId === (s.student_id || s.id) ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    setSelectedStudentId(s.student_id || s.id);
                    setStudentSearch(`${s.nombre} ${s.apellidos}`);
                  }}
                >
                  <p className="font-medium text-slate-900 text-sm">{s.nombre} {s.apellidos}</p>
                  <p className="text-xs text-slate-500">{s.grado}</p>
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {selectedStudentId && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              <i className="bi bi-receipt mr-2 text-blue-600" />
              Comprobantes del estudiante
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
              <EmptyState
                icon="bi-receipt"
                title="Sin comprobantes"
                description="No hay pagos registrados para este estudiante"
              />
            )}
          </CardBody>
        </Card>
      )}

      {!selectedStudentId && (
        <Card>
          <CardBody>
            <EmptyState
              icon="bi-search"
              title="Selecciona un estudiante"
              description="Busca y selecciona un estudiante para ver sus comprobantes"
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
