import { useEffect } from 'react';
import { getSocket } from '../../lib/realtime/socket';

/**
 * Subscribe to a platform event. Auto-cleans on unmount.
 *
 * Usage (the standard pattern — signal → invalidate → REST refetch):
 *   const queryClient = useQueryClient();
 *   useRealtimeEvent('post.reaction.updated', ({ postId }) => {
 *     queryClient.invalidateQueries({ queryKey: postKeys.lists() });
 *   });
 */
export function useRealtimeEvent(event, handler) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);
}