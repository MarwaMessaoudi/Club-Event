import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, total } = meta;

  const btn =
    'p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition';

  return (
    <div className="flex items-center justify-between border-t border-slate-800 pt-6">
      <p className="text-xs text-slate-400">
        Page {page} of {totalPages} · {total} result{total === 1 ? '' : 's'}
      </p>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}