import { useEffect, useState } from 'react';
import { Shield, AlertCircle, CheckCircle2, X, Inbox } from 'lucide-react';
import {
  usePendingClubs,
  usePendingEvents,
  usePendingPosts,
  useUpdateStatus,
} from '../hooks/useModeration';

import { useAuth } from '../../auth/context/AuthContext';

import ConfirmModal from '../../../components/ui/ConfirmModal';
import Pagination from '../../../components/ui/Pagination';
import { formatDate, formatDateTime } from '../../../utils/dates';
import ModerationCard from '../components/ModerationCard';
export default function ModerationPage() {
  const [clubsPage, setClubsPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);

  const clubs = usePendingClubs(clubsPage);
  const events = usePendingEvents(eventsPage);
  const posts = usePendingPosts(postsPage);

  const updateClubStatus = useUpdateStatus('clubs');
  const updateEventStatus = useUpdateStatus('events');
  const updatePostStatus = useUpdateStatus('posts');
  const [rejectTarget, setRejectTarget] = useState(null); // { type, kind, id, title }
  const [feedback, setFeedback] = useState(null);
const { user } = useAuth();
const isSupervisor = user?.role === 'supervisor';
const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  const mutationFor = (type) =>
    type === 'clubs' ? updateClubStatus : type === 'events' ? updateEventStatus : updatePostStatus;

  const apiError = (err) => {
    const msg = err.response?.data?.message;
    return Array.isArray(msg) ? msg.join(', ') : msg || 'Action failed.';
  };

  const decide = (type, id, status, title) => {
    mutationFor(type).mutate(
      { id, status },
      {
        onSuccess: () => {
          setFeedback({
            type: 'success',
            text: `"${title}" ${status === 'approved' ? 'approved' : 'rejected'}.`,
          });
          setRejectTarget(null);
        },
        onError: (err) => {
          setFeedback({ type: 'error', text: apiError(err) });
          setRejectTarget(null);
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
          <Shield className="w-4 h-4" />
          MODERATION
        </div>
        <h1 className="text-3xl font-bold text-white">Approval Queue</h1>
        <p className="text-sm text-slate-400 mt-2">
          Review pending club, event and post proposals.
        </p>
      </div>

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

      <Section
        title="Pending Clubs"
        query={clubs}
        page={clubsPage}
        onPageChange={setClubsPage}
        items={(clubs.data?.data ?? []).map((c) => ({
          id: c.id,
          card: {
            type: 'clubs',
            badge: 'Club Proposal',
            title: c.name,
            subtitle: `by ${c.createdBy?.firstName ?? ''} ${c.createdBy?.lastName ?? ''} · ${c.category} · ${formatDate(c.createdAt)}`,
            description: c.description,
            image: c.image,
          },
        }))}
        onApprove={(id, title) => decide('clubs', id, 'approved', title)}
        onReject={(item) => setRejectTarget({ type: 'clubs', kind: 'club', ...item })}
        approving={updateClubStatus.isPending}
      />

      <Section
        title="Pending Events"
        query={events}
        page={eventsPage}
        onPageChange={setEventsPage}
        items={(events.data?.data ?? []).map((e) => ({
          id: e.id,
          card: {
            type: 'events',
            badge: 'Event Request',
            title: e.title,
            subtitle: `${e.club?.name ?? 'Global event'} · ${e.location} · ${formatDateTime(e.startsAt)}`,
            description: e.description,
            image: e.image,
          },
        }))}
        onApprove={(id, title) => decide('events', id, 'approved', title)}
        onReject={(item) => setRejectTarget({ type: 'events', kind: 'event', ...item })}
        approving={updateEventStatus.isPending}
      />

   {isSupervisor && (

    <Section
        title="Pending Posts"
        query={posts}
        page={postsPage}
        onPageChange={setPostsPage}
        items={(posts.data?.data ?? []).map((p) => ({
          id: p.id,
          card: {
            type: 'posts',
            badge: 'Post Submission',
            title: `${p.author?.firstName ?? ''} ${p.author?.lastName ?? ''}`,
            subtitle: `${p.club?.name ?? 'Global post'} · ${formatDate(p.createdAt)}`,
            description: p.content,
            image: p.image,
          },
        }))}
        onApprove={(id, title) => decide('posts', id, 'approved', title)}
        onReject={(item) => setRejectTarget({ type: 'posts', kind: 'post', ...item })}
        approving={updatePostStatus.isPending}
      />
      )}

      <ConfirmModal
        open={Boolean(rejectTarget)}
        title={`Reject ${rejectTarget?.kind ?? ''}`}
        message={
          rejectTarget
            ? `Reject "${rejectTarget.title}"? It will no longer appear in the queue.`
            : ''
        }
        confirmLabel="Reject"
        danger
        pending={rejectTarget ? mutationFor(rejectTarget.type).isPending : false}
        onConfirm={() =>
          rejectTarget &&
          decide(rejectTarget.type, rejectTarget.id, 'rejected', rejectTarget.title)
        }
        onClose={() => setRejectTarget(null)}
      />
    </div>
  );
}

function Section({ title, query, items, page, onPageChange, onApprove, onReject, approving }) {
  const total = query.data?.meta?.total ?? 0;

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
        {title}
        {total > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
            {total}
          </span>
        )}
      </h2>

      {query.isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500 text-xs">
          <Inbox className="w-4 h-4" />
          Nothing pending here. Queue is clean.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ id, card }) => (
            <ModerationCard
              key={id}
              {...card}
              approving={approving}
              onApprove={() => onApprove(id, card.title)}
              onReject={() => onReject({ id, title: card.title })}
            />
          ))}
        </div>
      )}

      <Pagination meta={query.data?.meta} onPageChange={onPageChange} />
    </section>
  );
}