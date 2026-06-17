'use client'
import { useState } from 'react'
import { Flame, Trophy, Zap, Snowflake } from 'lucide-react'

interface Props {
  currentStreak: number
  longestStreak: number
  solvedToday:   boolean
  freezesLeft:   number
  freezeAvailable: boolean
  nextFreezeIn:  number
  streakAtRisk:  boolean  // last solve was yesterday, not yet solved today
}

export function StreakCard({ currentStreak, longestStreak, solvedToday, freezesLeft, freezeAvailable, nextFreezeIn, streakAtRisk }: Props) {
  const [freezeState, setFreezeState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [freezeMsg,   setFreezeMsg]   = useState('')
  const [localFreezes, setLocalFreezes] = useState(freezesLeft)

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const today = new Date().getDay()
  const todayIdx = today === 0 ? 6 : today - 1

  const dotActive = days.map((_, i) => {
    const daysFromToday = todayIdx - i
    if (daysFromToday < 0) return false
    if (daysFromToday === 0) return solvedToday
    return daysFromToday < currentStreak
  })

  const isOnFire = currentStreak >= 3
  const flameColor = currentStreak >= 7 ? 'text-orange-500' : currentStreak >= 3 ? 'text-amber-500' : 'text-slate-400'

  async function applyFreeze() {
    setFreezeState('loading')
    const res  = await fetch('/api/user/streak-freeze', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setFreezeState('done')
      setFreezeMsg('Streak protected for today!')
      setLocalFreezes(data.freezesLeft)
    } else {
      setFreezeState('error')
      setFreezeMsg(data.error ?? 'Could not apply freeze')
      setTimeout(() => setFreezeState('idle'), 3000)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Flame size={15} className={flameColor} />
            Daily Streak
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {solvedToday ? "You've solved today — keep it up!" : "Solve a problem to keep your streak!"}
          </p>
        </div>
        {isOnFire && (
          <span className="text-xs font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg">
            🔥 On fire!
          </span>
        )}
      </div>

      {/* Big number */}
      <div className="flex items-end gap-4 mb-4">
        <div>
          <div className={`text-4xl font-black ${currentStreak > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
            {currentStreak}
          </div>
          <div className="text-xs text-slate-400 font-medium">day{currentStreak !== 1 ? 's' : ''}</div>
        </div>
        <div className="mb-1 pb-0.5 border-l border-slate-100 pl-4">
          <div className="flex items-center gap-1 text-amber-500 mb-0.5">
            <Trophy size={12} />
            <span className="text-xs font-bold text-slate-700">{longestStreak}</span>
          </div>
          <div className="text-xs text-slate-400">best</div>
        </div>
      </div>

      {/* 7-day dots */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              dotActive[i]
                ? i === todayIdx
                  ? 'bg-orange-500 shadow-sm shadow-orange-200'
                  : 'bg-amber-400'
                : 'bg-slate-100'
            }`}>
              {dotActive[i] && <Zap size={12} className="text-white" />}
            </div>
            <span className="text-[10px] font-medium text-slate-400">{d}</span>
          </div>
        ))}
      </div>

      {/* Streak Freeze section */}
      <div className="border-t border-slate-100 pt-3">
        {freezeState === 'done' ? (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
            <Snowflake size={13} />
            {freezeMsg}
          </div>
        ) : streakAtRisk && !solvedToday && localFreezes > 0 && freezeAvailable ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <Snowflake size={13} className="text-blue-400" />
              Streak at risk — use a freeze?
            </div>
            <button
              onClick={applyFreeze}
              disabled={freezeState === 'loading'}
              className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {freezeState === 'loading' ? '…' : `Use Freeze (${localFreezes})`}
            </button>
          </div>
        ) : freezeState === 'error' ? (
          <div className="text-xs text-red-500">{freezeMsg}</div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Snowflake size={12} className={localFreezes > 0 ? 'text-blue-400' : 'text-slate-300'} />
            {localFreezes > 0
              ? `${localFreezes} streak freeze${localFreezes !== 1 ? 's' : ''} available`
              : nextFreezeIn > 0
                ? `Next freeze in ${nextFreezeIn} day${nextFreezeIn !== 1 ? 's' : ''}`
                : 'No freezes available'}
          </div>
        )}
      </div>
    </div>
  )
}
