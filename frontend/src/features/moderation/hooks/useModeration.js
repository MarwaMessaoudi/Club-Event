import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clubsApi } from '../../clubs/api/clubs.api';
import { eventsApi } from '../../events/api/events.api';
import { postsApi } from '../../posts/api/posts.api';

export const moderationKeys = {
  all: ['moderation'],
  pending: (type) => [...moderationKeys.all, type],
};

const apis = { clubs: clubsApi, events: eventsApi, posts: postsApi };
const PAGE_SIZE = 5;

function usePendingList(type, page) {
  return useQuery({
    queryKey: [...moderationKeys.pending(type), page],
    queryFn: () => apis[type].list({ status: 'pending', page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}

export const usePendingClubs = (page) => usePendingList('clubs', page);
export const usePendingEvents = (page) => usePendingList('events', page);
export const usePendingPosts = (page) => usePendingList('posts', page);

// role-aware: admin counts clubs+events only, supervisor counts clubs+events+posts
export function usePendingCount(role, enabled) {
  const query = useQuery({
    queryKey: [...moderationKeys.all, 'count', role],
    queryFn: async () => {
      if (role === 'admin') {
        const [c, e] = await Promise.all([
          clubsApi.list({ status: 'pending', page: 1, limit: 1 }),
          eventsApi.list({ status: 'pending', page: 1, limit: 1 }),
        ]);
        return (c.meta?.total ?? 0) + (e.meta?.total ?? 0);
      }
      const [c, e, p] = await Promise.all([
        clubsApi.list({ status: 'pending', page: 1, limit: 1 }),
        eventsApi.list({ status: 'pending', page: 1, limit: 1 }),
        postsApi.list({ status: 'pending', page: 1, limit: 1 }),
      ]);
      return (c.meta?.total ?? 0) + (e.meta?.total ?? 0) + (p.meta?.total ?? 0);
    },
    enabled: Boolean(enabled),
    staleTime: 30000,
  });
  return query.data ?? 0;
}

export function useUpdateStatus(type) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apis[type].updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
      queryClient.invalidateQueries({ queryKey: [type] });
    },
  });
}