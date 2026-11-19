import { X, CheckCircle2, QrCode } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { formatDateTime } from '../../../utils/dates';

export default function DigitalPassModal({ event, onClose }) {
  const { user } = useAuth();

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-indigo-950 border border-indigo-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Registered
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">{event.title}</h3>
          <p className="text-xs text-indigo-300 mt-1">
            {event.club?.name || 'Campus Wide Event'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl inline-block">
          <div className="w-40 h-40 bg-slate-950 rounded-xl flex flex-col items-center justify-center">
            <QrCode className="w-28 h-28 text-indigo-400" />
            <span className="text-[9px] font-mono text-slate-400">
              {event.id.slice(0, 16)}
            </span>
          </div>
        </div>

        <div className="text-left bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Attendee:</span>
            <strong className="text-slate-200">
              {user?.firstName} {user?.lastName}
            </strong>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Date:</span>
            <strong className="text-slate-200">
              {formatDateTime(event.startsAt)}
            </strong>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Venue:</span>
            <strong className="text-slate-200">{event.location}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}