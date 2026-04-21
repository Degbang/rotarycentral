import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoginInput, Permission, SessionPayload } from '@/data/model';
import { getCurrentSession, loginWithCredentials, logoutSession } from '@/data/api';

interface AuthContextValue {
  session: SessionPayload | null;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<SessionPayload>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    getCurrentSession()
      .then((nextSession) => setSession(nextSession))
      .finally(() => setIsBootstrapping(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isBootstrapping,
      login: async (input) => {
        const nextSession = await loginWithCredentials(input);
        setSession(nextSession);
        return nextSession;
      },
      logout: async () => {
        await logoutSession();
        setSession(null);
      },
      hasPermission: (permission) => Boolean(session?.permissions.includes(permission)),
    }),
    [isBootstrapping, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <div className="auth-loading">Loading your workspace...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { session, hasPermission } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
