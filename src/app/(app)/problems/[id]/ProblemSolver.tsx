'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Play, Send, ChevronDown, CheckCircle, XCircle, Clock,
  Lightbulb, BookOpen, Eye, EyeOff, Bookmark, MessageSquare,
  Building2, CornerDownRight, Loader2, Save, History, Users, StickyNote,
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import { DifficultyVote } from '@/components/DifficultyVote'
import { ReportProblem } from '@/components/ReportProblem'
import { CommunitySolutions } from '@/components/CommunitySolutions'
import { Confetti } from '@/components/Confetti'
import { ProblemTimer } from '@/components/ProblemTimer'
import { ProblemNote } from '@/components/ProblemNote'
import { AddToList } from '@/components/AddToList'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const LANGS = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'python',     label: 'Python',     monaco: 'python' },
  { id: 'java',       label: 'Java',       monaco: 'java' },
  { id: 'cpp',        label: 'C++',        monaco: 'cpp' },
]

interface Question {
  id: number; title: string; difficulty: string; topic: string | null
  company: string | null; problemStatement: string | null
  examples: string | null; constraints: string | null
  hints: string | null; solutionExplanation: string | null
  timeComplexity: string | null; spaceComplexity: string | null
  starterCodeJs: string | null; starterCodePython: string | null
  starterCodeJava: string | null; starterCodeCpp: string | null
}

interface RelatedProblem {
  id: number; title: string; difficulty: string; solved: boolean
}

interface Props {
  question: Question
  userId: number
  initialSolved: boolean
  initialBookmarked: boolean
  related?: RelatedProblem[]
}

interface Comment {
  id: number; body: string; createdAt: string; likes: number
  user:    { id: number; name: string }
  likedBy: { userId: number }[]
  replies: Comment[]
}

