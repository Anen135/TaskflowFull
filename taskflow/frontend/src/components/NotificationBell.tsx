import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications, AppNotification } from '../hooks/useNotifications';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    type: 'task_assigned',
    title: 'You were assigned: Database performance optimization',
    body: 'Review slow queries and add missing indexes.',
    metadata: { taskId: 'task-5' },
    read: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: '2',
    type: 'task_updated',
    title: 'Task updated: Set up CI/CD pipeline',
    body: 'Status changed to in_progress.',
    metadata: { taskId: 'task-3' },
    read: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: '3',
    type: 'mention',
    title: 'Alice mentioned you in a comment',
    body: '@Bob can you take a look at the auth flow?',
    metadata: { taskId: 'task-2' },
    read: true,
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // try real WS, fall back to mock data
  const { notifications: liveNotifications, connected, acknowledge } = useNotifications({
    wsUrl: 'http://localhost:3000',
    getToken: () => localStorage.getItem('taskflow_token'),
  });

  const notifications = liveNotifications.length > 0 ? liveNotifications : MOCK_NOTIFICATIONS;
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAck = (id: string) => {
    acknowledge(id);
    // Also update mock state
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title={connected ? 'Connected' : 'Offline (mock data)'}
      >
        🔔
        {unreadCount > 0 && <span className="notification-dot" />}
      </button>

      {isOpen && (
        <div className="notification-panel" ref={panelRef}>
          <div className="notification-panel-header">
            <span>Notifications</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {connected ? '● Live' : '◌ Demo'}
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">🔕</div>
              <div className="empty-state-text">No notifications yet</div>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-item ${!n.read ? 'unread' : ''}`}
                onClick={() => handleAck(n.id)}
              >
                <div className="notification-item-title">{n.title}</div>
                {n.body && <div className="notification-item-body">{n.body}</div>}
                <div className="notification-item-time">{timeAgo(n.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}