import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Users,
  Calendar,
  Compass,
  Shield,
  UserCheck,
  User,
  LogOut,
  BarChart3,
  Menu,
  X,
  CalendarDays,
  MessageCircle,
  Newspaper,
} from 'lucide-react';

import { useAuth } from '../features/auth/context/AuthContext';
import { usePendingCount } from '../features/moderation/hooks/useModeration';
import { getFileUrl } from '../utils/files';
import Logo from '../components/ui/Logo';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentRole = user?.role || 'student';
  const isAdmin = currentRole === 'admin';
  const isSupervisor = currentRole === 'supervisor';
  const canModerate = isAdmin || isSupervisor;

  // Admin: pending clubs + events
  // Supervisor: pending clubs + events + global posts
  const pendingCount = usePendingCount(currentRole, canModerate);

  const fullName = user
    ? `${user.firstName} ${user.lastName}`
    : '';

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '';

  const avatarUrl = getFileUrl(user?.avatar);

  const navItems = [
    {
  to: '/app/admin/analytics',
  icon: <BarChart3 className="w-5 h-5" />,
  label: 'Dashboard',
  show: isAdmin,
},
    {
      to: '/app/profile',
      icon: <User className="w-5 h-5" />,
      label: 'My Profile',
      show: true,
    },
    {
      to: '/app/feed',
      icon: <Newspaper className="w-5 h-5" />,
      label: 'Campus Feed',
      show: true,
    },
    {
      to: '/app/clubs',
      icon: <Users className="w-5 h-5" />,
      label: 'Explore Clubs',
      show: true,
    },
    {
      to: '/app/events',
      icon: <Calendar className="w-5 h-5" />,
      label: 'Campus Events',
      show: true,
    },
    {
      to: '/app/calendar',
      icon: <CalendarDays className="w-5 h-5" />,
      label: 'Calendar',
      show: true,
    },
    {
      to: '/app/channels',
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'Club Channels',
      show: true,
    },
    {
      to: '/app/moderation',
      icon: <Shield className="w-5 h-5" />,
      label: 'Approval Queue',
      show: canModerate,
      badge: pendingCount,
    },
    {
      to: '/app/admin/users',
      icon: <UserCheck className="w-5 h-5" />,
      label: 'User Management',
      show: isAdmin,
    },
    
  ];

  const Avatar = ({ small = false }) => (
    <div
      className={`${
        small ? 'w-9 h-9 rounded-lg text-xs' : 'w-10 h-10 rounded-xl text-sm'
      } bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold overflow-hidden shrink-0`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${fullName}'s avatar`}
          className="w-full h-full object-cover"
        />
      ) : (
        initials || 'U'
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 h-[72px] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-5 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Logo />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300 capitalize">
              {currentRole}
            </span>
          </div>

          {/* Header profile shortcut */}
          <Link
            to="/app/profile"
            title="Open my profile"
            className="flex items-center gap-3 rounded-xl hover:bg-slate-800/70 p-1.5 transition"
          >
            <Avatar />

            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-white">
                {fullName}
              </p>
              <p className="text-xs text-slate-400">
                {user?.email}
              </p>
            </div>
          </Link>

          <button
            onClick={logout}
            title="Sign out"
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static top-0 left-0 z-50 h-screen lg:h-auto w-64
            bg-slate-900 border-r border-slate-800 p-4 flex flex-col
            transition-transform duration-300
            ${
              sidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full lg:translate-x-0'
            }
          `}
        >
          <div className="flex justify-between items-center lg:hidden mb-6">
            <Logo />

            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Navigation
          </div>

          <nav className="space-y-1.5 flex-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
          </nav>

          {/* Sidebar profile shortcut */}
          <div className="border-t border-slate-800 pt-4">
            <Link
              to="/app/profile"
              onClick={() => setSidebarOpen(false)}
              className="bg-slate-800/50 hover:bg-slate-800 rounded-xl p-3 flex items-center gap-3 transition"
            >
              <Avatar small />

              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate">
                  {fullName}
                </p>

                <p className="text-[11px] text-slate-400 capitalize">
                  {currentRole}
                </p>
              </div>
            </Link>
          </div>
        </aside>

        {/* Active page */}
        <main className="flex-1 min-w-0 p-5 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}