import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { postsApi } from '../api/posts.api';
import { uploadsApi } from '../../uploads/api/uploads.api';

export const postKeys = {
  all: ['posts'],
  lists: () => [...postKeys.all, 'list'],
  list: (params) => [...postKeys.lists(), params],
  commentsAll: () => [...postKeys.all, 'comments'],
  comments: (postId) => [...postKeys.commentsAll(), postId],
  commentsList: (postId, params) => [...postKeys.comments(postId), params],
};

export function usePosts(params) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => postsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ form, imageFile }) => {
      let image;
      if (imageFile) {
        const uploaded = await uploadsApi.upload(imageFile, 'posts');
        image = uploaded.url;
      }
      return postsApi.create({
        ...form,
        ...(image ? { image } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useReactToPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, type }) => postsApi.setReaction(postId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => postsApi.removeReaction(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useComments(postId, params, enabled) {
  return useQuery({
    queryKey: postKeys.commentsList(postId, params),
    queryFn: () => postsApi.comments(postId, params),
    enabled: Boolean(postId) && Boolean(enabled),
    placeholderData: keepPreviousData,
  });
}

export function useCreateComment(postId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content) => postsApi.createComment(postId, { content }),
    onSuccess: () => {
      // Invalidate both the comments list and the count on the post
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useDeleteComment(postId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId) => postsApi.deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useTrackPostView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => postsApi.view(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}