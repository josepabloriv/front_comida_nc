import Badge from '../ui/Badge';

// El backend usa 'PAGADO' (v_estado_cuentas, registrar_pago) y 'PAGADA'
// (comprobante impreso) según el género de "cuota"/"pago" en cada texto.
const PAGADO_VALUES = ['PAGADO', 'PAGADA'];

export default function EstadoCuotaBadge({ estado }) {
  const variant = PAGADO_VALUES.includes(estado) ? 'pagada' : 'pendiente';
  return <Badge variant={variant}>{estado}</Badge>;
}
