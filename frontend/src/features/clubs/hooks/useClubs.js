import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { clubsApi } from '../api/clubs.api';
import { uploadsApi } from '../../uploads/api/uploads.api';

export const clubKeys = {
  all: ['clubs'],

  lists: () => [...clubKeys.all, 'list'],

  list: (params) => [...clubKeys.lists(), params],

  detail: (id) => [...clubKeys.all, 'detail', id],

  members: (clubId) => [...clubKeys.all, 'members', clubId],

  joinRequests: (clubId) => [
    ...clubKeys.all,
    'join-requests',
    clubId,
  ],
};

function invalidateClubData(queryClient, clubId) {
  queryClient.invalidateQueries({
    queryKey: clubKeys.lists(),
  });

  queryClient.invalidateQueries({
    queryKey: clubKeys.members(clubId),
  });

  queryClient.invalidateQueries({
    queryKey: clubKeys.joinRequests(clubId),
  });

  queryClient.invalidateQueries({
    queryKey: ['dashboard', 'stats'],
  });
}

/* -------------------- Queries -------------------- */

export function useClubs(params) {
  return useQuery({
    queryKey: clubKeys.list(params),
    queryFn: () => clubsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useClubMembers(clubId, enabled = true) {
  return useQuery({
    queryKey: clubKeys.members(clubId),
    queryFn: () => clubsApi.getMembers(clubId),
    enabled: Boolean(clubId) && enabled,
  });
}

export function useClubJoinRequests(clubId, enabled = false) {
  return useQuery({
    queryKey: clubKeys.joinRequests(clubId),
    queryFn: () => clubsApi.getJoinRequests(clubId),
    enabled: Boolean(clubId) && enabled,
  });
}

/* -------------------- Club creation -------------------- */

export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ form, imageFile }) => {
      let image;

      if (imageFile) {
        const uploaded = await uploadsApi.upload(imageFile, 'clubs');
        image = uploaded.url;
      }

      return clubsApi.create({
        ...form,
        ...(image ? { image } : {}),
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: clubKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'stats'],
      });
    },
  });
}

/* -------------------- Join request flow -------------------- */

export function useRequestToJoinClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId) => clubsApi.requestToJoin(clubId),

    onSuccess: (_data, clubId) => {
      invalidateClubData(queryClient, clubId);
    },
  });
}

export function useLeaveClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId) => clubsApi.leave(clubId),

    onSuccess: (_data, clubId) => {
      invalidateClubData(queryClient, clubId);
    },
  });
}

export function useDecideJoinRequest(clubId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, status }) =>
      clubsApi.decideJoinRequest(clubId, requestId, status),

    onSuccess: () => {
      invalidateClubData(queryClient, clubId);
    },
  });
}

/* -------------------- Club local roles -------------------- */

export function useUpdateMemberRole(clubId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }) =>
      clubsApi.updateMemberRole(clubId, userId, role),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: clubKeys.members(clubId),
      });

      queryClient.invalidateQueries({
        queryKey: clubKeys.lists(),
      });
    },
  });
}