import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Newspaper,
  PlusCircle,
  Search,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { usePosts, postKeys } from '../hooks/usePosts';
import { useRealtimeEvent } from '../../realtime/useRealtimeEvent';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import Pagination from '../../../components/ui/Pagination';

export default function FeedPage() {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const search = searchParams.get('search') || '';

  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      status: 'approved',
      ...(search ? { search } : {}),
    }),
    [page, search],
  );

  const { data, isLoading } = usePosts(params);

  const posts = data?.data ?? [];
  const meta = data?.meta;

  // Realtime signals → invalidate REST queries.
   // Realtime signals → invalidate REST queries.
  const invalidateFeed = () => {
    queryClient.invalidateQueries({
      queryKey: postKeys.lists(),
    });
  };

  useRealtimeEvent('post.created', invalidateFeed);
  useRealtimeEvent('post.status.updated', invalidateFeed);
  useRealtimeEvent('post.reaction.updated', invalidateFeed);
  useRealtimeEvent('post.comment.created', (data) => {
    invalidateFeed();
    if (data?.postId) {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(data.postId) });
    }
  });
  useRealtimeEvent('post.comment.deleted', (data) => {
    invalidateFeed();
    if (data?.postId) {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(data.postId) });
    }
  });
  useRealtimeEvent('post.view.updated', invalidateFeed);
  

  useRealtimeEvent('post.created', invalidateFeed);
  useRealtimeEvent('post.status.updated', invalidateFeed);
  useRealtimeEvent('post.reaction.updated', invalidateFeed);
  useRealtimeEvent('post.comment.created', invalidateFeed);
  useRealtimeEvent('post.comment.deleted', invalidateFeed);
  useRealtimeEvent('post.view.updated', invalidateFeed);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
            <Newspaper className="w-4 h-4" />
            COMMUNITY UPDATES
          </div>
          <h1 className="text-2xl font-bold text-white">
            Campus Feed
          </h1>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Create Post
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl p-4 border text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}

            {feedback.text}
          </div>

          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSearchParams({
                page: 1,
                search: e.currentTarget.value.trim(),
              });
            }
          }}
          placeholder="Search posts..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl py-16 text-center">
          <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">
            No posts yet
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Be the first to share an update.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination
        meta={meta}
        onPageChange={(newPage) =>
          setSearchParams({
            page: newPage,
            ...(search ? { search } : {}),
          })
        }
      />

      <CreatePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(createdPost) => {
          const approved = createdPost?.status === 'approved';

          setFeedback({
            type: 'success',
            text: approved
              ? 'Post published successfully!'
              : 'Post submitted! It will appear on the feed once approved by a supervisor.',
          });
        }}
      />
    </div>
  );
}