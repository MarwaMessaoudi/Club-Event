import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import ClubCard from '../components/ClubCard';
import CreateClubModal from '../components/CreateClubModal';
import ClubDetailsModal from '../components/ClubDetailsModal';
import Pagination from '../../../components/ui/Pagination';
import {
  useClubs,
  useRequestToJoinClub,
} from '../hooks/useClubs';


import { useAuth } from '../../auth/context/AuthContext';

const LIMIT = 9;
const CATEGORIES = ['Tech', 'Arts', 'Sports', 'Academic', 'Culture'];

export default function ClubsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // URL is the source of truth for list state → survives F5 and Back button
  const setParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      const empty = value === '' || value == null || (key === 'page' && Number(value) <= 1);
      if (empty) next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, { replace: true });
  };

  // Debounce search input → URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== search) {
        setParams({ search: searchInput.trim(), page: 1 });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss feedback
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      status: 'approved', // Explore shows approved only, even for supervisors
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
    }),
    [page, search, category],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useClubs(params);
const requestToJoin = useRequestToJoinClub();

  const clubs = data?.data ?? [];
  const meta = data?.meta;

 const handleRequestToJoin = (club) => {
  requestToJoin.mutate(club.id, {
    onSuccess: () => {
      setFeedback({
        type: 'success',
        text: `Your request to join ${club.name} was sent to the club manager.`,
      });
    },

    onError: (error) => {
      const message = error.response?.data?.message;

      setFeedback({
        type: 'error',
        text: Array.isArray(message)
          ? message.join(', ')
          : message || 'Unable to send join request.',
      });
    },
  });
};

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
            <Users className="w-4 h-4" />
            CAMPUS COMMUNITY
          </div>
          <h1 className="text-3xl font-bold text-white">Explore Clubs</h1>
          <p className="text-sm text-slate-400 mt-2">
            Real clubs from the campus database. Join one, or propose your own.
          </p>
        </div>

        {!isAdmin && (
  <button
    onClick={() => setShowCreate(true)}
    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
  >
    <PlusCircle className="w-4 h-4" />
    Propose Club
  </button>
)}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl p-4 border text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {feedback.text}
          </div>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search clubs by name or description…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setParams({ category: e.target.value, page: 1 })}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading clubs…</div>
      ) : isError ? (
        <div className="flex items-center justify-between gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-rose-300">
            <AlertCircle className="w-4 h-4" />
            {error.response?.data?.message || 'Unable to load clubs.'}
          </div>
          <button onClick={() => refetch()} className="text-rose-300 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      ) : clubs.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl py-20 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-200">No clubs found</h3>
          <p className="text-sm text-slate-500 mt-2">
            {search || category
              ? 'Try a different search or category.'
              : isAdmin
                ? 'No approved clubs yet.'
                : 'No approved clubs yet — propose the first one!'}
          </p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity ${
            isFetching ? 'opacity-60' : ''
          }`}
        >
          {clubs.map((club) => (
          <ClubCard
  key={club.id}
  club={club}
  onView={setSelected}
  onRequestJoin={handleRequestToJoin}
  canRequestJoin={!isAdmin}
  requesting={requestToJoin.isPending && requestToJoin.variables === club.id}
/>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={(p) => setParams({ page: p })} />

      {/* Modals */}
      <CreateClubModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() =>
          setFeedback({
            type: 'success',
            text: 'Club proposal submitted — pending supervisor approval.',
          })
        }
      />

      {selected && (
        <ClubDetailsModal
          club={selected}
          onClose={() => setSelected(null)}
          onFeedback={(type, text) => setFeedback({ type, text })}
        />
      )}
    </div>
  );
}