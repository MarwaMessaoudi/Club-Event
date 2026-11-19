import { useEffect, useRef, useState } from 'react';
import { Globe, Users } from 'lucide-react';
import { getFileUrl } from '../../../utils/files';
import { formatDateTime } from '../../../utils/dates';
import ReactionBar from './ReactionBar';
import CommentsSection from './CommentsSection';
import { useTrackPostView } from '../hooks/usePosts';

export default function PostCard({ post }) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  const imageUrl = getFileUrl(post.image);
  const authorAvatarUrl = getFileUrl(post.author?.avatar);

  const cardRef = useRef(null);
  const viewedRef = useRef(false);
  const trackView = useTrackPostView();

  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`
    : 'Campus Member';

  const authorInitials = post.author
    ? `${post.author.firstName?.[0] || ''}${post.author.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  useEffect(() => {
    if (!cardRef.current || viewedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          viewedRef.current = true;
          trackView.mutate(post.id);
          observer.disconnect();
        }
      },
      { threshold: [0.5] },
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [post.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <article
      ref={cardRef}
      className="
        bg-slate-900/90
        border border-slate-800
        rounded-2xl
        overflow-hidden
        shadow-xl
        hover:border-slate-700/80
        transition
      "
    >
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div
            className="
              w-10 h-10 rounded-xl
              bg-gradient-to-tr from-indigo-600 to-violet-600
              flex items-center justify-center
              font-bold text-xs text-white shrink-0
              overflow-hidden
              border border-slate-700/60
            "
          >
            {authorAvatarUrl ? (
              <img
                src={authorAvatarUrl}
                alt={authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              authorInitials
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-white">
              {authorName}
            </h4>

            <span className="text-[11px] text-slate-400">
              {formatDateTime(post.createdAt)}
            </span>
          </div>
        </div>

        {post.club ? (
          <span
            className="
              inline-flex items-center gap-1.5
              px-3 py-1
              rounded-full
              text-xs font-semibold
              bg-indigo-500/10
              border border-indigo-500/30
              text-indigo-300
            "
          >
            <Users className="w-3.5 h-3.5" />
            {post.club.name}
          </span>
        ) : (
          <span
            className="
              inline-flex items-center gap-1.5
              px-3 py-1
              rounded-full
              text-xs font-semibold
              bg-slate-800
              border border-slate-700
              text-slate-300
            "
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Global
          </span>
        )}
      </div>

      {/* Text content */}
      <div className="p-5 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
        {post.content}
      </div>

      {/* Optional image */}
      {imageUrl && (
        <div className="max-h-96 overflow-hidden bg-slate-950 border-t border-slate-800/80 flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Post attachment"
            className="w-full h-full object-cover max-h-96"
          />
        </div>
      )}

      {/* Facebook-like reaction and comment bar */}
      <ReactionBar
        post={post}
        commentsOpen={commentsOpen}
        onToggleComments={() => setCommentsOpen((value) => !value)}
      />

      {/* Comments */}
      <CommentsSection postId={post.id} open={commentsOpen} />
    </article>
  );
}