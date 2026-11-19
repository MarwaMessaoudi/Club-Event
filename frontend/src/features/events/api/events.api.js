import { api } from '../../../lib/http/client';

export const eventsApi = {
  list: (params = {}) =>
    api.get('/events', { params }).then((r) => r.data),

  getById: (id) =>
    api.get(`/events/${id}`).then((r) => r.data),

  create: (payload) =>
    api.post('/events', payload).then((r) => r.data),

  update: (id, payload) =>
    api.patch(`/events/${id}`, payload).then((r) => r.data),

  remove: (id) =>
    api.delete(`/events/${id}`),

  updateStatus: (id, status) =>
    api.patch(`/events/${id}/status`, { status }).then((r) => r.data),

  register: (id) =>
    api.post(`/events/${id}/register`).then((r) => r.data),

  cancelRegistration: (id) =>
    api.delete(`/events/${id}/register`),

  listRegistrations: (id, params = {}) =>
    api.get(`/events/${id}/registrations`, { params }).then((r) => r.data),

  checkIn: (eventId, registrationId) =>
    api
      .post(`/events/${eventId}/registrations/${registrationId}/check-in`)
      .then((r) => r.data),
};