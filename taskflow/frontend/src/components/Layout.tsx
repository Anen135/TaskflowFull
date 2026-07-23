import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'tasks', label: 'Tasks', icon: '✅' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'team', label: 'Team', icon: '👥' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

interface LayoutProps {
  children: ReactNode;
  activeNav: string;
  onNavChange: (id: string) => void;
}

export function Layout({ children, activeNav, onNavChange }: LayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">TF</div>
            <span>TaskFlow</span>
          </div>
        </div>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.fullName}</div>
              <div className="sidebar-user-role">{user.role.name}</div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => onNavChange(item.id)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 16 }}>Account</div>
          <button className="sidebar-link" onClick={logout}>
            <span className="sidebar-link-icon">🚪</span>
            Sign out
          </button>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">
            {NAV_ITEMS.find((i) => i.id === activeNav)?.label ?? 'TaskFlow'}
          </h1>
          <div className="topbar-actions">
            <NotificationBell />
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}