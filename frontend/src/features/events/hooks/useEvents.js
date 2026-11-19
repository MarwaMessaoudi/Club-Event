import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { eventsApi } from '../api/events.api';
import { uploadsApi } from '../../uploads/api/uploads.api';

export const eventKeys = {
  all: ['events'],
  lists: () => [...eventKeys.all, 'list'],
  list: (params) => [...eventKeys.lists(), params],
  detail: (id) => [...eventKeys.all, 'detail', id],
  registrations: (id, params) => [
    ...eventKeys.all,
    'registrations',
    id,
    params,
  ],
};

export function useEvents(params) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => eventsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ form, imageFile }) => {
      let image;

      if (imageFile) {
        const uploaded = await uploadsApi.upload(imageFile, 'events');
        image = uploaded.url;
      }

      return eventsApi.create({
        ...form,
        ...(image ? { image } : {}),
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: eventKeys.lists(),
      });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, form, imageFile }) => {
      let image = form.image;

      if (imageFile) {
        const uploaded = await uploadsApi.upload(imageFile, 'events');
        image = uploaded.url;
      }

      return eventsApi.update(id, {
        ...form,
        ...(image ? { image } : {}),
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: eventKeys.all,
      });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId) => eventsApi.remove(eventId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: eventKeys.all,
      });
    },
  });
}

export function useRegisterEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId) => eventsApi.register(eventId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: eventKeys.all,
      });
    },
  });
}

export function useCancelEventRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId) => eventsApi.cancelRegistration(eventId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: eventKeys.all,
      });
    },
  });
}

export function useEventRegistrations(eventId, params, enabled) {
  return useQuery({
    queryKey: eventKeys.registrations(eventId, params),
    queryFn: () => eventsApi.listRegistrations(eventId, params),
    enabled: Boolean(eventId) && Boolean(enabled),
  });
}

export function useCheckInAttendee(eventId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId) =>
      eventsApi.checkIn(eventId, registrationId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...eventKeys.all, 'registrations', eventId],
      });
    },
  });
}