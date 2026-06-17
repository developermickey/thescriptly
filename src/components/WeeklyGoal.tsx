'use client'
import { useState, useEffect } from 'react'
import { Target, Check, ChevronRight } from 'lucide-react'

const GOALS = [3, 5, 7, 10, 15, 20]

interface Props {
  solvedThisWeek: number
}

export function WeeklyGoal({ solvedThisWeek }: Props) {
  const [goal, setGoal]   = useState<number | null>(null)
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('codex_weekly_goal')
    if (saved) setGoal(parseInt(saved))
  }, [])

  function setGoalValue(g: number) {
    setGoal(g)
    localStorage.setItem('codex_weekly_goal', String(g))
    setPicking(false)
  }

  if (goal === null) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target size={15} className="text-violet-500" />
          <span className="text-sm font-bold text-slate-900">Set a Weekly Goal</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">How many problems do you want to solve this week?</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map(g => (
            <button
              key={g}
              onClick={() => setGoalValue(g)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const pct     = Math.min(Math.round((solvedThisWeek / goal) * 100), 100)
  const done    = solvedThisWeek >= goal
  const radius  = 28
  const circ    = 2 * Math.PI * radius

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={15} className={done ? 'text-emerald-500' : 'text-violet-500'} />
          <span className="text-sm font-bold text-slate-900">Weekly Goal</span>
        </div>
        {!picking && (
          <button
            onClick={() => setPicking(true)}
            className="text-xs text-slate-400 hover:text-violet-600 transition-colors flex items-center gap-0.5"
          >
            Change <ChevronRight size={11} />
          </button>
        )}
      </div>

      {picking ? (
        <div>
          <p className="text-xs text-slate-400 mb-3">Pick a new goal:</p>
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => (
              <button
                key={g}
                onClick={() => setGoalValue(g)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                  g === goal
                    ? 'border-violet-400 text-violet-600 bg-violet-50'
                    : 'border-slate-200 text-slate-700 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50'
                }`}
              >
                {g}
              </button>
            ))}
            <button
              onClick={() => setPicking(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
              <circle
                cx="36" cy="36" r={radius} fill="none"
                stroke={done ? '#10b981' : '#8b5cf6'}
                strokeWidth="6"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct / 100)}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {done
                ? <Check size={20} className="text-emerald-500" />
                : <span className="text-sm font-bold text-slate-800">{pct}%</span>}
            </div>
          </div>

          <div>
            <p className={`text-xl font-extrabold ${done ? 'text-emerald-600' : 'text-slate-900'}`}>
              {solvedThisWeek} <span className="text-sm font-normal text-slate-400">/ {goal}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {done
                ? '🎉 Goal reached! Great work.'
                : `${goal - solvedThisWeek} more to reach your goal`}
            </p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden w-32">
              <div
                className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-emerald-500' : 'bg-violet-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
