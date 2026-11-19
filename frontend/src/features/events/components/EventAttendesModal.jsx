import { X, Check, Users } from 'lucide-react';

import {
  useCheckInAttendee,
  useEventRegistrations,
} from '../hooks/useEvents';

import { formatDateTime } from '../../../utils/dates';

export default function EventAttendeesModal({ event, onClose }) {
  const { data, isLoading, isError } = useEventRegistrations(
    event?.id,
    { page: 1, limit: 50 },
    Boolean(event),
  );

  const checkIn = useCheckInAttendee(event?.id);

  if (!event) return null;

  const registrations = data?.data ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {event.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Registered attendees and check-in.
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-xs text-slate-400">
            Loading registrations...
          </p>
        ) : isError ? (
          <p className="py-10 text-center text-xs text-rose-300">
            Unable to load registrations.
          </p>
        ) : registrations.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-500">
            No registrations yet.
          </p>
        ) : (
          <ul className="space-y-2 mt-4 max-h-80 overflow-y-auto pr-1">
            {registrations.map((registration) => (
              <li
                key={registration.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200">
                    {registration.user?.firstName}{' '}
                    {registration.user?.lastName}
                  </p>

                  <p className="text-[11px] text-slate-500 truncate">
                    {registration.user?.email}
                  </p>
                </div>

                {registration.checkedInAt ? (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                    Checked in
                  </span>
                ) : (
                  <button
                    onClick={() => checkIn.mutate(registration.id)}
                    disabled={checkIn.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Check In
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}