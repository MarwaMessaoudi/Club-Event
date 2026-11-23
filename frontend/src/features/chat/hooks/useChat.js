import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { chatApi } from '../api/chat.api';

export const chatKeys = {
  all: ['chat'],
  conversations: () => [...chatKeys.all, 'conversations'],
  messages: (convId) => [...chatKeys.all, 'messages', convId],
  contacts: (q) => [...chatKeys.all, 'contacts', q],
};

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: chatApi.getConversations,
  });
}

export function useMessages(conversationId) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => chatApi.getMessages(conversationId, { page: 1, limit: 50 }),
    enabled: Boolean(conversationId),
    placeholderData: keepPreviousData,
  });
}

export function useContacts(search) {
  return useQuery({
    queryKey: chatKeys.contacts(search),
    queryFn: () => chatApi.searchContacts(search),
  });
}

export function useSendMessage(conversationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content) => chatApi.sendMessage(conversationId, content),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(chatKeys.messages(conversationId), (old) => {
        if (!old?.data) return old;
        // the realtime event may already have added this message
        if (old.data.some((m) => m.id === newMessage.id)) return old;
        return {
          ...old,
          data: [...old.data, newMessage],
        };
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useStartDirectChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId) => chatApi.getOrCreateDirect(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}