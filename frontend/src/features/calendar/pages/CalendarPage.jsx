import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  X,
} from 'lucide-react';

import { useEvents } from '../../events/hooks/useEvents';

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isSameDay(first, second) {
  return getDateKey(first) === getDateKey(second);
}

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);

  // JavaScript: Sunday = 0.
  // Our calendar starts Monday, so Monday = 0.
  const mondayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  const firstCalendarDay = new Date(
    year,
    month,
    1 - mondayIndex,
  );

  // 6 weeks × 7 days = 42 calendar cells.
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstCalendarDay);
    day.setDate(firstCalendarDay.getDate() + index);

    return day;
  });
}

function formatTime(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatFullDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function CalendarPage() {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [selectedEvent, setSelectedEvent] = useState(null);

  /*
    Real API data only.

    Current backend pagination maximum is likely 50.
    For Phase 1 this is enough. Later, a date-range API filter can be added:
    GET /events?from=...&to=...
  */
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useEvents({
    page: 1,
    limit: 50,
    status: 'approved',
  });

  const events = data?.data ?? [];

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  /*
    Map events by their local start date.

    Example:
    {
      "2026-10-24": [eventA, eventB],
      "2026-10-25": [eventC]
    }
  */
  const eventsByDate = useMemo(() => {
    const map = new Map();

    events.forEach((event) => {
      if (!event.startsAt) return;

      const eventDate = new Date(event.startsAt);

      if (Number.isNaN(eventDate.getTime())) return;

      const key = getDateKey(eventDate);

      const existingEvents = map.get(key) ?? [];
      existingEvents.push(event);

      map.set(key, existingEvents);
    });

    // Sort same-day events by start time.
    map.forEach((dayEvents) => {
      dayEvents.sort(
        (first, second) =>
          new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime(),
      );
    });

    return map;
  }, [events]);

  const eventsThisMonth = useMemo(() => {
    return events.filter((event) => {
      const date = new Date(event.startsAt);

      return (
        date.getFullYear() === currentMonth.getFullYear() &&
        date.getMonth() === currentMonth.getMonth()
      );
    });
  }, [events, currentMonth]);

  const monthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(currentMonth);

  const goToPreviousMonth = () => {
    setCurrentMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() - 1,
          1,
        ),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + 1,
          1,
        ),
    );
  };

  const goToToday = () => {
    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1),
    );
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-sm text-slate-400">
        Loading campus calendar...
      </div>
    );
  }

  if (isError) {
    const message = error?.response?.data?.message;

    return (
      <div className="py-24 text-center">
        <CalendarDays className="w-10 h-10 text-rose-400 mx-auto mb-4" />

        <h1 className="text-xl font-bold text-white">
          Unable to load calendar
        </h1>

        <p className="text-sm text-rose-300 mt-2">
          {Array.isArray(message)
            ? message.join(', ')
            : message || 'The event list could not be loaded.'}
        </p>

        <button
          onClick={() => refetch()}
          className="mt-5 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
              <CalendarDays className="w-4 h-4" />
              CAMPUS SCHEDULE
            </div>

            <h1 className="text-3xl font-bold text-white">
               Calendar
            </h1>

            <p className="text-sm text-slate-400 mt-2">
              Approved campus and club events from PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              Today
            </button>

            <button
              onClick={goToPreviousMonth}
              title="Previous month"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={goToNextMonth}
              title="Next month"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Month title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {monthLabel}
        </h2>

        <span className="text-xs text-slate-500">
          {eventsThisMonth.length} event
          {eventsThisMonth.length === 1 ? '' : 's'} this month
        </span>
      </div>

      {/* Scroll wrapper preserves 7-column readability on mobile */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          {/* Week day names */}
          <div className="grid grid-cols-7 gap-px bg-slate-800 border border-slate-800 rounded-t-2xl overflow-hidden">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="bg-slate-950 px-3 py-3 text-center text-[11px] font-bold tracking-wider text-slate-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Actual calendar cells */}
          <div className="grid grid-cols-7 gap-px bg-slate-800 border-x border-b border-slate-800 rounded-b-2xl overflow-hidden">
            {calendarDays.map((day) => {
              const key = getDateKey(day);

              const isCurrentMonth =
                day.getMonth() === currentMonth.getMonth();

              const isToday = isSameDay(day, today);

              const dayEvents = eventsByDate.get(key) ?? [];

              return (
                <div
                  key={key}
                  className={`
                    min-h-[130px]
                    bg-slate-900
                    p-2.5
                    transition
                    ${
                      isCurrentMonth
                        ? 'bg-slate-900'
                        : 'bg-slate-950/70'
                    }
                  `}
                >
                  {/* Day number */}
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`
                        w-7 h-7
                        rounded-full
                        flex items-center justify-center
                        text-xs font-semibold
                        ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                            : isCurrentMonth
                              ? 'text-slate-300'
                              : 'text-slate-600'
                        }
                      `}
                    >
                      {day.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-indigo-400 font-semibold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Events inside this date CELL */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        title={`${event.title} — ${formatTime(event.startsAt)}`}
                        className="
                          w-full
                          text-left
                          rounded-md
                          px-1.5 py-1
                          bg-indigo-500/15
                          hover:bg-indigo-500/25
                          border border-indigo-500/20
                          text-indigo-200
                          text-[10px]
                          transition
                          truncate
                        "
                      >
                        <span className="text-indigo-400 font-bold mr-1">
                          {formatTime(event.startsAt)}
                        </span>

                        {event.title}
                      </button>
                    ))}

                    {dayEvents.length > 3 && (
                      <button
                        onClick={() => setSelectedEvent(dayEvents[3])}
                        className="w-full text-left px-1.5 py-1 text-[10px] text-slate-400 hover:text-indigo-300 transition"
                      >
                        + {dayEvents.length - 3} more event
                        {dayEvents.length - 3 > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty month state */}
      {eventsThisMonth.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl py-8 text-center">
          <CalendarDays className="w-8 h-8 text-slate-600 mx-auto mb-3" />

          <p className="text-sm text-slate-400">
            No approved events are scheduled for {monthLabel}.
          </p>
        </div>
      )}

      {/* Real event details modal */}
      {selectedEvent && (
        <EventCalendarModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

function EventCalendarModal({ event, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
              {event.club?.name || 'Campus-wide Event'}
            </span>

            <h2 className="text-xl font-bold text-white mt-1">
              {event.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed mt-4">
          {event.description}
        </p>

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-3 text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{formatFullDate(event.startsAt)}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between bg-slate-800/70 border border-slate-700 rounded-xl p-3">
          <span className="text-xs text-slate-400">
            Registered attendees
          </span>

          <strong className="text-sm text-indigo-300">
            {event.registeredCount ?? 0} / {event.capacity}
          </strong>
        </div>
      </div>
    </div>
  );
}