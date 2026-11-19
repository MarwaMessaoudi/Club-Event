import { useState } from 'react';
import { X, XCircle } from 'lucide-react';

export default function RejectModal({ item, onConfirm, onClose, pending }) {
  const [reason, setReason] = useState('');
  if (!item) return null;

  const valid = reason.trim().length >= 5;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-rose-400">Reject {item.kind}</h3>
            <p className="text-xs text-slate-400 mt-1">
              <strong className="text-slate-200">{item.title}</strong> — the reason is stored
              and visible to reviewers.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <textarea
          rows={4}
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (min 5 chars) — e.g. duplicate of an existing club, venue already booked…"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-rose-500"
        />

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!valid || pending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-sm font-semibold"
          >
            <XCircle className="w-4 h-4" />
            {pending ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}