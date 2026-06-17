'use client'

interface Props {
  // ISO date strings → count of activities that day
  data: Record<string, number>
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function getColor(count: number) {
  if (count === 0) return 'bg-slate-100 dark:bg-slate-800'
  if (count === 1) return 'bg-emerald-200'
  if (count <= 3)  return 'bg-emerald-300'
  if (count <= 6)  return 'bg-emerald-400'
  return 'bg-emerald-500'
}

export function ActivityHeatmap({ data }: Props) {
  // Build 52 weeks × 7 days grid ending today
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  const dow    = today.getDay() // 0=Sun
  // End on the last Saturday (or today if Saturday)
  const endDay = new Date(today)
  endDay.setDate(today.getDate() + (6 - dow))

  const weeks: { date: Date; iso: string }[][] = []
  const startDay = new Date(endDay)
  startDay.setDate(endDay.getDate() - 52 * 7 + 1)

  let week: { date: Date; iso: string }[] = []
  const cur = new Date(startDay)
  while (cur <= endDay) {
    const iso = cur.toISOString().slice(0, 10)
    week.push({ date: new Date(cur), iso })
    if (week.length === 7) { weeks.push(week); week = [] }
    cur.setDate(cur.getDate() + 1)
  }
  if (week.length) weeks.push(week)

  // Month labels: find week index where month changes
  const monthLabels: { label: string; col: number }[] = []
  weeks.forEach((w, i) => {
    const m = w[0].date.getMonth()
    if (i === 0 || weeks[i - 1][0].date.getMonth() !== m) {
      monthLabels.push({ label: MONTHS[m], col: i })
    }
  })

  const total = Object.values(data).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1 shrink-0">
          {DAYS.map((d, i) => (
            <div key={i} className="h-[11px] text-[9px] text-slate-400 leading-none flex items-center">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative">
          {/* Month labels row */}
          <div className="flex gap-[3px] mb-1 h-3">
            {weeks.map((_, i) => {
              const lbl = monthLabels.find(m => m.col === i)
              return (
                <div key={i} className="w-[11px] shrink-0">
                  {lbl && <span className="text-[9px] text-slate-400 whitespace-nowrap absolute">{lbl.label}</span>}
                </div>
              )
            })}
          </div>

          {/* Cells */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => {
                  const count   = data[day.iso] ?? 0
                  const isToday = day.iso === today.toISOString().slice(0, 10)
                  return (
                    <div
                      key={day.iso}
                      title={`${day.iso}: ${count} ${count === 1 ? 'activity' : 'activities'}`}
                      className={`w-[11px] h-[11px] rounded-[2px] ${getColor(count)} ${isToday ? 'ring-1 ring-blue-400 ring-offset-1' : ''} transition-opacity hover:opacity-70 cursor-default`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-400">{total} activities in the last year</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          Less
          {['bg-slate-100', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'].map(c => (
            <div key={c} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
          ))}
          More
        </div>
      </div>
    </div>
  )
}
