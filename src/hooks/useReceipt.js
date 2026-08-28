import { useQuery } from '@tanstack/react-query';
import { getReceipt } from '../api/receipts.api';

export function useReceipt(paymentId) {
  return useQuery({
    queryKey: ['receipt', paymentId],
    queryFn: () => getReceipt(paymentId),
    enabled: !!paymentId,
  });
}
