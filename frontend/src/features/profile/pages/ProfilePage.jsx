import { useEffect, useState } from 'react';
import { User, Mail, Shield, Calendar, Upload, Lock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useProfile';
import { uploadsApi } from '../../uploads/api/uploads.api';
import { getFileUrl } from '../../../utils/files';
import { formatDate } from '../../../utils/dates';

export default function ProfilePage() {
  const { setUser } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [form, setForm] = useState({ firstName:'', lastName:'', email:'' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [pwdForm, setPwdForm] = useState({ currentPassword:'', newPassword:'' });

  useEffect(()=>{ if(profile){ setForm({ firstName: profile.firstName||'', lastName: profile.lastName||'', email: profile.email||'' }); } },[profile]);

  if(isLoading) return <p className="text-sm text-slate-400">Loading profile...</p>;

  const avatarUrl = getFileUrl(profile?.avatar);
  const initials = `${profile?.firstName?.[0]||''}${profile?.lastName?.[0]||''}`.toUpperCase();

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      let avatar = profile?.avatar;
      if(avatarFile){ const up = await uploadsApi.upload(avatarFile, 'avatars'); avatar = up.url; }
      const updated = await updateProfile.mutateAsync({ ...form, avatar });
      setUser(updated); // update AuthContext immediately
      setAvatarFile(null);
      setFeedback({ type:'success', text:'Profile updated successfully!' });
    } catch(err){ const msg = err.response?.data?.message; setFeedback({ type:'error', text: Array.isArray(msg)?msg.join(', '):msg||'Update failed' }); }
  };

  const handlePwd = async (e) => {
    e.preventDefault();
    try { await changePassword.mutateAsync(pwdForm); setPwdForm({ currentPassword:'', newPassword:'' }); setFeedback({ type:'success', text:'Password changed successfully!' }); }
    catch(err){ const msg = err.response?.data?.message; setFeedback({ type:'error', text: Array.isArray(msg)?msg.join(', '):msg||'Password change failed' }); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-7">
      <h1 className="text-3xl font-bold text-white">My Profile</h1>

      {feedback && (
        <div className={`flex justify-between p-4 rounded-xl border text-sm ${feedback.type==='success'?'bg-emerald-500/10 border-emerald-500/30 text-emerald-300':'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          <div className="flex gap-2">{feedback.type==='success'?<CheckCircle2 className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>}{feedback.text}</div>
          <button onClick={()=>setFeedback(null)}><X className="w-4 h-4"/></button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover"/> : <span className="font-bold text-white">{initials}</span>}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{profile?.firstName} {profile?.lastName}</p>
            <p className="text-xs text-slate-400 flex gap-2 items-center"><Mail className="w-3.5 h-3.5"/>{profile?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{profile?.role}</span>
              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400">{formatDate(profile?.createdAt)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} placeholder="First name" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"/>
            <input value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} placeholder="Last name" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"/>
          </div>
          <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="Email" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"/>
          <label className="flex items-center gap-3 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 cursor-pointer text-xs text-slate-400">
            <Upload className="w-4 h-4 text-indigo-400"/>{avatarFile?avatarFile.name:'Change avatar (PNG/JPG/WEBP)'}
            <input type="file" accept="image/*" className="hidden" onChange={e=>setAvatarFile(e.target.files?.[0]||null)}/>
          </label>
          <button disabled={updateProfile.isPending} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">{updateProfile.isPending?'Saving...':'Save Changes'}</button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white flex gap-2 items-center"><Lock className="w-4 h-4 text-indigo-400"/>Change Password</h3>
        <form onSubmit={handlePwd} className="mt-4 space-y-3">
          <input type="password" required placeholder="Current password" value={pwdForm.currentPassword} onChange={e=>setPwdForm({...pwdForm, currentPassword:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"/>
          <input type="password" required placeholder="New password (Aa + digit, min 8)" value={pwdForm.newPassword} onChange={e=>setPwdForm({...pwdForm, newPassword:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"/>
          <button disabled={changePassword.isPending} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-sm font-semibold">{changePassword.isPending?'Changing...':'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}