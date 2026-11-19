import { useState } from 'react';
import { X, Upload, AlertCircle, PlusCircle } from 'lucide-react';
import { useCreateClub } from '../hooks/useClubs';

const CATEGORIES = ['Tech', 'Arts', 'Sports', 'Academic', 'Culture'];

export default function CreateClubModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'Tech' });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const createClub = useCreateClub();

  if (!open) return null;

  const close = () => {
    setForm({ name: '', description: '', category: 'Tech' });
    setImageFile(null);
    setError('');
    onClose();
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    createClub.mutate(
      {
        form: {
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
        },
        imageFile,
      },
      {
        onSuccess: () => {
          onCreated?.();
          close();
        },
        onError: (err) => {
          const msg = err.response?.data?.message;
          setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Unable to create club.');
        },
      },
    );
  };

  const inputCls =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-7 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Propose a Club</h2>
            <p className="text-xs text-slate-400 mt-1">
              Reviewed by a supervisor before going public. You become the manager.
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

        <form onSubmit={submit} className="space-y-5">
          <input
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Club name (e.g. DevX Coding Club)"
            className={inputCls}
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <textarea
            required
            rows={4}
            maxLength={2000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mission, activities, who should join…"
            className={`${inputCls} resize-none`}
          />

          <label className="flex items-center gap-3 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 cursor-pointer transition">
            <Upload className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-slate-400">
              {imageFile ? imageFile.name : 'Club logo — PNG, JPG or WEBP (max 5 MB)'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClub.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              {createClub.isPending ? 'Submitting…' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}