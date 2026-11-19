import { createBrowserRouter, Navigate } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  MessageCircle,
  Shield,
  UserCheck,
  BarChart3,
  Newspaper,
} from 'lucide-react';

import AppIndexRedirect from './AppIndexRedirect';
import ChatPage from '../features/chat/pages/ChatPage';

import PlatformDashboardPage from '../features/dashboard/pages/PlatformDashboardPage';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../features/auth/components/ProtectedRoute';
import ComingSoon from '../components/ui/ComingSoon';
import ClubsPage from '../features/clubs/pages/ClubsPage';
import ModerationPage from '../features/moderation/pages/ModerationPage'
import FeedPage from '../features/posts/pages/FeedPages';
import UserManagementPage from '../features/users/pages/UseManagementPage';

import EventsPage from '../features/events/pages/EventsPage';
import CalendarPage from '../features/calendar/pages/CalendarPage';

import ProfilePage from '../features/profile/pages/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
{ index: true, element: <AppIndexRedirect /> },{
  path: 'dashboard',
  element: (
    <ProtectedRoute
      allowedRoles={['admin', 'supervisor']}
      redirectTo="/app/feed"
    />
  ),
  children: [
    {
      index: true,
      element: <PlatformDashboardPage />,
    },
  ],
},          { path: 'feed', element: <FeedPage /> },

          { path: 'clubs', element: <ClubsPage /> },
          {path: 'events',element: <EventsPage />,},
          { path: 'profile', element: <ProfilePage /> },

          {
            path: 'calendar',
            element: (
              <CalendarPage
                icon={<CalendarDays />}
                title="Calendar"
                description="Your unified schedule of upcoming events."
              />
            ),
          },
          {
  path: 'channels',
  element: <ChatPage />,
},

          // Supervisor + Admin only
          {
            path: 'moderation',
            element: <ProtectedRoute allowedRoles={['supervisor', 'admin']} />,
            children: [
              {
                index: true,
                element: (
                  <ModerationPage
                    icon={<Shield />}
                    title="Approval Queue"
                    description="Review and moderate pending club, event, and post proposals."
                  />
                ),
              },
            ],
          },

          // Admin only
         {
  path: 'admin',
  element: <ProtectedRoute allowedRoles={['admin']} />,
  children: [
    {
      path: 'users',
      element: <UserManagementPage />,
    },
    
  ],
},
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);