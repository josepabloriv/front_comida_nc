import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPayment, getPayment, getStudentPayments } from '../api/payments.api';

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['student-account', result.student_id] });
      queryClient.invalidateQueries({ queryKey: ['student-payments', result.student_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function usePayment(id) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => getPayment(id),
    enabled: !!id,
  });
}

export function useStudentPayments(studentId) {
  return useQuery({
    queryKey: ['student-payments', studentId],
    queryFn: () => getStudentPayments(studentId),
    enabled: !!studentId,
  });
}
