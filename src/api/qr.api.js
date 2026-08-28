import apiClient from './client';

export async function getCurrentQr(accountId) {
  const { data } = await apiClient.get(`/qr/${accountId}/current`);
  return data.data.qr;
}

export async function getQrHistory(accountId) {
  const { data } = await apiClient.get(`/qr/${accountId}/history`);
  return data.data.history;
}

export async function regenerateQr(accountId) {
  const { data } = await apiClient.post(`/qr/${accountId}/regenerate`);
  return data.data.qr;
}

export async function validateQr(token) {
  const { data } = await apiClient.post('/qr/validate', { token });
  return data.data;
}
