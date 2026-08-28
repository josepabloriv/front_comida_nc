import Button from '../ui/Button';

export default function Topbar({ onMenuToggle, user, onLogout }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-slate-200 no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Abrir menú"
        >
          <i className="bi bi-list text-xl" />
        </button>
        <span className="text-sm font-medium text-slate-700 hidden sm:inline">Noche Cultural</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
          <i className="bi bi-person-circle" />
          <span>{user?.email || 'Usuario'}</span>
        </div>
        <Button variant="danger" size="sm" onClick={onLogout}>
          <i className="bi bi-box-arrow-right" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  );
}
