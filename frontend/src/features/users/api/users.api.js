import { api } from '../../../lib/http/client';

export const usersApi = {
  list: (params = {}) => api.get('/users', { params }).then((r) => r.data),

  getById: (id) => api.get(`/users/${id}`).then((r) => r.data),

  updateRole: (id, role) =>
    api.patch(`/users/${id}/role`, { role }).then((r) => r.data),

  updateStatus: (id, status) =>
    api.patch(`/users/${id}/status`, { status }).then((r) => r.data),
};