import { api } from '../../../lib/http/client';

export const dashboardApi = {
  getStats: () =>
    api.get('/dashboard/stats').then((response) => response.data),
};