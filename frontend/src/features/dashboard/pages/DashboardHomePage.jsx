import { Link } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Calendar,
  Shield,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';

export default function DashboardHomePage() {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const isAdmin = role === 'admin';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-8 lg:p-10">
        <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-600/10 blur-[80px] rounded-full" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs text-indigo-300 font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Welcome to your campus
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white">
            Hello, {user?.firstName} 👋
          </h1>

          <p className="text-slate-400 text-sm mt-3 max-w-xl">
            {isAdmin
              ? 'Manage your campus platform, oversee organizations, and monitor student engagement.'
              : role === 'supervisor'
                ? 'Review club activities, supervise events, and support student communities.'
                : 'Discover new opportunities, connect with student communities, and explore exciting campus events.'}
          </p>

          <div className="flex flex-wrap gap-3 mt-7">
            <Link
              to="/app/clubs"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Explore Clubs
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              to="/app/events"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Browse Events
              <Calendar className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div>
        <h2 className="text-lg font-bold text-white mb-5">Your Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <InfoCard
            icon={<GraduationCap className="w-5 h-5" />}
            label="Account Role"
            value={role.charAt(0).toUpperCase() + role.slice(1)}
            color="indigo"
          />
          <InfoCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Authentication"
            value="Active JWT Session"
            color="emerald"
          />
          <InfoCard
            icon={<Shield className="w-5 h-5" />}
            label="Account Status"
            value="Verified"
            color="violet"
          />
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-bold text-white mb-5">Quick Access</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <QuickAccessCard
            icon={<Users />}
            title="Student Clubs"
            description="Explore university clubs and discover your community."
            to="/app/clubs"
          />
          <QuickAccessCard
            icon={<Calendar />}
            title="Campus Events"
            description="Find upcoming workshops, conferences, and activities."
            to="/app/events"
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, color }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function QuickAccessCard({ icon, title, description, to }) {
  return (
    <Link
      to={to}
      className="text-left bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition group block"
    >
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      <div className="flex items-center gap-2 mt-5 text-indigo-400 text-xs font-semibold group-hover:gap-3 transition-all">
        Explore
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}