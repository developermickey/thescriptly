'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Swords, Play, Send, ChevronDown, Clock, CheckCircle, XCircle, RotateCcw, Trophy, AlertTriangle, History, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const LANGS = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'python',     label: 'Python',     monaco: 'python' },
  { id: 'java',       label: 'Java',       monaco: 'java' },
  { id: 'cpp',        label: 'C++',        monaco: 'cpp' },
]

const DURATIONS = [
  { label: '20 min', value: 1200 },
  { label: '30 min', value: 1800 },
  { label: '45 min', value: 2700 },
  { label: '60 min', value: 3600 },
]

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-400',
  Medium: 'text-amber-400',
  Hard:   'text-red-400',
}

const DIFF_BADGE: Record<string, string> = {
  Easy:   'text-emerald-700 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-700 bg-amber-50 border-amber-200',
  Hard:   'text-red-600 bg-red-50 border-red-200',
}

interface Props {
  counts: { easy: number; medium: number; hard: number }
  userId: number
}

interface SessionRecord {
  id: number
  difficulty: string
  language: string
  elapsedSecs: number
  durationSecs: number
  solved: boolean
  score: number
  grade: string
  createdAt: string
  question: { title: string; difficulty: string; topic: string | null }
}

type Phase = 'setup' | 'active' | 'done'

function calcScore(solved: boolean, elapsed: number, duration: number, difficulty: string) {
  const diffMult   = difficulty === 'Hard' ? 1.5 : difficulty === 'Medium' ? 1.2 : 1
  const speedBonus = solved ? Math.round(Math.max(0, 50 * (1 - elapsed / duration))) : 0
  const rawScore   = solved ? Math.round((100 + speedBonus) * diffMult) : Math.round((elapsed / duration) * 30)
  return { score: Math.min(rawScore, 200), speedBonus }
}

function gradeLabel(score: number) {
  if (score >= 150) return { label: 'Exceptional', color: 'text-violet-600',  bg: 'bg-violet-50' }
  if (score >= 120) return { label: 'Excellent',   color: 'text-emerald-600', bg: 'bg-emerald-50' }
  if (score >= 90)  return { label: 'Good',        color: 'text-blue-600',    bg: 'bg-blue-50' }
  if (score >= 50)  return { label: 'Fair',        color: 'text-amber-600',   bg: 'bg-amber-50' }
  return               { label: 'Keep Trying',     color: 'text-slate-500',   bg: 'bg-slate-50' }
}

