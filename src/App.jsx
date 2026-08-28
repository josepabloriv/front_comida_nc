import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './routes/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Spinner from './components/ui/Spinner';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StudentsListPage = lazy(() => import('./pages/StudentsListPage'));
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage'));
const PaymentFormPage = lazy(() => import('./pages/PaymentFormPage'));
const QrCurrentPage = lazy(() => import('./pages/QrCurrentPage'));
const QrScanPage = lazy(() => import('./pages/QrScanPage'));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage'));
const ReceiptsListPage = lazy(() => import('./pages/ReceiptsListPage'));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

function AppRoutes() {
  const { user, logout } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell user={user} onLogout={logout}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/estudiantes" element={<StudentsListPage />} />
                    <Route path="/estudiantes/:id" element={<StudentDetailPage />} />
                    <Route path="/estudiantes/:id/qr" element={<QrCurrentPage />} />
                    <Route path="/pagos/nuevo" element={<PaymentFormPage />} />
                    <Route path="/pagos/:paymentId/comprobante" element={<ReceiptPage />} />
                    <Route path="/comprobantes" element={<ReceiptsListPage />} />
                    <Route path="/qr" element={<QrCurrentPage />} />
                    <Route path="/qr/escanear" element={<QrScanPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
