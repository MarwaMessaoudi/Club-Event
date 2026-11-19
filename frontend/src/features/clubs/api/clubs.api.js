import { api } from '../../../lib/http/client';

export const clubsApi = {
  list: (params = {}) =>
    api.get('/clubs', { params }).then((response) => response.data),

  getById: (id) =>
    api.get(`/clubs/${id}`).then((response) => response.data),

  create: (payload) =>
    api.post('/clubs', payload).then((response) => response.data),

  update: (id, payload) =>
    api.patch(`/clubs/${id}`, payload).then((response) => response.data),

  updateStatus: (id, status) =>
    api
      .patch(`/clubs/${id}/status`, { status })
      .then((response) => response.data),

  // Student sends a join request. It creates MembershipStatus.PENDING.
  requestToJoin: (clubId) =>
    api
      .post(`/clubs/${clubId}/join`)
      .then((response) => response.data),

  // Approved member leaves; pending student cancels request.
  leave: (clubId) =>
    api.delete(`/clubs/${clubId}/leave`),

  // Returns only approved members.
  getMembers: (clubId) =>
    api
      .get(`/clubs/${clubId}/members`)
      .then((response) => response.data),

  // Manager-only endpoint.
  getJoinRequests: (clubId) =>
    api
      .get(`/clubs/${clubId}/join-requests`)
      .then((response) => response.data),

  // Manager-only endpoint.
  decideJoinRequest: (clubId, requestId, status) =>
    api
      .patch(`/clubs/${clubId}/join-requests/${requestId}`, { status })
      .then((response) => response.data),

  // Manager-only endpoint.
  updateMemberRole: (clubId, userId, role) =>
    api
      .patch(`/clubs/${clubId}/members/${userId}/role`, { role })
      .then((response) => response.data),
};