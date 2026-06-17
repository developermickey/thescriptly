'use client'
import { useState } from 'react'

interface DayData {
  date:     string
  label:    string
  subs:     number
  accepted: number
  lessons:  number
}

type Metric = 'subs' | 'accepted' | 'lessons'

const METRIC_CONFIG: Record<Metric, { label: string; color: string; barColor: string }> = {
  subs:     { label: 'Submissions',       color: 'text-blue-600',    barColor: 'bg-blue-500'    },
  accepted: { label: 'Problems Solved',   color: 'text-emerald-600', barColor: 'bg-emerald-500' },
  lessons:  { label: 'Lessons Completed', color: 'text-violet-600',  barColor: 'bg-violet-500'  },
}

export function ProgressCharts({ days }: { days: DayData[] }) {
  const [metric, setMetric] = useState<Metric>('subs')
  const [hovered, setHovered] = useState<number | null>(null)

  const values = days.map(d => d[metric])
  const maxVal = Math.max(...values, 1)

  // Group into weeks of 7 for display (show last 12 weeks, pick weekly ticks)
  const weekDays = days.filter((_, i) => i % 7 === 0)

  const cfg = METRIC_CONFIG[metric]

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1 mb-5">
        {(Object.keys(METRIC_CONFIG) as Metric[]).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              metric === m
                ? `${METRIC_CONFIG[m].barColor} text-white shadow-sm`
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {METRIC_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-right pr-2 w-8">
          <span className="text-[10px] text-slate-400">{maxVal}</span>
          <span className="text-[10px] text-slate-400">{Math.round(maxVal / 2)}</span>
          <span className="text-[10px] text-slate-400">0</span>
        </div>

        {/* Bars */}
        <div className="ml-10 relative">
          <div className="flex items-end gap-[2px] h-32 border-b border-slate-100">
            {days.map((d, i) => {
              const h = values[i] === 0 ? 0 : Math.max(4, Math.round((values[i] / maxVal) * 100))
              return (
                <div
                  key={d.date}
                  className="relative flex-1 flex items-end group"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className={`w-full rounded-t-sm transition-all ${cfg.barColor} ${values[i] === 0 ? 'opacity-10 bg-slate-300' : 'opacity-80 hover:opacity-100'}`}
                    style={{ height: `${h}%` }}
                  />
                  {hovered === i && values[i] > 0 && (
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                      {d.label}: {values[i]}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* X-axis ticks (every 2 weeks) */}
          <div className="flex mt-1">
            {days.map((d, i) => (
              <div key={d.date} className="flex-1 text-center">
                {i % 14 === 0 && (
                  <span className="text-[9px] text-slate-400 font-medium">{d.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Total Submissions', value: days.reduce((s, d) => s + d.subs, 0),     color: 'text-blue-600' },
          { label: 'Problems Solved',   value: days.reduce((s, d) => s + d.accepted, 0), color: 'text-emerald-600' },
          { label: 'Lessons Done',      value: days.reduce((s, d) => s + d.lessons, 0),  color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="text-center bg-slate-50 rounded-xl py-3">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
            <p className="text-[10px] text-slate-300 mt-0.5">last 12 weeks</p>
          </div>
        ))}
      </div>
    </div>
  )
}
