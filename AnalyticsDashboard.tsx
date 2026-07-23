import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { PermissionGate } from './PermissionGate';

interface ThroughputPoint {
  bucket: string;
  created: number;
  completed: number;
}
interface StatusBreakdown {
  status: string;
  count: number;
}
interface AssigneeLoad {
  assigneeId: string;
  assigneeName: string;
  openTasks: number;
  overdueTasks: number;
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  in_review: '#f59e0b',
  done: '#22c55e',
  blocked: '#ef4444',
};

interface AnalyticsDashboardProps {
  apiBaseUrl: string;
  authToken: string;
  projectId?: string;
}

type Granularity = 'day' | 'week' | 'month';

export function AnalyticsDashboard({ apiBaseUrl, authToken, projectId }: AnalyticsDashboardProps) {
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [range, setRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: to.toISOString() };
  });

  const [throughput, setThroughput] = useState<ThroughputPoint[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [assigneeLoad, setAssigneeLoad] = useState<AssigneeLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      from: range.from,
      to: range.to,
      granularity,
    });
    if (projectId) params.set('projectId', projectId);
    return params.toString();
  }, [range, granularity, projectId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${authToken}` };
        const [t, s, a] = await Promise.all([
          fetch(`${apiBaseUrl}/analytics/throughput?${queryString}`, { headers }).then((r) => r.json()),
          fetch(`${apiBaseUrl}/analytics/status-breakdown?${queryString}`, { headers }).then((r) => r.json()),
          fetch(`${apiBaseUrl}/analytics/assignee-load?${queryString}`, { headers }).then((r) => r.json()),
        ]);
        if (!cancelled) {
          setThroughput(t);
          setStatusBreakdown(s);
          setAssigneeLoad(a);
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load analytics data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, authToken, queryString]);

  return (
    <PermissionGate
      permissions="analytics:view"
      fallback={<p style={{ color: '#64748b' }}>You don't have access to analytics.</p>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 14, color: '#475569' }}>Granularity:</label>
          {(['day', 'week', 'month'] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: granularity === g ? '#3b82f6' : 'white',
                color: granularity === g ? 'white' : '#334155',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
        {loading && <p style={{ color: '#64748b' }}>Loading analytics…</p>}

        {!loading && !error && (
          <>
            <section>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                Task throughput (created vs completed)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={throughput}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} name="Created" />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <section>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Status breakdown</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {statusBreakdown.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </section>

              <section>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Workload by assignee</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={assigneeLoad} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="assigneeName" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="openTasks" fill="#3b82f6" name="Open" />
                    <Bar dataKey="overdueTasks" fill="#ef4444" name="Overdue" />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            </div>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
