import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  postKeys,
} from '../hooks/usePosts';
import { useRealtimeEvent } from '../../realtime/useRealtimeEvent';
import { useAuth } from '../../auth/context/AuthContext';
import { formatDateTime } from '../../../utils/dates';

export default function CommentsSection({ postId, open }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useComments(
    postId,
    { page, limit: 10 },
    open,
  );

  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);

  // REAL-TIME LISTENER: Invalidate this post's comment list immediately
  useRealtimeEvent('post.comment.created', (eventData) => {
    if (eventData?.postId === postId) {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
    }
  });

  useRealtimeEvent('post.comment.deleted', (eventData) => {
    if (eventData?.postId === postId) {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
    }
  });

  if (!open) return null;

  const comments = data?.data ?? [];
  const meta = data?.meta;

  const submit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    createComment.mutate(content.trim(), {
      onSuccess: () => setContent(''),
    });
  };

  const canDelete = (comment) =>
    comment.author?.id === user?.id ||
    user?.role === 'admin' ||
    user?.role === 'supervisor';

  return (
    <div className="border-t border-slate-800 bg-slate-950/50 p-4 space-y-3">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        />

        <button
          disabled={createComment.isPending}
          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {isLoading ? (
        <p className="text-xs text-slate-500 text-center py-4">
          Loading comments...
        </p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">
          No comments yet.
        </p>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-200">
                    {comment.author?.firstName} {comment.author?.lastName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formatDateTime(comment.createdAt)}
                  </p>
                </div>

                {canDelete(comment) && (
                  <button
                    onClick={() => deleteComment.mutate(comment.id)}
                    disabled={deleteComment.isPending}
                    className="text-slate-500 hover:text-rose-400 transition"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="mt-2 text-slate-300 leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-between pt-2 text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-slate-400 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-slate-500">
            Page {meta.page} / {meta.totalPages}
          </span>

          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-slate-400 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}