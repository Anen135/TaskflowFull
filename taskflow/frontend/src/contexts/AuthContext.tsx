import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback } from 'react';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  workspaceId: string;
  role: {
    name: string;
    permissions: string[];
  };
}

interface AuthContextValue {
  user: CurrentUser | null;
  setUser: (u: CurrentUser | null) => void;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  hasAllPermissions: (perms: string[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Demo mode: when no backend is available, use this mock login
// that simulates a successful authentication response.
const MOCK_CREDENTIALS = { email: 'admin@taskflow.dev', password: 'password123' };
const MOCK_USER: CurrentUser = {
  id: 'demo-user-id',
  fullName: 'Alice Walker',
  email: 'admin@taskflow.dev',
  workspaceId: 'demo-workspace-id',
  role: {
    name: 'admin',
    permissions: [
      'workspace:manage',
      'user:invite', 'user:remove', 'user:role:assign',
      'project:create', 'project:update', 'project:delete', 'project:view',
      'task:create', 'task:update', 'task:delete', 'task:assign', 'task:view',
      'analytics:view', 'analytics:export',
    ],
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);

  const permissionSet = useMemo(
    () => new Set(user?.role.permissions ?? []),
    [user],
  );

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);

    // Try real API first, fall back to demo mode
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('taskflow_token', data.accessToken);
        setLoading(false);
        return;
      }
    } catch {
      // Backend not running — use demo mode
    }

    // Demo mode: accept the mock credentials
    if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
      setUser(MOCK_USER);
      localStorage.setItem('taskflow_token', 'demo-token');
    } else {
      throw new Error('Invalid credentials. Try admin@taskflow.dev / password123');
    }

    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('taskflow_token');
  }, []);

  const value: AuthContextValue = {
    user,
    setUser,
    hasPermission: (perm) => permissionSet.has(perm),
    hasAnyPermission: (perms) => perms.some((p) => permissionSet.has(p)),
    hasAllPermissions: (perms) => perms.every((p) => permissionSet.has(p)),
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}