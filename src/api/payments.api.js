import apiClient from './client';

export async function createPayment(payload) {
  const { data } = await apiClient.post('/payments', payload);
  return data.data;
}

export async function getPayment(id) {
  const { data } = await apiClient.get(`/payments/${id}`);
  return data.data.payment;
}

export async function getStudentPayments(studentId) {
  const { data } = await apiClient.get(`/students/${studentId}/payments`);
  return data.data.payments;
}
