import apiClient from './client';

export async function getReceipt(paymentId) {
  const { data } = await apiClient.get(`/payments/${paymentId}/receipt`);
  return data.data.receipt;
}
