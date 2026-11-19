import { useState } from 'react';
import { X, Upload, Send, AlertCircle } from 'lucide-react';
import { useCreatePost } from '../hooks/usePosts';
import { useClubs } from '../../clubs/hooks/useClubs';

export default function CreatePostModal({ open, onClose, onCreated }) {
  const [content, setContent] = useState('');
  const [clubId, setClubId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');

  const { data: clubsData } = useClubs({ page: 1, limit: 50, status: 'approved' });
  const myClubs = (clubsData?.data ?? []).filter(c => c.isMember);

  const createPost = useCreatePost();
  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    createPost.mutate(
      {
        form: { content: content.trim(), ...(clubId ? { clubId } : {}) },
        imageFile,
      },
      {
        onSuccess: (createdPost) => {
          setContent('');
          setClubId('');
          setImageFile(null);
          onCreated?.(createdPost); // <-- pass real post with status
          onClose();
        },
        onError: (err) => {
          const msg = err.response?.data?.message;
          setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to submit post.');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Create Campus Post</h2>
            <p className="text-xs text-slate-400 mt-1">Club posts are published instantly. Global posts need supervisor approval.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        {error && (
          <div className="mb-4 flex gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0"/>{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <select value={clubId} onChange={e=>setClubId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white">
            <option value="">🌐 Global Campus Feed</option>
            {myClubs.map(c=><option key={c.id} value={c.id}>👥 {c.name}</option>)}
          </select>

          <textarea required rows={4} maxLength={2000} value={content} onChange={e=>setContent(e.target.value)} placeholder="What's happening on campus?" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white resize-none"/>

          <label className="flex items-center gap-3 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-400"/>
            <span className="text-slate-400">{imageFile ? imageFile.name : 'Attach image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={e=>setImageFile(e.target.files?.[0]||null)}/>
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
            <button disabled={createPost.isPending} className="flex gap-1.5 items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50">
              <Send className="w-3.5 h-3.5"/>{createPost.isPending?'Publishing...':'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}