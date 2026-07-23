import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PermissionGate } from './components/PermissionGate';

/** Dashboard page stub */
function DashboardPage() {
  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <h2 className="card-title" style={{ marginBottom: 12 }}>Welcome to TaskFlow</h2>
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
        A modern project management platform with role-based access control,
        real-time WebSocket notifications, and interactive analytics dashboards.
      </p>
      <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-label">Active Workspace</div>
          <div className="stat-value" style={{ fontSize: 20 }}>Acme Corp</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-label">Your Role</div>
          <div className="stat-value" style={{ fontSize: 20 }}>Admin</div>
        </div>
      </div>
    </div>
  );
}

/** Tasks page stub */
function TasksPage() {
  const sampleTasks = [
    { title: 'Design new landing page', status: 'done', priority: 2 },
    { title: 'Implement user authentication', status: 'in_review', priority: 3 },
    { title: 'Set up CI/CD pipeline', status: 'in_progress', priority: 1 },
    { title: 'Write API documentation', status: 'todo', priority: 0 },
    { title: 'Database performance optimization', status: 'todo', priority: 2 },
    { title: 'Quarterly security audit', status: 'in_progress', priority: 3 },
  ];

  const priorityLabel = (p: number) => {
    if (p >= 3) return 'high';
    if (p >= 1) return 'medium';
    return 'low';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>All Tasks</h2>
        <PermissionGate permissions="task:create">
          <button className="btn btn-primary btn-sm">+ New Task</button>
        </PermissionGate>
      </div>

      <div className="task-list">
        {sampleTasks.map((task, i) => (
          <div key={i} className="task-row">
            <div className={`task-status-dot ${task.status}`} />
            <span className="task-title">{task.title}</span>
            <span className={`task-priority ${priorityLabel(task.priority)}`}>
              {priorityLabel(task.priority)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Team page stub */
function TeamPage() {
  const members = [
    { name: 'Alice Walker', role: 'Admin', email: 'alice@taskflow.dev' },
    { name: 'Bob Chen', role: 'Manager', email: 'bob@taskflow.dev' },
    { name: 'Carol Davis', role: 'Member', email: 'carol@taskflow.dev' },
    { name: 'Dan Wilson', role: 'Viewer', email: 'dan@taskflow.dev' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Team Members</span>
        <PermissionGate permissions="user:invite">
          <button className="btn btn-primary btn-sm">+ Invite</button>
        </PermissionGate>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m) => (
          <div key={m.email} className="task-row">
            <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              {m.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.email}</div>
            </div>
            <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              {m.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Settings page stub */
function SettingsPage() {
  return (
    <div className="card" style={{ maxWidth: 500 }}>
      <div className="card-header">
        <span className="card-title">Workspace Settings</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="form-label">Workspace name</label>
          <input className="form-input" defaultValue="Acme Corp" readOnly />
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            rows={3}
            defaultValue="Demo workspace for TaskFlow portfolio"
            readOnly
            style={{ resize: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

/** Inner app that uses auth context */
function AppShell() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardPage />;
      case 'tasks':
        return <TasksPage />;
      case 'analytics':
        return (
          <AnalyticsDashboard
            apiBaseUrl="http://localhost:3000"
            authToken={localStorage.getItem('taskflow_token') ?? ''}
          />
        );
      case 'team':
        return <TeamPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout activeNav={activeNav} onNavChange={setActiveNav}>
      {renderPage()}
    </Layout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}