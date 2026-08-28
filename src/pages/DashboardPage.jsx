import { useDashboard } from '../hooks/useDashboard';
import Card, { CardBody } from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../lib/formatters';

function KpiCard({ icon, label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <Card>
      <CardBody className="flex items-center gap-5 p-6">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          <i className={`bi ${icon} text-3xl`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-500 truncate">{label}</p>
          <p className="text-3xl font-bold text-slate-900 truncate">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const kpis = dashboard || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon="bi-cash-stack" label="Ingresos totales" value={formatCurrency(kpis.ingresos_totales)} color="green" />
        <KpiCard icon="bi-wallet2" label="Ingresos cuota" value={formatCurrency(kpis.ingresos_cuotas)} color="blue" />
        <KpiCard icon="bi-shop" label="Ingresos extras" value={formatCurrency(kpis.ingresos_platos_extra)} color="amber" />
        <KpiCard icon="bi-hourglass-split" label="Disponible para completar" value={formatCurrency(kpis.saldo_total_pendiente)} color="amber" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon="bi-receipt" label="Transacciones" value={kpis.cantidad_transacciones || 0} color="blue" />
        <KpiCard icon="bi-check-circle" label="Con pago registrado" value={kpis.cuotas_completas || 0} color="green" />
        <KpiCard icon="bi-clock" label="Sin pago registrado" value={kpis.cuotas_pendientes || 0} color="amber" />
        <KpiCard icon="bi-egg-fried" label="Platos comprados" value={kpis.total_platos_habilitados || 0} color="blue" />
      </div>
    </div>
  );
}
