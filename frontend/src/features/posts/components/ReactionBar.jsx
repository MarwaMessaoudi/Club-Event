import { useEffect, useRef, useState } from 'react';
import { MessageCircle, ThumbsUp, Eye } from 'lucide-react';
import { useReactToPost, useRemoveReaction } from '../hooks/usePosts';

const REACTIONS = [
  { type: 'like', label: 'Like', emoji: '👍', color: 'text-sky-400' },
  { type: 'love', label: 'Love', emoji: '❤️', color: 'text-rose-500' },
  { type: 'laugh', label: 'Haha', emoji: '😆', color: 'text-amber-400' },
  { type: 'angry', label: 'Angry', emoji: '😡', color: 'text-orange-500' },
];

function getReactionConfig(type) {
  return REACTIONS.find((r) => r.type === type) || null;
}

export default function ReactionBar({ post, commentsOpen, onToggleComments }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const reactToPost = useReactToPost();
  const removeReaction = useRemoveReaction();

  const myReaction = getReactionConfig(post.myReaction);
  const total = post.reactionsTotal ?? 0;
  const busy = reactToPost.isPending || removeReaction.isPending;

  const openPicker = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setPickerOpen(true);
  };

  const closePickerSoon = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setPickerOpen(false);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMainReactionClick = () => {
    if (busy) return;
    if (post.myReaction) {
      removeReaction.mutate(post.id);
    } else {
      reactToPost.mutate({ postId: post.id, type: 'like' });
    }
  };

  const handleChooseReaction = (type) => {
    if (busy) return;
    reactToPost.mutate({ postId: post.id, type });
    setPickerOpen(false);
  };

  // Unique list of emojis that have at least 1 reaction
  const activeEmojis = REACTIONS.filter(
    (r) => (post.reactions?.[r.type] ?? 0) > 0,
  ).slice(0, 3);

  return (
    <div className="pt-2">
      {/* 1. Summary row (Pure Facebook style: clean emojis, NO background circles, NO borders) */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-1.5">
          {total > 0 ? (
            <>
              {/* Overlapping clean emojis without any background circles or borders */}
              <div className="flex -space-x-1 text-base leading-none">
                {activeEmojis.map((r) => (
                  <span key={r.type} className="drop-shadow-sm">
                    {r.emoji}
                  </span>
                ))}
              </div>
              <span className="ml-1 text-slate-300 font-medium">
                {total}
              </span>
            </>
          ) : (
            <span className="text-slate-500">Be the first to react</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <button
            type="button"
            onClick={onToggleComments}
            className="hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs text-slate-400"
          >
            {post.commentsCount ?? 0} comments
          </button>
          <span>·</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Eye className="w-3.5 h-3.5" />
            {post.viewsCount ?? 0}
          </span>
        </div>
      </div>

      {/* Subtle divider line between summary and action buttons */}
      <div className="mx-4 border-t border-slate-800/80" />

      {/* 2. Action row (Like + Comment) */}
      <div className="px-2 py-1 flex items-center gap-1 select-none">
        {/* Like Button with Hover Reaction Picker */}
        <div
          className="relative flex-1"
          onMouseEnter={openPicker}
          onMouseLeave={closePickerSoon}
        >
          {/* Floating White Pill Picker (Zero border, pure shadow like Facebook) */}
          {pickerOpen && (
            <div
              onMouseEnter={openPicker}
              onMouseLeave={closePickerSoon}
              className="
                absolute left-2 bottom-full mb-2 z-50
                flex items-center gap-1.5
                px-3 py-1.5
                rounded-full
                bg-white
                shadow-[0_8px_30px_rgb(0,0,0,0.35)]
                border-0
                outline-none
              "
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  type="button"
                  title={r.label}
                  disabled={busy}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleChooseReaction(r.type);
                  }}
                  className="
                    w-9 h-9
                    flex items-center justify-center
                    text-2xl
                    hover:scale-130
                    active:scale-95
                    transition-transform
                    duration-150
                    bg-transparent
                    border-0
                    outline-none
                    p-0
                    cursor-pointer
                  "
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={handleMainReactionClick}
            className={`
              w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold
              transition hover:bg-slate-800/80 bg-transparent border-0 outline-none cursor-pointer
              ${myReaction ? myReaction.color : 'text-slate-400 hover:text-slate-200'}
            `}
          >
            {myReaction ? (
              <span className="text-base leading-none">{myReaction.emoji}</span>
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
            <span>{myReaction ? myReaction.label : 'Like'}</span>
          </button>
        </div>

        {/* Comment Button */}
        <button
          type="button"
          onClick={onToggleComments}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold
            transition hover:bg-slate-800/80 bg-transparent border-0 outline-none cursor-pointer
            ${commentsOpen ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}
          `}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>
    </div>
  );
}