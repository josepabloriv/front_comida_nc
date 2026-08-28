const badgeStyles = {
  pagada: 'bg-emerald-100 text-emerald-800',
  pendiente: 'bg-amber-100 text-amber-800',
  activo: 'bg-emerald-100 text-emerald-800',
  inactivo: 'bg-slate-200 text-slate-600',
  default: 'bg-slate-100 text-slate-700',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  const style = badgeStyles[variant] || badgeStyles.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {children}
    </span>
  );
}
