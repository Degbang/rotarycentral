import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/app/shell';
import { RequireAuth, RequirePermission, useAuth } from '@/features/auth';
import { AccessDeniedPage } from '@/pages/access-denied';
import { EventDetailPage } from '@/pages/event-detail';
import { EventEditorPage } from '@/pages/event-editor';
import { EventsPage } from '@/pages/events';
import { LoginPage } from '@/pages/login';
import { ProjectDetailPage } from '@/pages/project-detail';
import { ProjectEditorPage } from '@/pages/project-editor';
import { ProjectsPage } from '@/pages/projects';

function RootRedirect() {
  const { session, isBootstrapping } = useAuth();
  if (isBootstrapping) {
    return <div className="auth-loading">Loading your workspace...</div>;
  }

  return <Navigate replace to={session?.defaultRoute ?? '/login'} />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/access-denied',
    element: <AccessDeniedPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <RootRedirect />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: 'events/new',
        element: (
          <RequirePermission permission="staff.access">
            <EventEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: 'events/:eventId/edit',
        element: (
          <RequirePermission permission="staff.access">
            <EventEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: 'events/:eventId',
        element: <EventDetailPage />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/new',
        element: (
          <RequirePermission permission="staff.access">
            <ProjectEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: 'projects/:projectId/edit',
        element: (
          <RequirePermission permission="staff.access">
            <ProjectEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: 'projects/:projectId',
        element: <ProjectDetailPage />,
      },
      { path: 'home', element: <Navigate replace to="/events" /> },
      { path: 'clubs', element: <Navigate replace to="/events" /> },
      { path: 'manage', element: <Navigate replace to="/events" /> },
      { path: 'admin', element: <Navigate replace to="/events" /> },
    ],
  },
]);
