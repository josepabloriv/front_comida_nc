import { NavLink } from 'react-router-dom';
import { SIDEBAR_ITEMS } from '../../lib/constants';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full bg-white border-r border-slate-200
          transform transition-all duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:w-64 xl:w-64
        `}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
          <i className="bi bi-calendar-event text-blue-600 text-xl" />
          <span className="text-lg font-semibold text-slate-900">Noche Cultural</span>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                }`
              }
            >
              <i className={`bi ${item.icon} text-lg shrink-0`} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
