import apiClient from './client';

export async function getStudents({ search = '', grado = '' } = {}) {
  const params = {};
  if (search) params.search = search;
  if (grado) params.grado = grado;
  const { data } = await apiClient.get('/students', { params });
  return data.data.students;
}

export async function getStudent(id) {
  const { data } = await apiClient.get(`/students/${id}`);
  return data.data.student;
}

export async function getStudentAccount(id) {
  const { data } = await apiClient.get(`/students/${id}/account`);
  return data.data.account;
}
