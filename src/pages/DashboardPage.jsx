import React from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { dashboardApi } from "../services/api.js";
import { CardSkeleton } from "../components/Skeleton.jsx";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Sector } from "recharts";
import { ActivityHeatmap } from "../components/ActivityHeatmap.jsx";

// Icons
const RibbonIcon = () => (
  <svg className="w-8 h-8 text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-8 h-8 text-orange-400 group-hover:text-orange-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendIcon = () => (
  <svg className="w-8 h-8 text-indigo-400 group-hover:text-indigo-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export function DashboardPage() {
  const dash = useAsyncData(() => dashboardApi.me().then((r) => r.data), []);
  const charts = useAsyncData(() => dashboardApi.charts().then((r) => r.data), []);
  const heatmap = useAsyncData(() => dashboardApi.heatmap().then((r) => r.data), []);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  if (dash.loading && !dash.data) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (dash.error) {
    return <div className="text-rose-300">{dash.error}</div>;
  }

  const d = dash.data;
  const ch = charts.data;

  // Derive stats
  const totalCerts = d?.enrollments?.total || 0;
  const inProgress = d?.enrollments?.active || 0;
  const completed = d?.charts?.certification_status?.completed || 0;
  const successRate = totalCerts > 0 ? Math.round((completed / totalCerts) * 100) : 0;

  // Chart configs - adapted for dark theme
  const pieData = d?.charts?.certification_status ? [
    { name: 'Completed', value: d.charts.certification_status.completed || 0, color: '#10b981' }, // emerald-500
    { name: 'Pending', value: d.charts.certification_status.pending || 0, color: '#f59e0b' },   // amber-500
    { name: 'In Progress', value: d.charts.certification_status.in_progress || 0, color: '#3b82f6' }, // blue-500
    { name: 'Not Started', value: d.charts.certification_status.not_started || 0, color: '#64748b' }  // slate-500
  ].filter(item => item.value > 0) : [];

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#fff" className="font-bold text-xl drop-shadow-md">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={28} textAnchor="middle" fill="#94a3b8" className="text-xs">
          {value} Total
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.3))' }}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 15}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Welcome{d?.user?.full_name ? `, ${d.user.full_name}` : ""}</h2>
        <p className="text-slate-400">Your certification progress at a glance.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="group relative overflow-hidden bg-white/[0.03] rounded-2xl p-6 shadow-sm border border-white/10 hover:border-fuchsia-500/50 hover:bg-white/[0.05] transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl group-hover:bg-fuchsia-500/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-2 bg-fuchsia-500/10 rounded-xl"><RibbonIcon /></div>
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Total</span>
          </div>
          <div className="mt-4 relative z-10">
            <div className="text-4xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-fuchsia-400 group-hover:to-pink-400 transition-all">{totalCerts}</div>
            <div className="text-sm text-slate-400 mt-1">Total Certifications</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="group relative overflow-hidden bg-white/[0.03] rounded-2xl p-6 shadow-sm border border-white/10 hover:border-orange-500/50 hover:bg-white/[0.05] transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-2 bg-orange-500/10 rounded-xl"><ClockIcon /></div>
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Active</span>
          </div>
          <div className="mt-4 relative z-10">
            <div className="text-4xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-amber-400 transition-all">{inProgress}</div>
            <div className="text-sm text-slate-400 mt-1">In Progress</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="group relative overflow-hidden bg-white/[0.03] rounded-2xl p-6 shadow-sm border border-white/10 hover:border-emerald-500/50 hover:bg-white/[0.05] transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-2 bg-emerald-500/10 rounded-xl"><CheckIcon /></div>
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Done</span>
          </div>
          <div className="mt-4 relative z-10">
            <div className="text-4xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-400 group-hover:to-teal-400 transition-all">{completed}</div>
            <div className="text-sm text-slate-400 mt-1">Completed</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="group relative overflow-hidden bg-white/[0.03] rounded-2xl p-6 shadow-sm border border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.05] transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-2 bg-indigo-500/10 rounded-xl"><TrendIcon /></div>
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Rate</span>
          </div>
          <div className="mt-4 relative z-10">
            <div className="text-4xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-cyan-400 transition-all">{successRate}%</div>
            <div className="text-sm text-slate-400 mt-1">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Current Certification Progress */}
      <div>
        <h3 className="font-display text-xl font-bold text-white mb-4 tracking-tight">Current Certification Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(d?.current_certifications || []).map((cert, i) => (
            <div key={i} className="group relative overflow-hidden bg-white/[0.03] rounded-2xl p-6 shadow-sm border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex justify-between items-start gap-4">
                <h4 className="font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">{cert.title}</h4>
                <span className="shrink-0 inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                  {cert.status}
                </span>
              </div>
              <div className="mt-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm text-slate-400">Progress</span>
                  <span className="text-sm font-bold text-white">{cert.progress}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${cert.progress}%` }}>
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarIcon />
                  Due: {cert.due_date}
                </div>
              </div>
            </div>
          ))}
          {(!d?.current_certifications || d.current_certifications.length === 0) && (
            <div className="col-span-full py-8 text-center text-slate-400 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
              You don't have any active certifications at the moment.
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line/Area Chart */}
        <div className="bg-white/[0.03] rounded-2xl p-6 shadow-sm border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col">
          <div className="mb-6">
            <h3 className="font-display text-lg font-bold text-white tracking-tight">Monthly Progress Trend</h3>
            <p className="text-xs text-slate-400 mt-1">Tracks your new enrollments and completed certifications over the last 6 months.</p>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            {charts.loading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ch?.monthly_progress || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff15" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    cursor={{ stroke: '#ffffff20', strokeWidth: 2 }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <Area type="monotone" name="New Enrollments" dataKey="enrollments" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorEnrollments)" activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                  <Area type="monotone" name="Completed Certs" dataKey="completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="bg-white/[0.03] rounded-2xl p-6 shadow-sm border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col">
          <div className="mb-2">
            <h3 className="font-display text-lg font-bold text-white tracking-tight">Certification Status</h3>
            <p className="text-xs text-slate-400 mt-1">Breakdown of your current overall certification portfolio.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative flex flex-col items-center justify-center mt-4">
             {pieData.length === 0 ? (
                <div className="text-slate-400 text-sm">No data available</div>
             ) : (
               <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1', paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </>
             )}
          </div>
        </div>

      </div>

      {/* GitHub-style Activity Heatmap */}
      <div className="mt-8">
        {heatmap.loading ? (
          <div className="w-full h-[200px] bg-white/[0.02] rounded-xl flex items-center justify-center border border-white/5">
            <span className="text-slate-500">Loading activity...</span>
          </div>
        ) : heatmap.error ? (
          <div className="w-full p-4 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            Failed to load activity heatmap.
          </div>
        ) : (
          <ActivityHeatmap heatmapData={heatmap.data?.heatmap || {}} />
        )}
      </div>
    </div>
  );
}
