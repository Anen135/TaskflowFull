import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGateProps {
  permissions: string | string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permissions,
  mode = 'all',
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions } = useAuth();
  const required = Array.isArray(permissions) ? permissions : [permissions];

  const allowed =
    mode === 'any' ? hasAnyPermission(required) : hasAllPermissions(required);

  return <>{allowed ? children : fallback}</>;
}