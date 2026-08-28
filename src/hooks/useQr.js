import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentQr, getQrHistory, regenerateQr } from '../api/qr.api';

export function useCurrentQr(accountId) {
  return useQuery({
    queryKey: ['qr-current', accountId],
    queryFn: () => getCurrentQr(accountId),
    enabled: !!accountId,
  });
}

export function useQrHistory(accountId) {
  return useQuery({
    queryKey: ['qr-history', accountId],
    queryFn: () => getQrHistory(accountId),
    enabled: !!accountId,
  });
}

export function useRegenerateQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: regenerateQr,
    onSuccess: (_data, accountId) => {
      queryClient.invalidateQueries({ queryKey: ['qr-current', accountId] });
      queryClient.invalidateQueries({ queryKey: ['qr-history', accountId] });
    },
  });
}
