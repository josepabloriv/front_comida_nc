import { useQuery } from '@tanstack/react-query';
import { getActiveActivity } from '../api/activities.api';

export function useActiveActivity() {
  return useQuery({
    queryKey: ['active-activity'],
    queryFn: getActiveActivity,
  });
}
