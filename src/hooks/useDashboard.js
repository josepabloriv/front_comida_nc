import { useQuery } from '@tanstack/react-query';
import { getDashboard, getDashboardDaily, getDashboardByGrade } from '../api/dashboard.api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });
}

export function useDashboardDaily({ fecha_inicio, fecha_fin } = {}) {
  return useQuery({
    queryKey: ['dashboard-daily', { fecha_inicio, fecha_fin }],
    queryFn: () => getDashboardDaily({ fecha_inicio, fecha_fin }),
  });
}

export function useDashboardByGrade({ grado } = {}) {
  return useQuery({
    queryKey: ['dashboard-by-grade', { grado }],
    queryFn: () => getDashboardByGrade({ grado }),
  });
}
