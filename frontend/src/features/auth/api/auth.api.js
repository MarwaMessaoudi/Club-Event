import { api } from '../../../lib/http/client';


let refreshPromise = null;

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then((res) => res.data) // { user, accessToken }
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((res) => res.data),

  register: (payload) =>
    api.post('/auth/register', payload).then((res) => res.data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me').then((res) => res.data),
};