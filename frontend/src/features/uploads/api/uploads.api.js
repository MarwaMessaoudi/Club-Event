import { api } from '../../../lib/http/client';

export const uploadsApi = {
  async upload(file, folder) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/uploads', formData, {
      params: folder ? { folder } : {},
    });
    return data; // { url, mimeType, size, filename }
  },
};