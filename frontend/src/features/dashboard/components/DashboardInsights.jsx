import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Newspaper,
  Ticket,
  Users,
} from 'lucide-react';

const COLORS = {
  approved: '#34d399', // emerald
  pending: '#fbbf24', // amber
  rejected: '#fb7185', // rose
  active: '#818cf8', // indigo
  suspended: '#fb7185',
  checkedIn: '#34d399',
  notCheckedIn: '#475569',
};

const number = (value) => Number(value ?? 0);

function ChartPanel({ title, subtitle, children }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      {children}
    </section>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 shadow-xl">
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="text-xs text-slate-200"
          style={{ color: entry.color }}
        >
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

function StatusDonut({ data, emptyMessage = 'No data yet' }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-xs text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
      <div className="h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>

            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-5 text-xs"
          >
            <span className="flex items-center gap-2 text-slate-400">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>

            <strong className="text-slate-200">{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueueMetric({ icon, title, value, color }) {
  const colors = {
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className={`inline-flex p-2 rounded-lg border ${colors[color]}`}>
        {icon}
      </div>

      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{title}</p>
    </div>
  );
}

export default function DashboardInsights({ stats, role }) {
  const userData = [
    {
      name: 'Active',
      value: number(stats.users?.active),
      color: COLORS.active,
    },
    {
      name: 'Suspended',
      value: number(stats.users?.suspended),
      color: COLORS.suspended,
    },
  ];

  const clubData = [
    {
      name: 'Approved',
      value: number(stats.clubs?.approved),
      color: COLORS.approved,
    },
    {
      name: 'Pending',
      value: number(stats.clubs?.pending),
      color: COLORS.pending,
    },
    {
      name: 'Rejected',
      value: number(stats.clubs?.rejected),
      color: COLORS.rejected,
    },
  ];

  const attendanceTotal = number(stats.attendance?.registrations);
  const checkedIn = number(stats.attendance?.checkedIn);

  const attendanceRate =
    attendanceTotal > 0
      ? Math.round((checkedIn / attendanceTotal) * 100)
      : 0;

  const contentData = [
    {
      name: 'Clubs',
      approved: number(stats.clubs?.approved),
      pending: number(stats.clubs?.pending),
      rejected: number(stats.clubs?.rejected),
    },
    {
      name: 'Events',
      approved: number(stats.events?.approved),
      pending: number(stats.events?.pending),
      rejected: number(stats.events?.rejected),
    },
    {
      name: 'Posts',
      approved: number(stats.posts?.approved),
      pending: number(stats.posts?.pending),
      rejected: number(stats.posts?.rejected),
    },
  ];

  const isSupervisor = role === 'supervisor';

  return (
    <div className="space-y-5">
      {/* Donut visualizations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartPanel
          title="User Account Health"
          subtitle="Active and suspended platform accounts"
        >
          <StatusDonut data={userData} />
        </ChartPanel>

        <ChartPanel
          title="Club Lifecycle"
          subtitle="Approval status of all club proposals"
        >
          <StatusDonut data={clubData} />
        </ChartPanel>
      </div>

      {/* Real grouped bar chart */}
      <ChartPanel
        title="Platform Content Status"
        subtitle="Approved, pending, and rejected records in PostgreSQL"
      >
        <div className="h-[310px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={contentData}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar
                dataKey="approved"
                name="Approved"
                fill={COLORS.approved}
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="pending"
                name="Pending"
                fill={COLORS.pending}
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="rejected"
                name="Rejected"
                fill={COLORS.rejected}
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartPanel>

      {/* Attendance ring + operational cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-5">
        <ChartPanel
          title="Event Attendance"
          subtitle="Checked-in registrations compared to all RSVP records"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(
                  #34d399 ${attendanceRate * 3.6}deg,
                  #1e293b ${attendanceRate * 3.6}deg
                )`,
              }}
            >
              <div className="w-28 h-28 rounded-full bg-slate-900 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {attendanceRate}%
                </span>

                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  Checked In
                </span>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Checked in
                </span>

                <strong className="text-slate-200">{checkedIn}</strong>
              </div>

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <Ticket className="w-4 h-4 text-indigo-400" />
                  Total registrations
                </span>

                <strong className="text-slate-200">{attendanceTotal}</strong>
              </div>

              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel
          title="Operational Queue"
          subtitle="Items requiring attention from the platform team"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QueueMetric
              icon={<Building2 className="w-4 h-4" />}
              title="Pending clubs"
              value={number(stats.clubs?.pending)}
              color="amber"
            />

            <QueueMetric
              icon={<CalendarDays className="w-4 h-4" />}
              title="Pending events"
              value={number(stats.events?.pending)}
              color="violet"
            />

            {isSupervisor ? (
              <QueueMetric
                icon={<Newspaper className="w-4 h-4" />}
                title="Pending posts"
                value={number(stats.posts?.pending)}
                color="indigo"
              />
            ) : (
              <QueueMetric
                icon={<Users className="w-4 h-4" />}
                title="Club memberships"
                value={number(stats.clubs?.memberships)}
                color="indigo"
              />
            )}
          </div>

          <div className="mt-5 flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Clock3 className="w-5 h-5 text-indigo-400 shrink-0" />

            <p className="text-xs text-slate-400">
              These values come directly from the protected dashboard API,
              not from frontend mock data.
            </p>
          </div>
        </ChartPanel>
      </div>
    </div>
  );
}