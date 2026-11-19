import { useState } from 'react';
import { X, Upload, AlertCircle, CalendarPlus } from 'lucide-react';

import { useCreateEvent } from '../hooks/useEvents';
import { useClubs } from '../../clubs/hooks/useClubs';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  title: '',
  description: '',
  location: '',
  capacity: 50,
  startsAt: '',
  endsAt: '',
  clubId: '',
};

export default function CreateEventModal({ open, onClose, onCreated }) {
  const { user } = useAuth();

  const canCreateGlobal =
    user?.role === 'admin' || user?.role === 'supervisor';

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');

  const { data: clubsData } = useClubs({
    page: 1,
    limit: 50,
    status: 'approved',
  });

  const clubs = (clubsData?.data ?? []).filter(
    (club) =>
      canCreateGlobal ||
      club.myRole === 'manager',
  );

  const createEvent = useCreateEvent();

  if (!open) return null;

  const close = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setError('');
    onClose();
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');

    if (!canCreateGlobal && !form.clubId) {
      setError('Choose a club that you manage.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      capacity: Number(form.capacity),
      startsAt: new Date(form.startsAt).toISOString(),
      ...(form.endsAt
        ? { endsAt: new Date(form.endsAt).toISOString() }
        : {}),
      ...(form.clubId ? { clubId: form.clubId } : {}),
    };

    createEvent.mutate(
      { form: payload, imageFile },
      {
        onSuccess: () => {
          onCreated?.();
          close();
        },
        onError: (err) => {
          const msg = err.response?.data?.message;
          setError(
            Array.isArray(msg)
              ? msg.join(', ')
              : msg || 'Unable to create event.',
          );
        },
      },
    );
  };

  const input =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">
              Propose Event
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Club events are submitted for moderation. Supervisor/admin global events are approved directly.
            </p>
          </div>

          <button onClick={close} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          <input
            required
            maxLength={150}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Event title"
            className={input}
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              required={!canCreateGlobal}
              value={form.clubId}
              onChange={(e) =>
                setForm({ ...form, clubId: e.target.value })
              }
              className={input}
            >
              {canCreateGlobal && (
                <option value="">Global Campus Event</option>
              )}

              {!canCreateGlobal && (
                <option value="">Select managed club</option>
              )}

              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>

            <input
              required
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: e.target.value })
              }
              placeholder="Capacity"
              className={input}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) =>
                setForm({ ...form, startsAt: e.target.value })
              }
              className={input}
            />

            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) =>
                setForm({ ...form, endsAt: e.target.value })
              }
              className={input}
            />
          </div>

          <input
            required
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            placeholder="Location / venue"
            className={input}
          />

          <textarea
            required
            rows={4}
            maxLength={3000}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Describe the event..."
            className={`${input} resize-none`}
          />

          <label className="flex items-center gap-3 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 cursor-pointer transition">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-400">
              {imageFile
                ? imageFile.name
                : 'Optional event poster (PNG, JPG, WEBP)'}
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) =>
                setImageFile(e.target.files?.[0] || null)
              }
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createEvent.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
            >
              <CalendarPlus className="w-4 h-4" />
              {createEvent.isPending ? 'Submitting...' : 'Submit Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}