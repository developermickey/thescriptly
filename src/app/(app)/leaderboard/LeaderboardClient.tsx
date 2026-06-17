'use client'
import { useState } from 'react'
import { Trophy, Flame, Star, Calendar, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

interface Leader {
  userId:  number
  name:    string
  score:   number
  solved:  number
  streak:  number
  badges:  number
}

interface Props {
  allTime: Leader[]
  weekly:  Leader[]
  streaks: Leader[]
  courses: Leader[]
  currentUserId: number
}

type Tab = 'alltime' | 'weekly' | 'streaks' | 'courses'

export function LeaderboardClient({ allTime, weekly, streaks, courses, currentUserId }: Props) {
  const [period, setPeriod] = useState<Tab>('alltime')
  const leaders = period === 'alltime' ? allTime : period === 'weekly' ? weekly : period === 'streaks' ? streaks : courses

  const top3    = leaders.slice(0, 3)
  const rest    = leaders.slice(3)
  const podiumOrder  = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3
  const podiumHeights = ['h-24', 'h-32', 'h-20']
  const podiumColors  = ['from-slate-400 to-slate-500', 'from-amber-400 to-yellow-500', 'from-orange-400 to-amber-500']
  const podiumLabels  = ['2nd', '1st', '3rd']
  const podiumRanks   = [1, 0, 2]

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fadeIn">
      <div className="mb-8 text-center">
        <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-7 h-7 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {period === 'streaks' ? 'Ranked by current streak' : period === 'courses' ? 'Ranked by certificates earned' : 'Ranked by weighted score (Easy×1 · Medium×2 · Hard×3)'}
        </p>

        {/* Period toggle */}
        <div className="flex items-center justify-center gap-1 mt-4 bg-slate-100 rounded-xl p-1 w-fit mx-auto">
          {([
            ['alltime', 'All Time',  null],
            ['weekly',  'This Week', <Calendar size={12} key="c" />],
            ['streaks', 'Streaks',   <Flame size={12} key="f" />],
            ['courses', 'Courses',   <BookOpen size={12} key="b" />],
          ] as [Tab, string, React.ReactNode][]).map(([v, label, icon]) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                period === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      {top3.length >= 2 && (
        <div className="flex items-end justify-center gap-3 mb-10 px-4">
          {podiumOrder.map((l, pi) => {
            if (!l) return null
            const rank = podiumRanks[pi]
            const isMe = l.userId === currentUserId
            return (
              <div key={l.userId} className="flex flex-col items-center flex-1 max-w-[140px]">
                <div className={`relative mb-2 ${rank === 0 ? 'scale-110' : ''}`}>
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg ${isMe ? 'ring-4 ring-blue-400' : ''}`}>
                    {l.name[0]?.toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-lg leading-none">{['🥇','🥈','🥉'][rank]}</span>
                </div>
                <Link href={`/profile/${l.userId}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 text-center truncate w-full px-1 mb-0.5 block transition-colors">{l.name}</Link>
                <p className="text-xs text-blue-600 font-bold mb-0.5">
                  {l.score} {period === 'streaks' ? 'days' : period === 'courses' ? 'certs' : 'pts'}
                </p>
                <p className="text-[10px] text-slate-400 mb-2">
                  {period === 'streaks' ? `longest: ${l.solved}d` : period === 'courses' ? `${l.solved} courses` : `${l.solved} solved`}
                </p>
                <div className={`w-full ${podiumHeights[pi]} bg-gradient-to-t ${podiumColors[pi]} rounded-t-xl flex items-start justify-center pt-2`}>
                  <span className="text-white font-bold text-sm opacity-80">{podiumLabels[pi]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="divide-y divide-slate-100">
          {leaders.length === 0 && (
            <div className="px-6 py-14 text-center text-slate-400 text-sm">
              No submissions {period === 'weekly' ? 'this week' : 'yet'}.{' '}
              <Link href="/problems" className="text-blue-600 font-semibold hover:underline">Be the first!</Link>
            </div>
          )}
          {leaders.map((l, i) => {
            const isMe = l.userId === currentUserId
            return (
              <div key={l.userId} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isMe ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-slate-50'}`}>
                <div className="w-9 text-center shrink-0">
                  {i < 3
                    ? <span className="text-xl">{['🥇','🥈','🥉'][i]}</span>
                    : <span className="text-sm font-bold text-slate-400">#{i + 1}</span>}
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {l.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${l.userId}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2">
                    {l.name}
                    {isMe && <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded">you</span>}
                  </Link>
                  <div className="flex items-center gap-3 mt-0.5">
                    {l.streak > 0 && (
                      <span className="text-[11px] text-orange-500 font-semibold flex items-center gap-0.5">
                        <Flame size={10} /> {l.streak}d
                      </span>
                    )}
                    {l.badges > 0 && (
                      <span className="text-[11px] text-violet-500 font-semibold flex items-center gap-0.5">
                        <Star size={10} /> {l.badges}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">{l.solved} solved</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-slate-900">{l.score}</p>
                  <p className="text-[11px] text-slate-400">
                    {period === 'streaks' ? 'day streak' : period === 'courses' ? 'certs' : 'pts'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
