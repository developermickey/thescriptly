'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, BookOpen, Code2, Smile, Briefcase, ChevronRight, Check } from 'lucide-react'

const SKILL_LEVELS = [
  {
    value: 'beginner',
    label: 'Beginner',
    desc: 'New to programming or just getting started',
    icon: '🌱',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    desc: 'Comfortable with the basics, want to level up',
    icon: '🚀',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    desc: 'Experienced dev sharpening interview skills',
    icon: '⚡',
  },
]

const GOALS = [
  { value: 'interviews', label: 'Crack interviews',   desc: 'Prepare for technical interviews at top companies', icon: Briefcase },
  { value: 'courses',    label: 'Learn new skills',   desc: 'Follow structured courses to build solid foundations', icon: BookOpen },
  { value: 'practice',   label: 'Stay sharp',         desc: 'Daily practice to keep coding skills fresh', icon: Code2 },
  { value: 'fun',        label: 'Just for fun',       desc: 'Explore problems at my own pace', icon: Smile },
]

interface Props {
  userName: string
}

export function OnboardingModal({ userName }: Props) {
  const router = useRouter()
  const [step,  setStep]  = useState<'skill' | 'goal' | 'done'>('skill')
  const [skill, setSkill] = useState('')
  const [goal,  setGoal]  = useState('')
  const [busy,  setBusy]  = useState(false)

  async function finish(selectedGoal: string) {
    setBusy(true)
    await fetch('/api/user/onboard', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ skillLevel: skill, learningGoal: selectedGoal }),
    })
    setStep('done')
    setTimeout(() => router.refresh(), 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-violet-600 px-8 py-8 text-center">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-white">Welcome, {userName.split(' ')[0]}!</h1>
          <p className="text-white/70 text-sm mt-2">Let's personalise your Codex experience. Takes 30 seconds.</p>
          {/* Steps */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {['skill', 'goal'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-white text-blue-600' :
                  (step === 'goal' && s === 'skill') || step === 'done' ? 'bg-white/30 text-white' : 'bg-white/20 text-white/60'
                }`}>
                  {((step === 'goal' && s === 'skill') || step === 'done') ? <Check size={12} /> : i + 1}
                </div>
                {i === 0 && <div className="w-8 h-0.5 bg-white/30 rounded-full" />}
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-7">
          {step === 'skill' && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-1">What's your experience level?</h2>
              <p className="text-sm text-slate-500 mb-5">We'll tailor problem recommendations to match.</p>
              <div className="space-y-3">
                {SKILL_LEVELS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSkill(s.value)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                      skill === s.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${skill === s.value ? 'text-blue-700' : 'text-slate-900'}`}>{s.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                    {skill === s.value && <Check size={16} className="text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => skill && setStep('goal')}
                disabled={!skill}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </>
          )}

          {step === 'goal' && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-1">What's your main goal?</h2>
              <p className="text-sm text-slate-500 mb-5">This helps us surface the right content.</p>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => { setGoal(g.value); finish(g.value) }}
                    disabled={busy}
                    className="flex flex-col items-start gap-2 p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-all disabled:opacity-50 group"
                  >
                    <g.icon size={20} className="text-blue-600" />
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{g.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{g.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">You're all set!</h2>
              <p className="text-sm text-slate-500">Loading your personalised dashboard…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
