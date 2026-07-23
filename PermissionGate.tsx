import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGateProps {
  /** Required permission key(s), e.g. "task:delete" */
  permissions: string | string[];
  /** 'all' (default) requires every permission; 'any' requires at least one */
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Wraps any UI (buttons, menu items, whole sections) that should only render
 * when the current user's role grants the given permission(s).
 * This is a UX convenience only — the backend guards are the real
 * enforcement boundary, so hiding a button here never substitutes for the
 * @RequirePermissions() check on the corresponding API route.
 */
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

// Usage:
// <PermissionGate permissions="task:delete">
//   <button onClick={onDelete}>Delete task</button>
// </PermissionGate>
