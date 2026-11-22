import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import { useAuth } from '../../auth/context/AuthContext';
import {
  useCancelEventRegistration,
  useDeleteEvent,
  useEvents,
  useRegisterEvent,
} from '../hooks/useEvents';

import EventCard from '../components/EventCard';
import CreateEventModal from '../components/CreateEventModal';
import EditEventModal from '../components/EditEventModal';
import DigitalPassModal from '../components/DigitalPassModal';
import EventAttendeesModal from '../components/EventAttendesModal';

import Pagination from '../../../components/ui/Pagination';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const LIMIT = 9;

export default function EventsPage() {
  const { user } = useAuth();

  const canManageAll =
    user?.role === 'admin' ||
    user?.role === 'supervisor';
    const isAdmin = user?.role === 'admin';
    
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [passEvent, setPassEvent] = useState(null);
  const [attendeesEvent, setAttendeesEvent] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      status: 'approved',
      ...(search ? { search } : {}),
    }),
    [page, search],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEvents(params);

  const registerEvent = useRegisterEvent();
  const cancelRegistration = useCancelEventRegistration();
  const deleteEvent = useDeleteEvent();

  const events = data?.data ?? [];
  const meta = data?.meta;

  const setParams = (updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === '' ||
        value == null ||
        (key === 'page' && Number(value) <= 1)
      ) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== search) {
        setParams({
          search: searchInput.trim(),
          page: 1,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const apiError = (err) => {
    const message = err.response?.data?.message;

    return Array.isArray(message)
      ? message.join(', ')
      : message || 'Operation failed.';
  };

  const handleRsvp = (eventId) => {
    registerEvent.mutate(eventId, {
      onSuccess: () => {
        setFeedback({
          type: 'success',
          text: 'Registration confirmed. Your digital pass is ready.',
        });
      },
      onError: (err) => {
        setFeedback({
          type: 'error',
          text: apiError(err),
        });
      },
    });
  };

  const handleCancelRsvp = (eventId) => {
    cancelRegistration.mutate(eventId, {
      onSuccess: () => {
        setFeedback({
          type: 'success',
          text: 'Your event registration was cancelled.',
        });
      },
      onError: (err) => {
        setFeedback({
          type: 'error',
          text: apiError(err),
        });
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    deleteEvent.mutate(deleteTarget.id, {
      onSuccess: () => {
        setFeedback({
          type: 'success',
          text: `"${deleteTarget.title}" was deleted.`,
        });

        setDeleteTarget(null);
      },
      onError: (err) => {
        setFeedback({
          type: 'error',
          text: apiError(err),
        });

        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
            <Calendar className="w-4 h-4" />
            CAMPUS AGENDA
          </div>

          <h1 className="text-3xl font-bold text-white">
            Campus Events
          </h1>

          <p className="text-sm text-slate-400 mt-2">
            Browse events, reserve your seat, and manage attendance.
          </p>
        </div>

       {!isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            Propose Event
          </button>)}
      </div>

      {/* Feedback */}
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

      {/* Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />

          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search events by title, description or location..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Event grid */}
      {isLoading ? (
        <div className="py-24 text-center text-sm text-slate-400">
          Loading events...
        </div>
      ) : isError ? (
        <div className="py-20 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />

          <p className="text-sm text-rose-300">
            {error.response?.data?.message || 'Unable to load events.'}
          </p>

          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-200"
          >
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl py-20 text-center">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />

          <h3 className="text-lg font-semibold text-slate-200">
            No approved events found
          </h3>

          <p className="text-sm text-slate-500 mt-2">
{isAdmin ? 'Try another search.' : 'Propose an event or try another search.'}          </p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${
            isFetching ? 'opacity-60' : ''
          }`}
        >
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRsvp={handleRsvp}
              onCancelRsvp={handleCancelRsvp}
              onViewPass={setPassEvent}
              onViewAttendees={setAttendeesEvent}
              onEdit={setEditingEvent}
              onDelete={setDeleteTarget}
              canManage={canManageAll}
              loadingAction={
                registerEvent.isPending ||
                cancelRegistration.isPending
              }
            />
          ))}
        </div>
      )}

      <Pagination
        meta={meta}
        onPageChange={(newPage) =>
          setParams({ page: newPage })
        }
      />

      {/* Modals */}
      {!isAdmin && (
        <CreateEventModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setFeedback({
              type: 'success',
            text: 'Event submitted successfully.',
          });
        }}
      />)}

      <EditEventModal
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onUpdated={() => {
          setFeedback({
            type: 'success',
            text: 'Event updated successfully.',
          });
        }}
      />

      <DigitalPassModal
        event={passEvent}
        onClose={() => setPassEvent(null)}
      />

      <EventAttendeesModal
        event={attendeesEvent}
        onClose={() => setAttendeesEvent(null)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete event"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This also removes associated registrations.`
            : ''
        }
        confirmLabel="Delete Event"
        danger
        pending={deleteEvent.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}