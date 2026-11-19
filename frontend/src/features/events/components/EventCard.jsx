import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  QrCode,
  Pencil,
  Trash2,
} from 'lucide-react';

import { getFileUrl } from '../../../utils/files';
import { formatDateTime } from '../../../utils/dates';

export default function EventCard({
  event,
  onRsvp,
  onCancelRsvp,
  onViewPass,
  onViewAttendees,
  onEdit,
  onDelete,
  loadingAction,
  canManage,
}) {
  const imageUrl = getFileUrl(event.image);

  const isFull =
    event.capacity > 0 &&
    event.registeredCount >= event.capacity;

  return (
    <article className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-indigo-500/40 transition group">
      <div className="relative h-44 bg-gradient-to-br from-indigo-950 to-slate-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-indigo-400/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />

        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-950/80 text-indigo-300 border border-slate-700">
          {event.club?.name || 'Campus Wide'}
        </span>
      </div>

      <div className="p-5 flex-1">
        <h3 className="text-base font-bold text-white">
          {event.title}
        </h3>

        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        <div className="space-y-2 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {formatDateTime(event.startsAt)}
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              {event.registeredCount} / {event.capacity} seats
            </span>

            {isFull && !event.amIRegistered && (
              <span className="text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                Full
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 pt-0 space-y-2">
        {event.amIRegistered && (
          <button
            onClick={() => onViewPass(event)}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            View Digital Pass
          </button>
        )}

        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(event)}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>

            <button
              onClick={() => onViewAttendees(event)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300"
              title="View attendees"
            >
              <Users className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onDelete(event)}
              className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300"
              title="Delete event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {event.amIRegistered ? (
          <button
            onClick={() => onCancelRsvp(event.id)}
            disabled={loadingAction}
            className="w-full py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold disabled:opacity-50"
          >
            {loadingAction ? 'Cancelling...' : 'Cancel RSVP'}
          </button>
        ) : (
          <button
            onClick={() => onRsvp(event.id)}
            disabled={loadingAction || isFull}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {loadingAction
              ? 'Reserving...'
              : isFull
                ? 'Event Full'
                : 'Apply Now'}
          </button>
        )}
      </div>
    </article>
  );
}