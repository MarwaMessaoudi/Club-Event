import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BACKEND_ORIGIN = new URL(API_URL).origin;

let socket = null;

export function connectSocket(accessToken) {
  // Already connected with the same token → reuse
  if (socket?.connected && socket.auth?.token === accessToken) return socket;

  disconnectSocket();

  socket = io(BACKEND_ORIGIN, {
    auth: { token: accessToken },
    withCredentials: true,
    transports: ['websocket', 'polling'], // websocket first, fallback for strict networks
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}