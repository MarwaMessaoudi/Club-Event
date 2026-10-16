import { useState } from 'react';
import {
  Sparkles,
  Users,
  Calendar,
  Compass,
  Shield,
  UserCheck,
  LogOut,
  BarChart3,
  Bell,
  Search,
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  PlusCircle,
  CalendarDays,
  MessageCircle,
  CheckCircle2,
  GraduationCap,
  Activity,
} from 'lucide-react';

import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';

// ============================================
// MAIN APP
// ============================================

function App() {
  const {
    user,
    logout,
    bootLoading,
    isAuthenticated,
  } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ============================================
  // AUTH HELPERS
  // ============================================

  const openLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab('dashboard');
  };

  const currentRole = user?.role || 'student';

  const isAdmin = currentRole === 'admin';

  const canModerate =
    currentRole === 'admin' ||
    currentRole === 'supervisor';

  const fullName = user
    ? `${user.firstName} ${user.lastName}`
    : '';

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
        .toUpperCase()
    : '';

  // ============================================
  // LOADING SCREEN
  // ============================================

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white">
          CampusPulse
        </h1>

        <p className="text-slate-400 text-sm mt-2">
          Restoring your session...
        </p>
      </div>
    );
  }

  // ============================================
  // PUBLIC LANDING PAGE
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white overflow-hidden">

        {/* Navbar */}

        <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">

            <Logo />

            <div className="flex items-center gap-4">
              <button
                onClick={openLogin}
                className="text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Sign In
              </button>

              <button
                onClick={openRegister}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
              >
                Get Started
              </button>
            </div>

          </div>
        </header>

        {/* Hero */}

        <section className="relative">

          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-36 relative">

            <div className="max-w-3xl mx-auto text-center">

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-semibold mb-8">
                <Sparkles className="w-4 h-4" />
                Your Campus. Your Community.
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                Where Campus
                <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Comes Alive.
                </span>
              </h1>

              <p className="mt-8 text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                Discover student clubs, explore exciting events,
                connect with your community, and make the most
                of your university experience.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">

                <button
                  onClick={openRegister}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition shadow-xl shadow-indigo-600/25"
                >
                  Join CampusPulse
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={openLogin}
                  className="px-8 py-3.5 bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl font-semibold transition"
                >
                  I already have an account
                </button>

              </div>

            </div>

            {/* Features */}

            <div className="grid md:grid-cols-3 gap-6 mt-28">

              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                title="Discover Clubs"
                description="Find communities that match your interests, join clubs, and collaborate with students."
                color="indigo"
              />

              <FeatureCard
                icon={<Calendar className="w-6 h-6" />}
                title="Explore Events"
                description="Stay connected with workshops, hackathons, conferences, and campus activities."
                color="violet"
              />

              <FeatureCard
                icon={<Shield className="w-6 h-6" />}
                title="Organized Campus"
                description="A secure platform connecting students, supervisors, and administrators."
                color="emerald"
              />

            </div>

          </div>

        </section>

        {/* Footer */}

        <footer className="border-t border-slate-800 py-8 text-center">
          <p className="text-xs text-slate-500">
            © 2026 CampusPulse — University Clubs & Events Platform
          </p>
        </footer>

        {/* Authentication Modal */}

        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          setMode={setAuthMode}
        />

      </div>
    );
  }

  // ============================================
  // AUTHENTICATED APPLICATION
  // ============================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* ============================================ */}
      {/* TOP HEADER */}
      {/* ============================================ */}

      <header className="sticky top-0 z-40 h-18 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-5 lg:px-8 py-3 flex items-center justify-between">

        <div className="flex items-center gap-4">

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Logo />

        </div>

        {/* Search - visual placeholder until EF-04 */}

        <div className="hidden md:flex items-center relative w-72 lg:w-96">

          <Search className="w-4 h-4 text-slate-500 absolute left-3.5" />

          <input
            type="text"
            placeholder="Search clubs, events..."
            disabled
            className="w-full bg-slate-800/80 text-sm text-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/60 cursor-not-allowed"
          />

        </div>

        {/* User */}

        <div className="flex items-center gap-4">

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />

            <span className="text-xs font-semibold text-indigo-300 capitalize">
              {currentRole}
            </span>
          </div>

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-sm">
              {initials}
            </div>

            <div className="hidden lg:block">

              <p className="text-sm font-semibold text-white">
                {fullName}
              </p>

              <p className="text-xs text-slate-400">
                {user.email}
              </p>

            </div>

          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>

        </div>

      </header>

      {/* ============================================ */}
      {/* MAIN LAYOUT */}
      {/* ============================================ */}

      <div className="flex flex-1">

        {/* Sidebar */}

        <aside
          className={`
            fixed lg:static
            top-0 left-0 z-50
            h-screen lg:h-auto
            w-64
            bg-slate-900
            border-r border-slate-800
            p-4
            flex flex-col
            transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >

          <div className="flex justify-between items-center lg:hidden mb-6">

            <Logo />

            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>

          </div>

          <div className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Navigation
          </div>

          <nav className="space-y-1.5 flex-1">

            <NavItem
              icon={<Compass />}
              label="Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => {
                setActiveTab('dashboard');
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<Users />}
              label="Explore Clubs"
              active={activeTab === 'clubs'}
              onClick={() => {
                setActiveTab('clubs');
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<Calendar />}
              label="Campus Events"
              active={activeTab === 'events'}
              onClick={() => {
                setActiveTab('events');
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<CalendarDays />}
              label="Smart Calendar"
              active={activeTab === 'calendar'}
              onClick={() => {
                setActiveTab('calendar');
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<MessageCircle />}
              label="Club Channels"
              active={activeTab === 'channels'}
              onClick={() => {
                setActiveTab('channels');
                setSidebarOpen(false);
              }}
            />

            {/* Supervisor & Admin */}

            {canModerate && (
              <NavItem
                icon={<Shield />}
                label="Approval Queue"
                active={activeTab === 'moderation'}
                onClick={() => {
                  setActiveTab('moderation');
                  setSidebarOpen(false);
                }}
              />
            )}

            {/* Admin only */}

            {isAdmin && (
              <NavItem
                icon={<UserCheck />}
                label="User Management"
                active={activeTab === 'users'}
                onClick={() => {
                  setActiveTab('users');
                  setSidebarOpen(false);
                }}
              />
            )}

            {isAdmin && (
              <NavItem
                icon={<BarChart3 />}
                label="Analytics"
                active={activeTab === 'analytics'}
                onClick={() => {
                  setActiveTab('analytics');
                  setSidebarOpen(false);
                }}
              />
            )}

          </nav>

          {/* Sidebar user info */}

          <div className="border-t border-slate-800 pt-4">

            <div className="bg-slate-800/50 rounded-xl p-3">

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>

                <div className="overflow-hidden">

                  <p className="text-xs font-semibold truncate">
                    {fullName}
                  </p>

                  <p className="text-[11px] text-slate-400 capitalize">
                    {currentRole}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </aside>

        {/* Workspace */}

        <main className="flex-1 min-w-0 p-5 lg:p-8">

          <div className="max-w-7xl mx-auto">

            {/* Dashboard */}

            {activeTab === 'dashboard' && (
              <DashboardHome
                user={user}
                onNavigate={setActiveTab}
              />
            )}

            {/* Clubs */}

            {activeTab === 'clubs' && (
              <ComingSoon
                icon={<Users />}
                title="Explore Clubs"
                description="Discover campus organizations, join communities, and connect with students."
              />
            )}

            {/* Events */}

            {activeTab === 'events' && (
              <ComingSoon
                icon={<Calendar />}
                title="Campus Events"
                description="Browse upcoming campus events and register for activities."
              />
            )}

            {/* Calendar */}

            {activeTab === 'calendar' && (
              <ComingSoon
                icon={<CalendarDays />}
                title="Smart Calendar"
                description="Your personal campus events calendar."
              />
            )}

            {/* Channels */}

            {activeTab === 'channels' && (
              <ComingSoon
                icon={<MessageCircle />}
                title="Club Channels"
                description="Communicate and collaborate with your club community."
              />
            )}

            {/* Moderation */}

            {activeTab === 'moderation' && canModerate && (
              <ComingSoon
                icon={<Shield />}
                title="Approval Queue"
                description="Review and manage pending club and event requests."
              />
            )}

            {/* User Management */}

            {activeTab === 'users' && isAdmin && (
              <ComingSoon
                icon={<UserCheck />}
                title="User Management"
                description="Manage student accounts, supervisors, and platform permissions."
              />
            )}

            {/* Analytics */}

            {activeTab === 'analytics' && isAdmin && (
              <ComingSoon
                icon={<BarChart3 />}
                title="Analytics & Statistics"
                description="Platform statistics and administrative insights."
              />
            )}

          </div>

        </main>

      </div>

    </div>
  );
}

// ============================================
// LOGO
// ============================================

function Logo() {
  return (
    <div className="flex items-center gap-3">

      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <Sparkles className="w-5 h-5 text-white" />
      </div>

      <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
        CampusPulse
      </span>

    </div>
  );
}

// ============================================
// LANDING FEATURE CARD
// ============================================

function FeatureCard({ icon, title, description, color }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-7 hover:border-indigo-500/30 transition">

      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${colors[color]}`}>
        {icon}
      </div>

      <h3 className="text-lg font-bold text-white mb-3">
        {title}
      </h3>

      <p className="text-sm text-slate-400 leading-relaxed">
        {description}
      </p>

    </div>
  );
}

