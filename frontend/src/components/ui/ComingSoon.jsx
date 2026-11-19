import { Sparkles } from 'lucide-react';

export default function ComingSoon({ icon, title, description }) {
  return (
    <div className="min-h-[65vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm text-slate-400 mt-3">{description}</p>
        <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Next in Pipeline
        </div>
      </div>
    </div>
  );
}