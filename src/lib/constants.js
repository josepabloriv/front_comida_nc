export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const CURRENCY = 'Q';

export const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
];

export const SIDEBAR_ITEMS = [
  { icon: 'bi-speedometer2', label: 'Dashboard', path: '/dashboard' },
  { icon: 'bi-mortarboard', label: 'Estudiantes', path: '/estudiantes' },
  { icon: 'bi-credit-card', label: 'Pagos', path: '/pagos/nuevo' },
  { icon: 'bi-qr-code', label: 'Código QR', path: '/qr' },
  { icon: 'bi-receipt', label: 'Comprobantes', path: '/comprobantes' },
  { icon: 'bi-camera', label: 'Escanear QR', path: '/qr/escanear' },
];