export function ProblemSolver({ question, userId, initialSolved, initialBookmarked, related = [] }: Props) {
  const [lang, setLang]           = useState('javascript')
  const [output, setOutput]       = useState<any>(null)
  const [running, setRunning]     = useState(false)
  const [tab, setTab]             = useState<'problem' | 'hints' | 'solution' | 'discuss' | 'submissions' | 'solutions' | 'notes'>('problem')
  const [solved, setSolved]         = useState(initialSolved)
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [hintsRevealed, setHints]   = useState(0)
  const [showSolution, setShowSol]  = useState(false)
  const [comments, setComments]     = useState<Comment[]>([])
  const [commLoading, setCommLoad]  = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo]       = useState<number | null>(null)
  const [replyText, setReplyText]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [hintsList, setHintsList]   = useState<string[]>([])
  const [hintsLoaded, setHLoaded]   = useState(false)
  const [mySubmissions, setMySubs]  = useState<any[]>([])
  const [subsLoaded, setSubsLoaded] = useState(false)
  const [selectedSub, setSelSub]    = useState<any>(null)
  const [confetti,   setConfetti]   = useState(false)
  const draftTimer = useRef<any>(null)
  const { toast } = useToast()

  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [editorFontSize, setEditorFontSize] = useState(14)
  useEffect(() => {
    try {
      const s = localStorage.getItem('codex_settings')
      if (s) {
        const p = JSON.parse(s)
        if (p.editorTheme) setEditorTheme(p.editorTheme)
        if (p.fontSize)    setEditorFontSize(parseInt(p.fontSize))
      }
    } catch {}
  }, [])

  // Load user's own past submissions for this problem
  useEffect(() => {
    if (tab !== 'submissions' || subsLoaded) return
    fetch(`/api/problems/${question.id}/my-submissions`)
      .then(r => r.json())
      .then((data: any[]) => { setMySubs(data); setSubsLoaded(true) })
      .catch(() => setSubsLoaded(true))
  }, [tab, question.id, subsLoaded])

  // Load structured hints from API (falls back to legacy string field server-side)
  useEffect(() => {
    if (tab !== 'hints' || hintsLoaded) return
    fetch(`/api/problems/${question.id}/hints`)
      .then(r => r.json())
      .then((data: { hints: { body: string }[] }) => {
        setHintsList(data.hints.map((h: { body: string }) => h.body))
        setHLoaded(true)
      })
      .catch(() => setHLoaded(true))
  }, [tab, question.id, hintsLoaded])

  const starterMap: Record<string, string | null> = {
    javascript: question.starterCodeJs,
    python:     question.starterCodePython,
    java:       question.starterCodeJava,
    cpp:        question.starterCodeCpp,
  }
  const [code, setCode] = useState(starterMap['javascript'] || '// Write your solution here\n')

  // Load saved draft on mount
  useEffect(() => {
    // Load saved draft for the initial language on mount only
    fetch(`/api/problems/draft?problemId=${question.id}&language=${lang}`)
      .then(r => r.json())
      .then(d => { if (d.code) setCode(d.code) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]) // intentionally omit lang — lang switch is handled by handleLangChange

  const saveDraft = useCallback((currentCode: string, currentLang: string) => {
    clearTimeout(draftTimer.current)
    setSaveStatus('saving')
    draftTimer.current = setTimeout(async () => {
      await fetch('/api/problems/draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: question.id, language: currentLang, code: currentCode }),
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1500)
  }, [question.id])

  function handleCodeChange(v: string) {
    setCode(v)
    saveDraft(v, lang)
  }

  async function handleLangChange(newLang: string) {
    setLang(newLang)
    setOutput(null)
    // Try to load saved draft for this language
    const res  = await fetch(`/api/problems/draft?problemId=${question.id}&language=${newLang}`)
    const data = await res.json()
    setCode(data.code ?? starterMap[newLang] ?? '// Write your solution here\n')
  }

  async function run(submit: boolean) {
    setRunning(true); setOutput(null)
    try {
      const res  = await fetch('/api/problems/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, language: lang, code, submit }),
      })
      const data = await res.json()
      setOutput(data)
      if (data.status === 'accepted') {
        if (!solved) {
          setConfetti(true)
          setTimeout(() => setConfetti(false), 4500)
        }
        setSolved(true)
        setSubsLoaded(false) // refresh my submissions tab
        if (data.newBadges?.length) {
          data.newBadges.forEach((b: any) => toast(`Badge unlocked: ${b.badgeName}!`, 'success'))
        }
      }
    } catch {
      setOutput({ error: 'Network error.' })
    } finally {
      setRunning(false)
    }
  }

  async function toggleBookmark() {
    const res  = await fetch('/api/problems/bookmark', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId: question.id }),
    })
    const data = await res.json()
    setBookmarked(data.bookmarked)
  }

  async function loadComments() {
    setCommLoad(true)
    const res  = await fetch(`/api/problems/${question.id}/comments`)
    setComments(await res.json())
    setCommLoad(false)
  }

  useEffect(() => {
    if (tab === 'discuss') loadComments()
  }, [tab])

  async function postComment(body: string, parentId: number | null = null) {
    if (!body.trim()) return
    setSubmitting(true)
    const res  = await fetch(`/api/problems/${question.id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, parentId }),
    })
    if (res.ok) {
      setNewComment(''); setReplyText(''); setReplyTo(null)
      await loadComments()
    }
    setSubmitting(false)
  }

  async function likeComment(commentId: number) {
    await fetch(`/api/problems/${question.id}/comments/${commentId}/like`, { method: 'POST' })
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const wasLiked = c.likedBy.some(l => l.userId === userId)
        return {
          ...c,
          likes:   wasLiked ? c.likes - 1 : c.likes + 1,
          likedBy: wasLiked ? c.likedBy.filter(l => l.userId !== userId) : [...c.likedBy, { userId }],
        }
      }
      return c
    }))
  }

  const monacoLang = LANGS.find(l => l.id === lang)?.monaco || 'javascript'

  const tabs = [
    { id: 'problem',     label: 'Problem',     icon: BookOpen },
    { id: 'hints',       label: hintsList.length ? `Hints (${hintsList.length})` : 'Hints', icon: Lightbulb },
    { id: 'solution',    label: 'Solution',    icon: Eye },
    { id: 'submissions', label: mySubmissions.length ? `My (${mySubmissions.length})` : 'My Subs', icon: History },
    { id: 'solutions',   label: 'Solutions',   icon: Users },
    { id: 'discuss',     label: 'Discuss',     icon: MessageSquare },
    { id: 'notes',       label: 'Notes',       icon: StickyNote },
  ] as const

  return (
    <div className="flex-1 flex overflow-hidden">
      <Confetti active={confetti} />
      {/* ── LEFT PANEL ── */}
      <div className="w-[42%] flex flex-col border-r border-slate-200 overflow-hidden">
        {/* Tabs + bookmark */}
        <div className="flex items-center border-b border-slate-200 bg-white shrink-0">
          <div className="flex flex-1 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <t.icon size={12} />{t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 px-2 shrink-0">
            <AddToList questionId={question.id} />
            <button
              onClick={toggleBookmark}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
              className={`p-2 rounded-lg transition-colors ${bookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
            >
              <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* PROBLEM */}
          {tab === 'problem' && (
            <div className="space-y-5">
              {question.company && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Building2 size={12} className="text-slate-400" />
                  Asked at: <span className="font-semibold text-slate-700">{question.company}</span>
                </div>
              )}
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-2">Problem Statement</h2>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{question.problemStatement || 'No statement.'}</p>
              </div>
              {question.examples && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Examples</h3>
                  <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{question.examples}</pre>
                </div>
              )}
              {question.constraints && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Constraints</h3>
                  <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap">{question.constraints}</pre>
                </div>
              )}
              {(question.timeComplexity || question.spaceComplexity) && (
                <div className="grid grid-cols-2 gap-3">
                  {question.timeComplexity && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Time</p>
                      <code className="text-sm font-mono text-blue-900 font-bold">{question.timeComplexity}</code>
                    </div>
                  )}
                  {question.spaceComplexity && (
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-1">Space</p>
                      <code className="text-sm font-mono text-violet-900 font-bold">{question.spaceComplexity}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Related problems */}
              <DifficultyVote questionId={question.id} />

              <div className="flex justify-end pt-1">
                <ReportProblem questionId={question.id} />
              </div>

              {related.length > 0 && (
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Related Problems</h3>
                  <div className="space-y-2">
                    {related.map(r => {
                      const diffCls = r.difficulty === 'Easy' ? 'text-emerald-600' : r.difficulty === 'Hard' ? 'text-red-500' : 'text-amber-600'
                      return (
                        <a
                          key={r.id}
                          href={`/problems/${r.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
                        >
                          <span className={`text-xs font-bold ${diffCls} w-14 shrink-0`}>{r.difficulty}</span>
                          <span className="text-sm text-slate-700 group-hover:text-blue-700 font-medium flex-1 truncate">{r.title}</span>
                          {r.solved && <CheckCircle size={13} className="text-emerald-500 shrink-0" />}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HINTS */}
          {tab === 'hints' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Hints</h2>
                {hintsList.length > 0 && <span className="text-xs text-slate-400">{hintsRevealed} / {hintsList.length} revealed</span>}
              </div>
              {!hintsLoaded
                ? <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-slate-300" /></div>
                : hintsList.length === 0
                ? <p className="text-sm text-slate-400">No hints for this problem.</p>
                : (
                  <>
                    <div className="space-y-3">
                      {hintsList.slice(0, hintsRevealed).map((hint, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fadeIn">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <p className="text-sm text-amber-900 leading-relaxed">{hint}</p>
                        </div>
                      ))}
                    </div>
                    {hintsRevealed < hintsList.length
                      ? (
                        <button
                          onClick={() => setHints(h => h + 1)}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-300 rounded-xl text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Lightbulb size={14} />
                          {hintsRevealed === 0 ? 'Reveal first hint' : 'Reveal next hint'}
                        </button>
                      ) : <p className="text-center text-xs text-slate-400 py-2">All hints revealed. You&apos;ve got this!</p>}
                  </>
                )}
            </div>
          )}

          {/* SOLUTION */}
          {tab === 'solution' && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Solution Explanation</h2>
              {!question.solutionExplanation
                ? <p className="text-sm text-slate-400">No explanation provided yet.</p>
                : !showSolution
                  ? (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <EyeOff size={22} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Solution is hidden</p>
                      <p className="text-xs text-slate-400 mb-5 max-w-xs mx-auto">Try to solve it first — that&apos;s how real interviews work.</p>
                      <button onClick={() => setShowSol(true)} className="flex items-center gap-2 mx-auto bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors">
                        <Eye size={14} /> Show anyway
                      </button>
                      {solved && <p className="text-xs text-emerald-600 mt-3 font-semibold">✓ You solved this — you&apos;ve earned it!</p>}
                    </div>
                  ) : (
                    <div className="animate-fadeIn">
                      {solved && (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4 text-sm font-semibold">
                          <CheckCircle size={14} /> You solved this problem!
                        </div>
                      )}
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{question.solutionExplanation}</p>
                    </div>
                  )}
            </div>
          )}

          {/* MY SUBMISSIONS */}
          {tab === 'submissions' && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4">My Submissions</h2>
              {!subsLoaded ? (
                <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-slate-300" /></div>
              ) : mySubmissions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-semibold">No submissions yet</p>
                  <p className="text-xs mt-1">Submit your code to see results here.</p>
                </div>
              ) : selectedSub ? (
                <div className="animate-fadeIn">
                  <button onClick={() => setSelSub(null)} className="text-xs text-blue-600 hover:underline font-semibold mb-3 flex items-center gap-1">
                    ← Back to list
                  </button>
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4 ${
                    selectedSub.status === 'accepted'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-red-50 text-red-500 border border-red-200'
                  }`}>
                    {selectedSub.status === 'accepted' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {selectedSub.status}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <span className="capitalize font-semibold text-slate-600">{selectedSub.language}</span>
                    <span>{new Date(selectedSub.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {selectedSub.runtimeMs && <span className="flex items-center gap-1"><Clock size={11} />{selectedSub.runtimeMs}ms</span>}
                  </div>
                  <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {selectedSub.code}
                  </pre>
                  {selectedSub.results && (
                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Results</p>
                      <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap">{JSON.stringify(selectedSub.results, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {mySubmissions.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setSelSub(s)}
                      className="w-full flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left group"
                    >
                      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                        s.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-red-50 text-red-500 border-red-200'
                      }`}>
                        {s.status === 'accepted' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {s.status}
                      </span>
                      <span className="text-xs capitalize font-semibold text-slate-600">{s.language}</span>
                      <span className="flex-1 text-xs text-slate-400 text-right">
                        {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {s.runtimeMs && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock size={10} />{s.runtimeMs}ms
                        </span>
                      )}
                      <span className="text-slate-300 group-hover:text-blue-400 text-xs">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMMUNITY SOLUTIONS */}
          {tab === 'solutions' && (
            <CommunitySolutions questionId={question.id} currentLang={lang} currentCode={code} />
          )}

          {/* DISCUSS */}
          {tab === 'discuss' && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4">Discussion</h2>

              {/* New comment */}
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Share your approach, ask a question…"
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => postComment(newComment)}
                    disabled={!newComment.trim() || submitting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Post
                  </button>
                </div>
              </div>

              {/* Comments */}
              {commLoading
                ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
                : comments.length === 0
                  ? <p className="text-sm text-slate-400 text-center py-8">No comments yet. Be the first!</p>
                  : (
                    <div className="space-y-4">
                      {comments.map(c => (
                        <div key={c.id} className="border border-slate-100 rounded-xl overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {c.user.name[0]?.toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{c.user.name}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                onClick={() => likeComment(c.id)}
                                className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                                  c.likedBy?.some(l => l.userId === userId) ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'
                                }`}
                              >
                                👍 {c.likes > 0 ? c.likes : ''}
                              </button>
                              <button
                                onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                                className="text-xs text-slate-400 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors"
                              >
                                <CornerDownRight size={11} /> Reply
                              </button>
                            </div>

                            {replyTo === c.id && (
                              <div className="mt-3 pl-4 border-l-2 border-blue-200">
                                <textarea
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  placeholder="Write a reply…"
                                  rows={2}
                                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => postComment(replyText, c.id)}
                                    disabled={!replyText.trim() || submitting}
                                    className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                                  >
                                    <Send size={11} /> Reply
                                  </button>
                                  <button onClick={() => { setReplyTo(null); setReplyText('') }} className="text-xs text-slate-400 hover:text-slate-600 px-2">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {c.replies.length > 0 && (
                            <div className="border-t border-slate-50 bg-slate-50 divide-y divide-slate-100">
                              {c.replies.map(r => (
                                <div key={r.id} className="px-4 py-3 pl-8">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                      {r.user.name[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{r.user.name}</span>
                                    <span className="text-xs text-slate-400">
                                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{r.body}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          )}

          {/* NOTES */}
          {tab === 'notes' && (
            <ProblemNote questionId={question.id} />
          )}
        </div>
      </div>

      {/* ── RIGHT: EDITOR ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#1e293b]">
        <div className="h-11 flex items-center gap-3 px-4 border-b border-slate-700 shrink-0">
          <div className="relative">
            <select
              value={lang}
              onChange={e => handleLangChange(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ProblemTimer />
            {saveStatus !== 'idle' && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                {saveStatus === 'saving'
                  ? <><Loader2 size={11} className="animate-spin" /> Saving…</>
                  : <><Save size={11} className="text-emerald-500" /> Saved</>}
              </span>
            )}
            <button onClick={() => run(false)} disabled={running} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors">
              <Play size={12} /> Run
            </button>
            <button onClick={() => run(true)} disabled={running} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors shadow-sm shadow-blue-900">
              <Send size={12} /> Submit
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="100%"
            language={monacoLang}
            value={code}
            onChange={v => handleCodeChange(v || '')}
            theme={editorTheme}
            options={{
              fontSize: editorFontSize, lineHeight: editorFontSize + 8,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true, minimap: { enabled: false },
              scrollBeyondLastLine: false, padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'gutter', smoothScrolling: true,
              cursorBlinking: 'smooth', tabSize: 2,
            }}
          />
        </div>

        {(output || running) && (
          <div className="shrink-0 border-t border-slate-700 bg-slate-900 max-h-52 overflow-y-auto">
            <div className="p-4">
              {running ? (
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <svg className="animate-spin w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Executing code...
                </div>
              ) : output?.error ? (
                <p className="text-red-400 text-sm font-mono">{output.error}</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {output?.status === 'accepted'
                      ? <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm"><CheckCircle size={15} /> Accepted</span>
                      : <span className="flex items-center gap-1.5 text-red-400 font-bold text-sm"><XCircle size={15} /> {output?.status || 'Failed'}</span>}
                    {output?.runtime_ms && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11} /> {output.runtime_ms}ms</span>}
                  </div>
                  {output?.stdout && <pre className="text-xs text-slate-300 font-mono bg-slate-800 rounded-lg p-3 whitespace-pre-wrap">{output.stdout}</pre>}
                  {output?.stderr && <pre className="text-xs text-red-400 font-mono bg-red-950/30 rounded-lg p-3 whitespace-pre-wrap">{output.stderr}</pre>}
                  {output?.message && <p className="text-xs text-slate-400">{output.message}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
