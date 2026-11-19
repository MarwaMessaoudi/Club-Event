import { Navigate, Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({
  allowedRoles,
  redirectTo = '/app/feed',
}) {
  const { user, bootLoading, isAuthenticated } = useAuth();

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white">
          UniVibe
        </h1>

        <p className="text-slate-400 text-sm mt-2">
          Restoring your session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}