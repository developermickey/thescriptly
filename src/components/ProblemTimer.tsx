'use client'
import { useState, useEffect, useRef } from 'react'
import { Timer, RotateCcw, Pause, Play } from 'lucide-react'

function fmt(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ProblemTimer() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  function reset() {
    setSeconds(0)
    setRunning(true)
  }

  const over30 = seconds >= 1800 // 30 min — soft warning
  const over60 = seconds >= 3600 // 60 min — harder warning

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors ${
      over60  ? 'bg-red-50 border-red-200 text-red-600' :
      over30  ? 'bg-amber-50 border-amber-200 text-amber-600' :
      running ? 'bg-slate-50 border-slate-200 text-slate-600' :
                'bg-slate-50 border-slate-200 text-slate-400'
    }`}>
      <Timer size={12} />
      <span className="tabular-nums">{fmt(seconds)}</span>
      <button
        onClick={() => setRunning(r => !r)}
        title={running ? 'Pause' : 'Resume'}
        className="ml-0.5 hover:opacity-70 transition-opacity"
      >
        {running ? <Pause size={10} /> : <Play size={10} />}
      </button>
      <button
        onClick={reset}
        title="Reset timer"
        className="hover:opacity-70 transition-opacity"
      >
        <RotateCcw size={10} />
      </button>
    </div>
  )
}
