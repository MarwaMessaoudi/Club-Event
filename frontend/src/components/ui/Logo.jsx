import { Sparkles } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
        UniVibe
      </span>
    </div>
  );
}