import {
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  Newspaper,
} from 'lucide-react';

import { getFileUrl } from '../../../utils/files';

const TYPE_ICONS = {
  clubs: Users,
  events: Calendar,
  posts: Newspaper,
};

export default function ModerationCard({
  type,
  badge,
  title,
  subtitle,
  description,
  image,
  onApprove,
  onReject,
  approving = false,
}) {
  const imageUrl = getFileUrl(image);
  const Icon = TYPE_ICONS[type] || Newspaper;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 sm:flex-row">
      {/* Real uploaded image, or a neutral icon when there is none */}
      <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800 sm:w-28">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="h-7 w-7 text-indigo-400" />
        )}
      </div>

      {/* Information provided by the backend */}
      <div className="min-w-0 flex-1">
        <span className="mb-2 inline-block rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
          {badge}
        </span>

        <h3 className="break-words text-sm font-bold text-white">
          {title}
        </h3>

        <p className="mt-1 text-xs text-indigo-300">
          {subtitle}
        </p>

        <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-400">
          {description}
        </p>
      </div>

      {/* Actions call the mutations supplied by ModerationPage */}
      <div className="flex shrink-0 justify-end gap-2 sm:flex-col">
        <button
          type="button"
          onClick={onApprove}
          disabled={approving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          {approving ? 'Working…' : 'Approve'}
        </button>

        <button
          type="button"
          onClick={onReject}
          disabled={approving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>
      </div>
    </article>
  );
}