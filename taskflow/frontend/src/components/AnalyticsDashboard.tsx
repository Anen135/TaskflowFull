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

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
};

// Demo data for when the backend isn't available
const DEMO_THROUGHPUT: ThroughputPoint[] = [
  { bucket: '2026-07-01', created: 4, completed: 2 },
  { bucket: '2026-07-02', created: 3, completed: 1 },
  { bucket: '2026-07-03', created: 5, completed: 3 },
  { bucket: '2026-07-04', created: 2, completed: 4 },
  { bucket: '2026-07-05', created: 6, completed: 2 },
  { bucket: '2026-07-06', created: 3, completed: 5 },
  { bucket: '2026-07-07', created: 7, completed: 3 },
  { bucket: '2026-07-08', created: 4, completed: 6 },
  { bucket: '2026-07-09', created: 5, completed: 4 },
  { bucket: '2026-07-10', created: 8, completed: 5 },
];

const DEMO_STATUS: StatusBreakdown[] = [
  { status: 'todo', count: 3 },
  { status: 'in_progress', count: 2 },
  { status: 'in_review', count: 1 },
  { status: 'done', count: 3 },
  { status: 'blocked', count: 1 },
];

const DEMO_ASSIGNEE: AssigneeLoad[] = [
  { assigneeId: '1', assigneeName: 'Alice Walker', openTasks: 4, overdueTasks: 1 },
  { assigneeId: '2', assigneeName: 'Bob Chen', openTasks: 3, overdueTasks: 2 },
  { assigneeId: '3', assigneeName: 'Carol Davis', openTasks: 2, overdueTasks: 0 },
  { assigneeId: '4', assigneeName: 'Dan Wilson', openTasks: 1, overdueTasks: 1 },
];

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
  const [useDemo, setUseDemo] = useState(false);

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
          fetch(`${apiBaseUrl}/analytics/throughput?${queryString}`, { headers }).then((r) => {
            if (!r.ok) throw new Error('API error');
            return r.json();
          }),
          fetch(`${apiBaseUrl}/analytics/status-breakdown?${queryString}`, { headers }).then((r) => {
            if (!r.ok) throw new Error('API error');
            return r.json();
          }),
          fetch(`${apiBaseUrl}/analytics/assignee-load?${queryString}`, { headers }).then((r) => {
            if (!r.ok) throw new Error('API error');
            return r.json();
          }),
        ]);
        if (!cancelled) {
          setThroughput(t);
          setStatusBreakdown(s);
          setAssigneeLoad(a);
          setUseDemo(false);
        }
      } catch {
        if (!cancelled) {
          // Fall back to demo data
          setThroughput(DEMO_THROUGHPUT);
          setStatusBreakdown(DEMO_STATUS);
          setAssigneeLoad(DEMO_ASSIGNEE);
          setUseDemo(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, authToken, queryString]);

  const totalTasks = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const doneTasks = statusBreakdown.find((s) => s.status === 'done')?.count ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <PermissionGate
      permissions="analytics:view"
      fallback={
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--color-text-muted)' }}>
            You don't have access to analytics.
          </p>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Stats overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value">{totalTasks}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{doneTasks}</div>
            <div className="stat-change up">↑ {completionRate}% completion rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">
              {statusBreakdown.find((s) => s.status === 'in_progress')?.count ?? 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overdue Tasks</div>
            <div className="stat-value">
              {assigneeLoad.reduce((sum, a) => sum + a.overdueTasks, 0)}
            </div>
            <div className="stat-change down">↓ Needs attention</div>
          </div>
        </div>

        {/* Controls */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Analytics</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {useDemo && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Demo data
                </span>
              )}
              <div className="granularity-group">
                {(['day', 'week', 'month'] as Granularity[]).map((g) => (
                  <button
                    key={g}
                    className={`granularity-btn ${granularity === g ? 'active' : ''}`}
                    onClick={() => setGranularity(g)}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading-spinner">Loading analytics</div>}

          {!loading && (
            <>
              {/* Throughput chart */}
              <section style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
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

              {/* Two-column charts */}
              <div className="grid-2">
                <section>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                    Status breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusBreakdown.map((s) => ({ ...s, label: STATUS_LABELS[s.status] ?? s.status }))}
                        dataKey="count"
                        nameKey="label"
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
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                    Workload by assignee
                  </h3>
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
      </div>
    </PermissionGate>
  );
}