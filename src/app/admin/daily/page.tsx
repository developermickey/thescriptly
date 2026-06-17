import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Zap } from 'lucide-react'
import { DailyPinManager } from './DailyPinManager'

export default async function AdminDailyPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') redirect('/dashboard')

  const today = new Date().toISOString().slice(0, 10)

  const [questions, pins] = await Promise.all([
    prisma.practiceQuestion.findMany({
      select:  { id: true, title: true, difficulty: true, topic: true },
      orderBy: [{ topic: 'asc' }, { difficulty: 'asc' }, { title: 'asc' }],
    }),
    prisma.dailyPin.findMany({
      where:   { date: { gte: today } },
      orderBy: { date: 'asc' },
      include: { question: { select: { id: true, title: true, difficulty: true } } },
    }),
  ])

  // Seed-based today's problem (if not pinned)
  const seed  = today.split('-').reduce((acc, n) => acc + parseInt(n), 0)
  const skip  = questions.length > 0 ? seed % questions.length : 0
  const autoQ = questions[skip] ?? null

  const todayPin = pins.find(p => p.date === today) ?? null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Zap size={20} className="text-amber-500" /> Daily Challenge
        </h1>
        <p className="text-sm text-slate-500 mt-1">Pin specific problems as the daily challenge for any date</p>
      </div>

      <DailyPinManager
        questions={questions}
        pins={pins.map(p => ({ date: p.date, question: p.question }))}
        today={today}
        todayPin={todayPin ? { date: todayPin.date, question: todayPin.question } : null}
        autoQuestion={autoQ}
      />
    </div>
  )
}
