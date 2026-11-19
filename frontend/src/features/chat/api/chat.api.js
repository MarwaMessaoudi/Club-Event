import { api } from '../../../lib/http/client';

export const chatApi = {
  getConversations: () => api.get('/chat/conversations').then((r) => r.data),

  getOrCreateDirect: (targetUserId) =>
    api.post(`/chat/direct/${targetUserId}`).then((r) => r.data),

  getOrCreateClubChat: (clubId) =>
    api.get(`/chat/club/${clubId}`).then((r) => r.data),

  getMessages: (conversationId, params = {}) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params }).then((r) => r.data),

  sendMessage: (conversationId, content) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { content }).then((r) => r.data),

  searchContacts: (search = '') =>
    api.get('/chat/contacts', { params: { search } }).then((r) => r.data),
};