import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export default function AppIndexRedirect() {
  const { user } = useAuth();

  const canSeeDashboard =
    user?.role === 'admin' ||
    user?.role === 'supervisor';

  return (
    <Navigate
      to={canSeeDashboard ? '/app/dashboard' : '/app/feed'}
      replace
    />
  );
}