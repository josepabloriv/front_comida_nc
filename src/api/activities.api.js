import apiClient from './client';

export async function getActiveActivity() {
  const { data } = await apiClient.get('/activities/active');
  return data.data.activity;
}
