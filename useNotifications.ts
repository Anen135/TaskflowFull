import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  metadata: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

interface UseNotificationsOptions {
  wsUrl: string; // e.g. https://api.taskflow.app
  getToken: () => string | null; // short-lived JWT for handshake auth
  onNewNotification?: (n: AppNotification) => void;
}

/**
 * Manages a single socket.io connection for the lifetime of the component
 * tree that mounts it (typically the app shell). Reconnects automatically
 * (socket.io default backoff); the server re-validates the JWT on every
 * reconnect via the `auth` handshake payload, so an expired session is
 * rejected cleanly instead of silently retrying forever.
 */
export function useNotifications({ wsUrl, getToken, onNewNotification }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${wsUrl}/ws/notifications`, {
      auth: { token: getToken() },
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('notification:new', (n: AppNotification) => {
      setNotifications((prev) => [n, ...prev].slice(0, 100));
      onNewNotification?.(n);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl]);

  const acknowledge = useCallback((notificationId: string) => {
    socketRef.current?.emit('notification:ack', notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  }, []);

  return { notifications, connected, acknowledge };
}
