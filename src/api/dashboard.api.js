import apiClient from './client';

export async function getDashboard() {
  const { data } = await apiClient.get('/dashboard');
  return data.data.totals;
}

export async function getDashboardDaily({ fecha_inicio, fecha_fin } = {}) {
  const params = {};
  if (fecha_inicio) params.fecha_inicio = fecha_inicio;
  if (fecha_fin) params.fecha_fin = fecha_fin;
  const { data } = await apiClient.get('/dashboard/daily', { params });
  return data.data.daily;
}

export async function getDashboardByGrade({ grado } = {}) {
  const params = {};
  if (grado) params.grado = grado;
  const { data } = await apiClient.get('/dashboard/by-grade', { params });
  return data.data.byGrade;
}