// ============================================
// SIDEBAR ITEM
// ============================================

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3
        px-3 py-3 rounded-xl text-sm font-medium
        transition-all
        ${
          active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }
      `}
    >
      <span className="w-5 h-5">
        {icon}
      </span>

      <span>{label}</span>

    </button>
  );
}

// ============================================
// DASHBOARD HOME
// ============================================

function DashboardHome({ user, onNavigate }) {
  const role = user.role;

  const isAdmin = role === 'admin';

  return (
    <div className="space-y-8">

      {/* Welcome */}

      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-8 lg:p-10">

        <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-600/10 blur-[80px] rounded-full" />

        <div className="relative">

          <div className="inline-flex items-center gap-2 text-xs text-indigo-300 font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Welcome to your campus
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white">
            Hello, {user.firstName} 👋
          </h1>

          <p className="text-slate-400 text-sm mt-3 max-w-xl">
            {isAdmin
              ? 'Manage your campus platform, oversee organizations, and monitor student engagement.'
              : role === 'supervisor'
              ? 'Review club activities, supervise events, and support student communities.'
              : 'Discover new opportunities, connect with student communities, and explore exciting campus events.'}
          </p>

          <div className="flex flex-wrap gap-3 mt-7">

            <button
              onClick={() => onNavigate('clubs')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Explore Clubs
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('events')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Browse Events
              <Calendar className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>

      {/* Account information */}

      <div>

        <h2 className="text-lg font-bold text-white mb-5">
          Your Account
        </h2>

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
            value="Active Session"
            color="emerald"
          />

          <InfoCard
            icon={<Shield className="w-5 h-5" />}
            label="Account Status"
            value="Authenticated"
            color="violet"
          />

        </div>

      </div>

      {/* Quick Access */}

      <div>

        <h2 className="text-lg font-bold text-white mb-5">
          Quick Access
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <QuickAccessCard
            icon={<Users />}
            title="Student Clubs"
            description="Explore university clubs and discover your community."
            onClick={() => onNavigate('clubs')}
          />

          <QuickAccessCard
            icon={<Calendar />}
            title="Campus Events"
            description="Find upcoming workshops, conferences, and activities."
            onClick={() => onNavigate('events')}
          />

        </div>

      </div>

      {/* Development notice */}

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex items-start gap-3">

        <Activity className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />

        <div>

          <h3 className="text-sm font-semibold text-white">
            Phase 1 — Application Development
          </h3>

          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Authentication is connected to the NestJS API and PostgreSQL database.
            Club management, event registration, and analytics will be integrated next.
          </p>

        </div>

      </div>

    </div>
  );
}

// ============================================
// INFORMATION CARD
// ============================================

function InfoCard({ icon, label, value, color }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

      <div className="flex items-center justify-between mb-5">

        <span className="text-xs text-slate-400 font-medium">
          {label}
        </span>

        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          {icon}
        </div>

      </div>

      <p className="text-xl font-bold text-white">
        {value}
      </p>

    </div>
  );
}

// ============================================
// QUICK ACCESS CARD
// ============================================

function QuickAccessCard({ icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition group"
    >

      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5">
        {icon}
      </div>

      <h3 className="text-base font-bold text-white mb-2">
        {title}
      </h3>

      <p className="text-xs text-slate-400 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-2 mt-5 text-indigo-400 text-xs font-semibold group-hover:gap-3 transition-all">
        Explore
        <ArrowRight className="w-4 h-4" />
      </div>

    </button>
  );
}

// ============================================
// COMING SOON PLACEHOLDER
// ============================================

function ComingSoon({ icon, title, description }) {
  return (
    <div className="min-h-[65vh] flex items-center justify-center">

      <div className="text-center max-w-md">

        <div className="w-20 h-20 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
          {icon}
        </div>

        <h2 className="text-2xl font-bold text-white">
          {title}
        </h2>

        <p className="text-sm text-slate-400 mt-3">
          {description}
        </p>

        <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Under Development
        </div>

      </div>

    </div>
  );
}

export default App;