import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Newspaper,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Users,
  UserRoundCheck,
} from 'lucide-react';

import { useAuth } from '../../auth/context/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatDateTime } from '../../../utils/dates';
import DashboardInsights from '../components/DashboardInsights';
export default function PlatformDashboardPage() {
  const { user } = useAuth();

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="py-24 text-center text-sm text-slate-400">
        Loading platform statistics...
      </div>
    );
  }

  if (isError) {
    const message = error?.response?.data?.message;

    return (
      <div className="py-24 text-center">
        <AlertCircle className="w-9 h-9 text-rose-400 mx-auto mb-4" />

        <h1 className="text-xl font-bold text-white">
          Unable to load dashboard
        </h1>

        <p className="text-sm text-rose-300 mt-2">
          {Array.isArray(message)
            ? message.join(', ')
            : message || 'Dashboard statistics request failed.'}
        </p>

        <button
          onClick={() => refetch()}
          className="mt-5 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const role = user?.role || 'supervisor';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" />
            PLATFORM OVERVIEW
          </div>

          <h1 className="text-3xl font-bold text-white">
            UniVibe Dashboard
          </h1>

          <p className="text-sm text-slate-400 mt-2">
            Real platform statistics from PostgreSQL.
            {' '}
            Signed in as{' '}
            <span className="capitalize text-indigo-300 font-semibold">
              {role}
            </span>.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh dashboard"
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 transition"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Main metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Platform Users"
          value={stats.users.total}
          detail={`${stats.users.active} active · ${stats.users.suspended} suspended`}
          color="indigo"
        />

        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          label="Approved Clubs"
          value={stats.clubs.approved}
          detail={`${stats.clubs.pending} pending approval`}
          color="emerald"
        />

        <StatCard
          icon={<CalendarDays className="w-5 h-5" />}
          label="Upcoming Events"
          value={stats.events.upcoming}
          detail={`${stats.events.pending} pending events`}
          color="violet"
        />

        <StatCard
          icon={<Ticket className="w-5 h-5" />}
          label="Event Registrations"
          value={stats.attendance.registrations}
          detail={`${stats.attendance.checkedIn} checked in`}
          color="amber"
        />
      </section>
 
      <DashboardInsights stats={stats} role={role} />

      {/* Operational statistics */}
     {/*  <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <OperationalCard
          icon={<Clock3 className="w-5 h-5" />}
          title="Club Approval Queue"
          value={stats.clubs.pending}
          description="Club proposals waiting for moderator review."
          color="amber"
        />

        <OperationalCard
          icon={<CalendarDays className="w-5 h-5" />}
          title="Event Approval Queue"
          value={stats.events.pending}
          description="Event proposals waiting for moderator review."
          color="violet"
        />

        <OperationalCard
          icon={<Newspaper className="w-5 h-5" />}
          title="Pending Global Posts"
          value={stats.posts.pending}
          description="Global posts awaiting supervisor approval."
          color="indigo"
        />
      </section> */}

      {/* More real metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SmallMetric
          icon={<UserRoundCheck className="w-5 h-5 text-indigo-400" />}
          title="Club Memberships"
          value={stats.clubs.memberships}
        />

        <SmallMetric
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          title="Approved Posts"
          value={stats.posts.approved}
        />

        <SmallMetric
          icon={<CalendarDays className="w-5 h-5 text-violet-400" />}
          title="Approved Events"
          value={stats.events.approved}
        />
      </section>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
        <p className="text-xs text-slate-400">
          Data generated at:
          {' '}
          <span className="text-slate-200 font-semibold">
            {formatDateTime(stats.generatedAt)}
          </span>
          . The dashboard refreshes automatically every 30 seconds.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, detail, color }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <article className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">
          {label}
        </span>

        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
          {icon}
        </div>
      </div>

      <p className="mt-5 text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </article>
  );
}

function OperationalCard({ icon, title, value, description, color }) {
  const colors = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };

  return (
    <article className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className={`inline-flex p-2.5 rounded-xl border ${colors[color]}`}>
        {icon}
      </div>

      <p className="mt-4 text-2xl font-bold text-white">
        {value}
      </p>

      <h3 className="mt-1 text-sm font-semibold text-slate-200">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </article>
  );
}

function SmallMetric({ icon, title, value }) {
  return (
    <article className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
      <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
        {icon}
      </div>

      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{title}</p>
      </div>
    </article>
  );
}