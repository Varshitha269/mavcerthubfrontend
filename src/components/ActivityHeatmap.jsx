import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

function getIntensityClass(count) {
  if (count === 0) return 'bg-white/5 border border-white/5';
  if (count === 1) return 'bg-emerald-900/50 border border-emerald-800/50';
  if (count === 2) return 'bg-emerald-700/70 border border-emerald-600/50';
  return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ActivityHeatmap({ heatmapData = {} }) {
  const [selectedDate, setSelectedDate] = useState(null);

  // Generate last 365 days grouped by weeks
  const weeks = useMemo(() => {
    const today = new Date();
    // Start from exactly 364 days ago
    const start = new Date(today);
    start.setDate(today.getDate() - 364);

    // Adjust start to the previous Sunday so we always have full columns of 7 days
    const dayOfWeek = start.getDay();
    if (dayOfWeek !== 0) {
      start.setDate(start.getDate() - dayOfWeek);
    }

    const allDays = [];
    let curr = new Date(start);
    while (curr <= today) {
      // YYYY-MM-DD
      const dateStr = curr.toISOString().split('T')[0];
      allDays.push(dateStr);
      curr.setDate(curr.getDate() + 1);
    }

    const weekChunks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weekChunks.push(allDays.slice(i, i + 7));
    }
    return weekChunks;
  }, []);

  const totalContributions = useMemo(() => {
    let total = 0;
    Object.values(heatmapData).forEach(arr => { total += arr.length; });
    return total;
  }, [heatmapData]);

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {totalContributions} contributions in the last year
        </h3>
        <div className="text-xs text-slate-400">
          Click on a square to view detailed activity
        </div>
      </div>

      {/* Heatmap Grid Wrapper */}
      <div className="bg-[#0d1117] border border-white/10 rounded-xl p-4 sm:p-6 overflow-x-auto custom-scrollbar">
        <div className="flex gap-1">
          {/* Day Labels (Mon, Wed, Fri) */}
          <div className="flex flex-col gap-[3px] text-[10px] text-slate-500 pr-2 pt-5">
            <div className="h-3 leading-3 mt-3">Mon</div>
            <div className="h-3 leading-3 mt-3">Wed</div>
            <div className="h-3 leading-3 mt-3">Fri</div>
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {/* Month Label roughly at the start of a month */}
                <div className="h-4 text-[10px] text-slate-500 mb-1 whitespace-nowrap">
                  {week[0] && new Date(week[0]).getDate() <= 7 ? new Date(week[0]).toLocaleString('en-US', { month: 'short' }) : ''}
                </div>
                
                {week.map((dateStr) => {
                  if (!dateStr) return <div key={Math.random()} className="w-3 h-3" />;
                  const activities = heatmapData[dateStr] || [];
                  const count = activities.length;
                  const isSelected = selectedDate === dateStr;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`w-3 h-3 rounded-[2px] transition-all cursor-pointer relative group ${getIntensityClass(count)} ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0d1117] z-10' : ''}`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {count === 0 ? 'No contributions' : `${count} contribution${count > 1 ? 's' : ''}`} on {formatDate(dateStr)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex justify-end items-center gap-1.5 text-[10px] text-slate-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-white/5 border border-white/5"></div>
          <div className="w-3 h-3 rounded-[2px] bg-emerald-900/50 border border-emerald-800/50"></div>
          <div className="w-3 h-3 rounded-[2px] bg-emerald-700/70 border border-emerald-600/50"></div>
          <div className="w-3 h-3 rounded-[2px] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"></div>
          <span>More</span>
        </div>
      </div>

      {/* Selected Date Activity List */}
      <div className={`mt-6 transition-all duration-300 ${selectedDate ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
        <div className="flex items-center gap-4 mb-4">
          <h4 className="text-lg font-display font-semibold text-white">Contribution activity</h4>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>

        {selectedDate && (
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
            <h5 className="text-sm font-semibold text-slate-300 mb-4">{formatDate(selectedDate)}</h5>
            
            {(!heatmapData[selectedDate] || heatmapData[selectedDate].length === 0) ? (
              <p className="text-sm text-slate-500 italic">No activity on this day.</p>
            ) : (
              <div className="space-y-4">
                {heatmapData[selectedDate].map((activity) => (
                  <Link 
                    key={activity.id} 
                    to={activity.url}
                    className="flex gap-4 group p-3 rounded-lg hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-colors"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {activity.type === 'enrollment' && (
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      )}
                      {activity.type === 'completion' && (
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {activity.type === 'task' && (
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {activity.type === 'voucher' && (
                        <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {activity.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(activity.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
