'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Award, X, GraduationCap, Star } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import { Confetti } from '@/components/Confetti'

interface Props {
  lessonId: number
  courseId: number
  done: boolean
  nextLessonId?: number | null
  compact?: boolean
}

export function MarkCompleteButton({ lessonId, courseId, done: initialDone, nextLessonId, compact }: Props) {
  const router    = useRouter()
  const { toast } = useToast()
  const [done, setDone]         = useState(initialDone)
  const [loading, setLoading]   = useState(false)
  const [cert, setCert]         = useState<{ code: string } | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [newBadges, setNewBadges] = useState<{ slug: string; name: string; emoji: string }[]>([])

  async function handleComplete() {
    if (done || loading) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/lessons/${lessonId}/complete`, { method: 'POST' })
      const data = await res.json()
      setDone(true)
      router.refresh()

      if (data.newBadges?.length) {
        setNewBadges(data.newBadges)
        setTimeout(() => setNewBadges([]), 5000)
      }

      if (data.certificate?.code) {
        setConfetti(true)
        setCert({ code: data.certificate.code })
        setTimeout(() => setConfetti(false), 4000)
      } else if (nextLessonId) {
        toast('Lesson complete! Moving to next… →')
        setTimeout(() => router.push(`/lessons/${nextLessonId}`), 1200)
      } else {
        toast('Lesson marked complete! 🎉')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Confetti active={confetti} />

      {/* Badge award toasts */}
      {newBadges.length > 0 && (
        <div className="fixed bottom-20 right-5 flex flex-col gap-2 z-50">
          {newBadges.map(b => (
            <div
              key={b.slug}
              className="flex items-center gap-3 bg-white border border-amber-200 shadow-xl rounded-xl px-4 py-3 animate-fadeIn"
            >
              <span className="text-2xl">{b.emoji}</span>
              <div>
                <p className="text-xs text-amber-600 font-bold flex items-center gap-1">
                  <Star size={10} /> Badge Earned!
                </p>
                <p className="text-sm font-bold text-slate-800">{b.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleComplete}
        disabled={done || loading}
        className={`flex items-center gap-2 rounded-xl font-bold transition-all ${
          compact
            ? 'px-3 py-1.5 text-xs'
            : 'px-5 py-2.5 text-sm'
        } ${
          done
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 disabled:opacity-60'
        }`}
      >
        {loading
          ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : <CheckCircle size={compact ? 13 : 15} />}
        {done ? (compact ? '✓ Done' : 'Completed ✓') : (compact ? 'Complete' : 'Mark Complete')}
      </button>

      {cert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative animate-fadeIn">
            <button onClick={() => setCert(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>

            <div className="relative inline-block mb-5">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-xl shadow-amber-200 animate-bounce">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">Course Complete!</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Incredible work! You&apos;ve completed the entire course and earned a certificate.
            </p>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award size={14} className="text-amber-600" />
                <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Certificate ID</p>
              </div>
              <code className="text-base font-mono font-bold text-slate-800 tracking-widest">{cert.code}</code>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCert(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Keep Learning
              </button>
              <Link
                href="/certificates"
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition-opacity text-center"
              >
                View Certificate
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
