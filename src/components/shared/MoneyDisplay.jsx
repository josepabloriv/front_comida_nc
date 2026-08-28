import { formatCurrency } from '../../lib/formatters';

export default function MoneyDisplay({ amount, className = '' }) {
  return <span className={`font-mono ${className}`}>{formatCurrency(amount)}</span>;
}
