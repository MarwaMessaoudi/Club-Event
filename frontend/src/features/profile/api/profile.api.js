import { api } from '../../../lib/http/client';
export const profileApi = {
  getMe: () => api.get('/users/me').then(r=>r.data),
  updateMe: (payload) => api.patch('/users/me', payload).then(r=>r.data),
  changePassword: (payload) => api.patch('/users/me/password', payload),
};