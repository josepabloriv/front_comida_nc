import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Vive en su propio archivo (separado de AuthContext.jsx) a propósito:
 * cuando un componente (AuthProvider) y un hook (useAuth) se exportan del
 * mismo módulo, Vite no puede aplicar Fast Refresh de forma consistente y
 * fuerza una invalidación completa del árbol en caliente. Eso provocaba que,
 * al editar casi cualquier archivo, la app se re-renderizara una vez fuera
 * de <AuthProvider> y lanzara "useAuth debe usarse dentro de un
 * AuthProvider" (autorecuperable, pero visible en consola/pantalla).
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
