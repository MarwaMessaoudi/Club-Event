const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BACKEND_ORIGIN = new URL(API_URL).origin;

export function getFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}