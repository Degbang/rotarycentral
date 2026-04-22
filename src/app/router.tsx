import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth, RequirePermission, useAuth } from '@/features/auth';

const AppShell = lazy(async () => ({ default: (await import('@/app/shell')).AppShell }));
const AccessDeniedPage = lazy(async () => ({ default: (await import('@/pages/access-denied')).AccessDeniedPage }));
const EventDetailPage = lazy(async () => ({ default: (await import('@/pages/event-detail')).EventDetailPage }));
const EventEditorPage = lazy(async () => ({ default: (await import('@/pages/event-editor')).EventEditorPage }));
const EventsPage = lazy(async () => ({ default: (await import('@/pages/events')).EventsPage }));
const LoginPage = lazy(async () => ({ default: (await import('@/pages/login')).LoginPage }));
const ProjectDetailPage = lazy(async () => ({ default: (await import('@/pages/project-detail')).ProjectDetailPage }));
const ProjectEditorPage = lazy(async () => ({ default: (await import('@/pages/project-editor')).ProjectEditorPage }));
const ProjectsPage = lazy(async () => ({ default: (await import('@/pages/projects')).ProjectsPage }));
const AnnouncementsPage = lazy(async () => ({ default: (await import('@/pages/announcements')).AnnouncementsPage }));
const AnnouncementEditorPage = lazy(async () => ({ default: (await import('@/pages/announcement-editor')).AnnouncementEditorPage }));

function RouteLoader({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="auth-loading">Loading your workspace...</div>}>{children}</Suspense>;
}

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
    element: (
      <RouteLoader>
        <LoginPage />
      </RouteLoader>
    ),
  },
  {
    path: '/access-denied',
    element: (
      <RouteLoader>
        <AccessDeniedPage />
      </RouteLoader>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <RouteLoader>
          <AppShell />
        </RouteLoader>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <RootRedirect />,
      },
      {
        path: 'announcements',
        element: (
          <RouteLoader>
            <AnnouncementsPage />
          </RouteLoader>
        ),
      },
      {
        path: 'announcements/new',
        element: (
          <RequirePermission permission="staff.access">
            <RouteLoader>
              <AnnouncementEditorPage />
            </RouteLoader>
          </RequirePermission>
        ),
      },
      {
        path: 'announcements/:announcementId/edit',
        element: (
          <RequirePermission permission="staff.access">
            <RouteLoader>
              <AnnouncementEditorPage />
            </RouteLoader>
          </RequirePermission>
        ),
      },
      {
        path: 'events',
        element: (
          <RouteLoader>
            <EventsPage />
          </RouteLoader>
        ),
      },
      {
        path: 'events/new',
        element: (
          <RequirePermission permission="staff.access">
            <RouteLoader>
              <EventEditorPage />
            </RouteLoader>
          </RequirePermission>
        ),
      },
      {
        path: 'events/:eventId/edit',
        element: (
          <RequirePermission permission="staff.access">
            <RouteLoader>
              <EventEditorPage />
            </RouteLoader>
          </RequirePermission>
        ),
      },
      {
        path: 'events/:eventId',
        element: (
          <RouteLoader>
            <EventDetailPage />
          </RouteLoader>
        ),
      },
      {
        path: 'projects',
        element: (
          <RouteLoader>
            <ProjectsPage />
          </RouteLoader>
        ),
      },
      {
        path: 'projects/new',
        element: (
          <RequirePermission permission="staff.access">
            <RouteLoader>
              <ProjectEditorPage />
            </RouteLoader>
          </RequirePermission>
        ),
      },
      {
        path: 'projects/:projectId/edit',
        element: (
          <RequirePermission permission="staff.access">
            <RouteLoader>
              <ProjectEditorPage />
            </RouteLoader>
          </RequirePermission>
        ),
      },
      {
        path: 'projects/:projectId',
        element: (
          <RouteLoader>
            <ProjectDetailPage />
          </RouteLoader>
        ),
      },
      { path: 'home', element: <Navigate replace to="/events" /> },
      { path: 'clubs', element: <Navigate replace to="/events" /> },
      { path: 'manage', element: <Navigate replace to="/events" /> },
      { path: 'admin', element: <Navigate replace to="/events" /> },
    ],
  },
]);
