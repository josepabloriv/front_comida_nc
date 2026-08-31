import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePayment } from '../hooks/usePayments';
import { useStudents, useStudent, useStudentAccount } from '../hooks/useStudents';
import { useActiveActivity } from '../hooks/useActivities';
import { useDebounce } from '../hooks/useDebounce';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../lib/formatters';
import { METODOS_PAGO } from '../lib/constants';
import { toast } from 'sonner';

const paymentSchema = z.object({
  montoCuota: z.coerce.number().min(0, 'El monto no puede ser negativo'),
  cantidadPlatosExtra: z.coerce.number().int().min(0, 'Mínimo 0'),
  metodoPago: z.string().min(1, 'Selecciona un método de pago'),
  observaciones: z.string().optional(),
});

export default function PaymentFormPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedId = searchParams.get('studentId') || '';

  const [selectedStudentId, setSelectedStudentId] = useState(preselectedId);
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedSearch = useDebounce(studentSearch, 300);

  const { data: students, isLoading: loadingStudents } = useStudents({ search: debouncedSearch });
  const { data: selectedStudent } = useStudent(selectedStudentId);
  const { data: selectedAccount } = useStudentAccount(selectedStudentId);
  const { data: activity, isLoading: loadingActivity } = useActiveActivity();
  const createPayment = useCreatePayment();

  const studentsList = students || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      montoCuota: 0,
      cantidadPlatosExtra: 0,
      metodoPago: 'EFECTIVO',
      observaciones: '',
    },
  });

  const montoCuota = watch('montoCuota');
  const cantidadExtras = watch('cantidadPlatosExtra');
  const precioExtra = activity?.precio_plato_extra || 40;
  const totalExtras = cantidadExtras * precioExtra;
  const totalRecibido = Number(montoCuota) + totalExtras;

  // Cuota ya completa: este formulario pasa a usarse solo para agregar
  // platos extra adicionales a un pago ya existente. Cada envío llama de
  // nuevo a registrar_pago (vía createPayment), que acumula los platos
  // extra y genera una nueva versión del QR con el total actualizado.
  const cuotaCompleta = Boolean(selectedAccount) && Number(selectedAccount.saldo_cuota) <= 0 && Number(selectedAccount.cuota_pagada) > 0;

  useEffect(() => {
    if (cuotaCompleta) {
      setValue('montoCuota', 0);
    }
  }, [cuotaCompleta, selectedStudentId, setValue]);

  const onSubmit = async (values) => {
    if (!selectedStudentId) {
      toast.error('Selecciona un estudiante');
      return;
    }
    try {
      const result = await createPayment.mutateAsync({
        studentId: selectedStudentId,
        montoCuota: values.montoCuota,
        cantidadPlatosExtra: values.cantidadPlatosExtra,
        metodoPago: values.metodoPago,
        observaciones: values.observaciones || null,
      });
      toast.success('Pago registrado correctamente');
      if (result.payment_id) {
        navigate(`/pagos/${result.payment_id}/comprobante`);
      }
    } catch (err) {
      const msg = err.message || 'Error al registrar el pago';
      if (err.status === 409) {
        setError('montoCuota', { message: msg });
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
          Volver
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900 mt-2">
          {cuotaCompleta ? 'Agregar platos extra' : 'Registrar pago'}
        </h1>
      </div>

      {loadingActivity ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              <i className="bi bi-mortarboard mr-2 text-blue-600" />
              Estudiante
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {selectedStudentId && selectedStudent ? (
              <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    {selectedStudent.nombre} {selectedStudent.apellidos}
                  </p>
                  <p className="text-sm text-slate-500">{selectedStudent.grado}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedStudentId('')}>
                  <i className="bi bi-x-lg" />
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Buscar por nombre, apellidos o grado..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                {loadingStudents && studentSearch && (
                  <div className="flex justify-center py-2"><Spinner size="sm" /></div>
                )}
                {!loadingStudents && studentSearch && studentsList.length > 0 && (
                  <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                    {studentsList.slice(0, 10).map((s) => (
                      <button
                        key={s.student_id || s.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-0"
                        onClick={() => {
                          setSelectedStudentId(s.student_id || s.id);
                          setStudentSearch('');
                        }}
                      >
                        <p className="font-medium text-slate-900 text-sm">{s.nombre} {s.apellidos}</p>
                        <p className="text-xs text-slate-500">{s.grado}</p>
                      </button>
                    ))}
                  </div>
                )}
                {!loadingStudents && studentSearch && studentsList.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">No se encontraron estudiantes</p>
                )}
              </>
            )}

            {selectedStudentId && selectedAccount?.cuota_pagada > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm space-y-1">
                <p className="text-amber-800">
                  Ya pagó <strong>{formatCurrency(selectedAccount.cuota_pagada)}</strong> de{' '}
                  {formatCurrency(selectedAccount.cuota_base)} ({selectedAccount.total_platos || 0} platos obtenidos).
                </p>
                {cuotaCompleta ? (
                  <p className="text-amber-700">
                    La cuota ya está completa. Aquí solo puedes <strong>agregar más platos extra</strong>;
                    al registrar se generará un <strong>nuevo código QR</strong> con el total de platos actualizado.
                  </p>
                ) : (
                  <p className="text-amber-700">
                    El monto que ingreses abajo se <strong>sumará</strong> a lo ya pagado
                    {selectedAccount.saldo_cuota > 0 && (
                      <> — puede agregar hasta {formatCurrency(selectedAccount.saldo_cuota)} más para completar la cuota</>
                    )}.
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              <i className="bi bi-credit-card mr-2 text-blue-600" />
              Datos del pago
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Monto cuota (Q)"
                type="number"
                step="0.01"
                min="0"
                max={selectedAccount?.saldo_cuota ?? undefined}
                disabled={cuotaCompleta}
                error={errors.montoCuota?.message}
                {...register('montoCuota')}
              />
              <Input
                label="Platos extra (cantidad)"
                type="number"
                min="0"
                error={errors.cantidadPlatosExtra?.message}
                {...register('cantidadPlatosExtra')}
              />
            </div>

            <Select label="Método de pago" error={errors.metodoPago?.message} {...register('metodoPago')}>
              {METODOS_PAGO.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Observaciones</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Opcional..."
                {...register('observaciones')}
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Cuota:</span>
                <span className="font-medium">{formatCurrency(montoCuota)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Extras ({cantidadExtras} x {formatCurrency(precioExtra)}):</span>
                <span className="font-medium">{formatCurrency(totalExtras)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="font-semibold text-slate-900">Total recibido:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalRecibido)}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="success"
              className="w-full"
              loading={isSubmitting || createPayment.isPending}
              disabled={!selectedStudentId}
            >
              <i className="bi bi-check-circle" />
              {cuotaCompleta ? 'Agregar platos extra y generar nuevo QR' : 'Registrar pago'}
            </Button>
          </CardBody>
        </Card>
      </form>
      )}
    </div>
  );
}
