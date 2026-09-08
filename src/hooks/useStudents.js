import { useQuery } from '@tanstack/react-query';
import { getStudents, getStudent, getStudentAccount } from '../api/students.api';

export function useStudents({ search = '', grado = '', enabled = true } = {}) {
  return useQuery({
    queryKey: ['students', { search, grado }],
    queryFn: () => getStudents({ search, grado }),
    enabled,
  });
}

export function useStudent(id) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudent(id),
    enabled: !!id,
  });
}

export function useStudentAccount(id) {
  return useQuery({
    queryKey: ['student-account', id],
    queryFn: () => getStudentAccount(id),
    enabled: !!id,
  });
}
