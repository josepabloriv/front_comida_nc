export default function EmptyState({ icon = 'bi-inbox', title = 'Sin resultados', description = '' }) {
  return (
    <div className="text-center py-12">
      <i className={`bi ${icon} text-5xl text-slate-300 mb-3 block`} />
      <p className="text-slate-500 font-medium">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
    </div>
  );
}
