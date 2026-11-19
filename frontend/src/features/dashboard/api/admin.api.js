import { api } from '../../../lib/http/client';

export const adminApi = {
  getStats: () => api.get('/admin/stats').then((r) => r.data),
};