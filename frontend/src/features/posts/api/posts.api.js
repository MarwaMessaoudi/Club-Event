import { api } from '../../../lib/http/client';

export const postsApi = {
  list: (params = {}) => api.get('/posts', { params }).then((r) => r.data),

  create: (payload) => api.post('/posts', payload).then((r) => r.data),

  updateStatus: (id, status) =>
    api.patch(`/posts/${id}/status`, { status }).then((r) => r.data),

  setReaction: (postId, type) =>
    api.put(`/posts/${postId}/reactions`, { type }).then((r) => r.data),

  removeReaction: (postId) =>
    api.delete(`/posts/${postId}/reactions`),

  comments: (postId, params = {}) =>
    api.get(`/posts/${postId}/comments`, { params }).then((r) => r.data),

  createComment: (postId, payload) =>
    api.post(`/posts/${postId}/comments`, payload).then((r) => r.data),

  deleteComment: (postId, commentId) =>
    api.delete(`/posts/${postId}/comments/${commentId}`),

  view: (postId) =>
    api.post(`/posts/${postId}/view`).then((r) => r.data),
};