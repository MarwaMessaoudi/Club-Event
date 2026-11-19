import { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ open, onClose, mode, setMode }) {
  const { login, register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;
  const isLogin = mode === 'login';

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const getErrorMsg = (e) => {
    const msg = e.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || 'Something went wrong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      onClose();
    } catch (err) {
      // 409 Email already in use, 401 Invalid credentials, 400 validation
      setError(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-200 pl-10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{isLogin ? 'Welcome back' : 'Join UniVibe'}</h3>
            <p className="text-xs text-slate-400">{isLogin ? 'Login to your campus account' : 'Create student account'}</p>
          </div>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl mb-4">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              {m}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 mb-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input required placeholder="First name" value={form.firstName} onChange={set('firstName')} className={inputCls} />
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input required placeholder="Last name" value={form.lastName} onChange={set('lastName')} className={inputCls} />
              </div>
            </div>
          )}

          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input required type="email" placeholder="you@campus.edu" value={form.email} onChange={set('email')} className={inputCls} />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              required
              type={showPwd ? 'text' : 'password'}
              placeholder={isLogin ? 'Password' : 'Min 8 chars, Aa + 0-9'}
              value={form.password}
              onChange={set('password')}
              minLength={8}
              className={`${inputCls} pr-10`}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button disabled={loading} type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition">
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create account'}
          </button>

          {!isLogin && (
            <p className="text-[11px] text-slate-500 text-center">
              You register as <span className="text-indigo-300 font-semibold">Student</span>. Supervisor/Admin promotion is done by an admin.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}