export function InterviewClient({ counts, userId }: Props) {
  const [phase,      setPhase]     = useState<Phase>('setup')
  const [difficulty, setDiff]      = useState('Medium')
  const [duration,   setDuration]  = useState(1800)
  const [lang,       setLang]      = useState('javascript')
  const [problem,    setProblem]   = useState<any>(null)
  const [code,       setCode]      = useState('')
  const [timeLeft,   setTimeLeft]  = useState(0)
  const [output,     setOutput]    = useState<any>(null)
  const [running,    setRunning]   = useState(false)
  const [solved,     setSolved]    = useState(false)
  const [loading,    setLoading]   = useState(false)
  const [pastSessions, setPast]    = useState<SessionRecord[]>([])
  const [showHistory, setShowHist] = useState(false)
  const [histLoading, setHistLoad] = useState(false)
  const timerRef   = useRef<any>(null)
  const elapsedRef = useRef(0)   // track elapsed even after state freeze

  const starterMap: Record<string, string | null> = {
    javascript: problem?.starterCodeJs,
    python:     problem?.starterCodePython,
    java:       problem?.starterCodeJava,
    cpp:        problem?.starterCodeCpp,
  }

  function handleLangChange(newLang: string) {
    setLang(newLang)
    setCode(starterMap[newLang] || '// Write your solution here\n')
  }

  const endInterview = useCallback((isSolved: boolean = false) => {
    clearInterval(timerRef.current)
    setPhase('done')
  }, [])

  async function saveSession(isSolved: boolean, elapsed: number) {
    if (!problem || isNaN(userId) || userId < 0) return
    const { score } = calcScore(isSolved, elapsed, duration, problem.difficulty)
    const grade     = gradeLabel(score).label
    await fetch('/api/interview/sessions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        questionId:   problem.id,
        difficulty:   problem.difficulty,
        language:     lang,
        durationSecs: duration,
        elapsedSecs:  elapsed,
        solved:       isSolved,
        score,
        grade,
      }),
    })
  }

  async function startInterview() {
    setLoading(true)
    const res  = await fetch(`/api/interview/random?difficulty=${difficulty}`)
    const data = await res.json()
    setLoading(false)
    if (!data || data.error) return

    setProblem(data)
    setCode(data.starterCodeJs || '// Write your solution here\n')
    setLang('javascript')
    setTimeLeft(duration)
    elapsedRef.current = 0
    setSolved(false)
    setOutput(null)
    setPhase('active')

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          saveSession(false, elapsedRef.current)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  async function loadHistory() {
    setHistLoad(true)
    const res  = await fetch('/api/interview/sessions')
    const data = await res.json()
    setPast(Array.isArray(data) ? data : [])
    setHistLoad(false)
    setShowHist(true)
  }

  async function run(submit: boolean) {
    if (!problem) return
    setRunning(true)
    setOutput(null)
    try {
      const res  = await fetch('/api/problems/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ questionId: problem.id, language: lang, code, submit }),
      })
      const data = await res.json()
      setOutput(data)
      if (data.status === 'accepted') {
        setSolved(true)
        if (submit) {
          clearInterval(timerRef.current)
          await saveSession(true, elapsedRef.current)
          setPhase('done')
        }
      }
    } finally {
      setRunning(false)
    }
  }

  const mins   = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs   = String(timeLeft % 60).padStart(2, '0')
  const pct    = problem ? Math.round((timeLeft / duration) * 100) : 100
  const urgent = timeLeft < 300 && timeLeft > 0

  // ── SETUP SCREEN ─────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg space-y-4 animate-fadeIn">
          {/* Main card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
                <Swords size={22} className="text-violet-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Mock Interview</h1>
                <p className="text-sm text-slate-500">Simulate a real coding interview</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                    <button key={d} onClick={() => setDiff(d)}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        difficulty === d
                          ? d === 'Easy'   ? 'bg-emerald-500 border-emerald-500 text-white'
                          : d === 'Medium' ? 'bg-amber-500 border-amber-500 text-white'
                          :                  'bg-red-500 border-red-500 text-white'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >{d}</button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{counts.easy} easy · {counts.medium} medium · {counts.hard} hard</p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Time Limit</label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map(d => (
                    <button key={d.value} onClick={() => setDuration(d.value)}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        duration === d.value ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >{d.label}</button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Language</label>
                <div className="grid grid-cols-4 gap-2">
                  {LANGS.map(l => (
                    <button key={l.id} onClick={() => setLang(l.id)}
                      className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        lang === l.id ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >{l.label}</button>
                  ))}
                </div>
              </div>

              <button onClick={startInterview} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading…</>
                  : <><Swords size={16} /> Start Interview</>}
              </button>
            </div>
          </div>

          {/* Past sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <History size={14} className="text-slate-400" /> Past Sessions
              </h2>
              {!showHistory && (
                <button onClick={loadHistory} disabled={histLoading}
                  className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  {histLoading ? 'Loading…' : 'Load history'}
                </button>
              )}
            </div>

            {showHistory && (
              pastSessions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No sessions yet. Start your first interview!</p>
              ) : (
                <div className="space-y-2">
                  {pastSessions.map(s => {
                    const grade = gradeLabel(s.score)
                    const mins  = Math.floor(s.elapsedSecs / 60)
                    const secs  = s.elapsedSecs % 60
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.solved ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                          {s.solved ? <CheckCircle size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.question.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_BADGE[s.difficulty] ?? ''}`}>{s.difficulty}</span>
                            <span className="text-[10px] text-slate-400">{s.language} · {mins}m {secs}s</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${grade.color}`}>{s.score}</p>
                          <p className="text-[10px] text-slate-400">{s.grade}</p>
                        </div>
                      </div>
                    )
                  })}

                  {/* Summary */}
                  {pastSessions.length > 0 && (() => {
                    const solvedCount = pastSessions.filter(s => s.solved).length
                    const avgScore    = Math.round(pastSessions.reduce((a, s) => a + s.score, 0) / pastSessions.length)
                    const bestScore   = Math.max(...pastSessions.map(s => s.score))
                    return (
                      <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2">
                        {[
                          { label: 'Passed', value: `${solvedCount}/${pastSessions.length}`, color: 'text-emerald-600' },
                          { label: 'Avg Score', value: avgScore, color: 'text-blue-600' },
                          { label: 'Best Score', value: bestScore, color: 'text-violet-600' },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── DONE SCREEN ──────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const elapsed    = elapsedRef.current
    const elapsedMin = Math.floor(elapsed / 60)
    const elapsedSec = elapsed % 60
    const { score, speedBonus } = calcScore(solved, elapsed, duration, problem?.difficulty ?? 'Medium')
    const grade = gradeLabel(score)

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-sm w-full text-center animate-fadeIn">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 ${solved ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            {solved ? <Trophy className="w-10 h-10 text-emerald-500" /> : <AlertTriangle className="w-10 h-10 text-slate-400" />}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {solved ? 'Interview Passed! 🎉' : "Time's Up"}
          </h2>
          <p className="text-slate-500 text-sm mb-5">
            {solved
              ? `Solved "${problem?.title}" in ${elapsedMin}m ${elapsedSec}s`
              : `Worked on "${problem?.title}" for ${elapsedMin}m ${elapsedSec}s`}
          </p>

          <div className={`${grade.bg} rounded-2xl p-5 mb-5`}>
            <p className={`text-5xl font-bold ${grade.color} mb-1`}>{score}</p>
            <p className={`text-sm font-bold ${grade.color}`}>{grade.label}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className={`text-base font-bold ${DIFF_COLOR[problem?.difficulty] || 'text-slate-700'}`}>{problem?.difficulty}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Difficulty</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-base font-bold text-slate-800">{elapsedMin}m {elapsedSec}s</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Time used</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-base font-bold text-amber-600">+{speedBonus}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Speed bonus</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setPhase('setup'); setProblem(null); setOutput(null) }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw size={14} /> New Interview
            </button>
            <Link
              href={`/problems/${problem?.id}`}
              className="flex-1 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white text-center hover:bg-blue-700 transition-colors"
            >
              View Problem
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── ACTIVE INTERVIEW ─────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className={`h-12 flex items-center px-4 gap-4 shrink-0 border-b ${urgent ? 'bg-red-950 border-red-800' : 'bg-slate-900 border-slate-700'}`}>
        <div className="flex items-center gap-2">
          <Swords size={15} className={urgent ? 'text-red-400' : 'text-violet-400'} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mock Interview</span>
        </div>
        <span className="text-slate-700">|</span>
        <span className="text-sm font-semibold text-slate-200 truncate max-w-[220px]">{problem?.title}</span>
        <span className={`text-xs font-bold ${DIFF_COLOR[problem?.difficulty] || ''}`}>{problem?.difficulty}</span>
        <div className={`ml-auto flex items-center gap-2 ${urgent ? 'text-red-400' : 'text-slate-300'}`}>
          <Clock size={14} />
          <span className={`font-mono font-bold text-lg tabular-nums ${urgent ? 'animate-pulse' : ''}`}>
            {mins}:{secs}
          </span>
        </div>
        <button
          onClick={() => { clearInterval(timerRef.current); saveSession(solved, elapsedRef.current); setPhase('done') }}
          className="ml-3 text-xs text-slate-500 hover:text-red-400 transition-colors font-semibold"
        >
          End
        </button>
      </div>

      <div className="h-0.5 bg-slate-800 shrink-0">
        <div className={`h-full transition-all duration-1000 ${urgent ? 'bg-red-500' : 'bg-violet-500'}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[42%] border-r border-slate-200 overflow-y-auto p-6 bg-white">
          <h2 className="text-base font-bold text-slate-900 mb-4">Problem Statement</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-5">{problem?.problemStatement}</p>
          {problem?.examples && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Examples</h3>
              <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{problem.examples}</pre>
            </div>
          )}
          {problem?.constraints && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Constraints</h3>
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-700 whitespace-pre-wrap">{problem.constraints}</pre>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e293b]">
          <div className="h-11 flex items-center gap-3 px-4 border-b border-slate-700 shrink-0">
            <div className="relative">
              <select value={lang} onChange={e => handleLangChange(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 cursor-pointer focus:outline-none"
              >
                {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => run(false)} disabled={running} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors">
                <Play size={12} /> Run
              </button>
              <button onClick={() => run(true)} disabled={running} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors">
                <Send size={12} /> Submit
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language={LANGS.find(l => l.id === lang)?.monaco || 'javascript'}
              value={code}
              onChange={v => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 14, lineHeight: 22,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false }, scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 }, tabSize: 2,
                cursorBlinking: 'smooth', smoothScrolling: true,
              }}
            />
          </div>

          {(output || running) && (
            <div className="shrink-0 border-t border-slate-700 bg-slate-900 max-h-44 overflow-y-auto">
              <div className="p-4">
                {running ? (
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Executing…
                  </div>
                ) : output?.error ? (
                  <p className="text-red-400 text-sm font-mono">{output.error}</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {output?.status === 'accepted'
                        ? <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm"><CheckCircle size={15} /> Accepted</span>
                        : <span className="flex items-center gap-1.5 text-red-400 font-bold text-sm"><XCircle size={15} /> {output?.status}</span>}
                    </div>
                    {output?.stdout && <pre className="text-xs text-slate-300 font-mono bg-slate-800 rounded-lg p-3 whitespace-pre-wrap">{output.stdout}</pre>}
                    {output?.stderr && <pre className="text-xs text-red-400 font-mono bg-red-950/30 rounded-lg p-3 whitespace-pre-wrap">{output.stderr}</pre>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
