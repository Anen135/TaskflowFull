import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  workspaceId: string;
  role: {
    name: string;
    permissions: string[]; // flattened keys, e.g. "task:delete"
  };
}

interface AuthContextValue {
  user: CurrentUser | null;
  setUser: (u: CurrentUser | null) => void;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  hasAllPermissions: (perms: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  const permissionSet = useMemo(
    () => new Set(user?.role.permissions ?? []),
    [user],
  );

  const value: AuthContextValue = {
    user,
    setUser,
    hasPermission: (perm) => permissionSet.has(perm),
    hasAnyPermission: (perms) => perms.some((p) => permissionSet.has(p)),
    hasAllPermissions: (perms) => perms.every((p) => permissionSet.has(p)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
