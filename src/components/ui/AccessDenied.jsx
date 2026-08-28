import { useAuth } from '../../hooks/useAuth';

export default function AccessDenied() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <i className="bi bi-shield-x text-3xl text-red-500" aria-hidden="true"></i>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Acceso denegado</h1>
          <p className="text-slate-600 mb-6">
            No tienes permisos para acceder a esta sección.
            {user?.email && (
              <span className="block mt-1 text-sm text-slate-500">
                Sesión activa: {user.email}
              </span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <i className="bi bi-house" aria-hidden="true"></i>
              Ir al inicio
            </a>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
