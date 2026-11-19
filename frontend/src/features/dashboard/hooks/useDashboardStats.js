import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,

    // Data is real DB data; refresh periodically while dashboard is open.
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}