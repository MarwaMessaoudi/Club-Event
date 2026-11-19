import { useEffect } from 'react';
import { useAuth } from '../auth/context/AuthContext';
import { connectSocket, disconnectSocket } from '../../lib/realtime/socket';

/**
 * Mounts nothing visible. Owns the socket lifecycle:
 * login → connect, token refresh → reconnect with new token,
 * logout → disconnect. Rendered once inside AuthProvider.
 */
export default function RealtimeProvider({ children }) {
  const { accessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
    } else {
      disconnectSocket();
    }
    return () => {
      // On token change we reconnect; on unmount we clean up.
      disconnectSocket();
    };
  }, [accessToken, isAuthenticated]);

  return children;
}