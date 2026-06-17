'use client'
import { useState } from 'react'

interface Day {
  date: string
  subs: number
  signups: number
  enrolls: number
}

type Metric = 'subs' | 'signups' | 'enrolls'

const METRICS: { key: Metric; label: string; color: string; bg: string }[] = [
  { key: 'subs',    label: 'Submissions', color: '#3b82f6', bg: 'bg-blue-500' },
  { key: 'signups', label: 'New Users',   color: '#8b5cf6', bg: 'bg-violet-500' },
  { key: 'enrolls', label: 'Enrollments', color: '#10b981', bg: 'bg-emerald-500' },
]

export function AnalyticsChart({ days }: { days: Day[] }) {
  const [active, setActive] = useState<Metric>('subs')
  const [hover, setHover]   = useState<number | null>(null)

  const metric  = METRICS.find(m => m.key === active)!
  const values  = days.map(d => d[active])
  const maxVal  = Math.max(...values, 1)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Metric selector */}
      <div className="flex items-center gap-2 mb-6">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setActive(m.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              active === m.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${m.bg}`} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-right pr-2 w-8">
          {[maxVal, Math.round(maxVal * 0.5), 0].map(v => (
            <span key={v} className="text-[10px] text-slate-300 leading-none">{v}</span>
          ))}
        </div>

        {/* Bars */}
        <div className="ml-10 flex items-end gap-0.5 h-48">
          {days.map((day, i) => {
            const val = day[active]
            const h   = maxVal > 0 ? (val / maxVal) * 100 : 0
            const isHovered = hover === i
            const label = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center justify-end group cursor-default relative"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-10 shadow-lg">
                    {label}: {val}
                  </div>
                )}
                <div
                  className="w-full rounded-t transition-all duration-150"
                  style={{
                    height: `${Math.max(h, val > 0 ? 2 : 0)}%`,
                    backgroundColor: isHovered ? metric.color : `${metric.color}99`,
                    minHeight: val > 0 ? '3px' : '0',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* X-axis labels — show every 5th */}
        <div className="ml-10 flex gap-0.5 mt-1">
          {days.map((day, i) => (
            <div key={day.date} className="flex-1 text-center">
              {i % 5 === 0 && (
                <span className="text-[9px] text-slate-300">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data table summary (last 7 days) */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Last 7 Days</p>
        <div className="space-y-1.5">
          {days.slice(-7).reverse().map(d => (
            <div key={d.date} className="flex items-center gap-3 text-xs">
              <span className="text-slate-400 w-20 shrink-0">
                {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <div className="flex-1 flex gap-4">
                <span className="text-blue-600 font-bold w-8 text-right">{d.subs}</span>
                <span className="text-slate-300 text-[10px] mt-0.5">subs</span>
                <span className="text-violet-600 font-bold w-8 text-right">{d.signups}</span>
                <span className="text-slate-300 text-[10px] mt-0.5">users</span>
                <span className="text-emerald-600 font-bold w-8 text-right">{d.enrolls}</span>
                <span className="text-slate-300 text-[10px] mt-0.5">enrolls</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
