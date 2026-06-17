import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ALL_BADGES } from '@/lib/badges'
import { Card, CardBody } from '@/components/ui/Card'

export default async function BadgesPage() {
  const session = await getServerSession(authOptions)
  const userId  = parseInt((session?.user as any)?.id)

  const earned = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { awardedAt: 'desc' },
  })
  const earnedSlugs = new Set(earned.map(b => b.badgeSlug))

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Badges & Achievements</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {earned.length} of {ALL_BADGES.length} badges earned
        </p>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
            style={{ width: `${Math.round((earned.length / ALL_BADGES.length) * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_BADGES.map(badge => {
          const isEarned   = earnedSlugs.has(badge.slug)
          const earnedData = earned.find(e => e.badgeSlug === badge.slug)
          return (
            <Card key={badge.slug} className={`transition-all ${isEarned ? 'border-amber-200' : 'opacity-50 grayscale'}`}>
              <CardBody className="flex items-start gap-4 py-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                  isEarned ? 'bg-amber-50 border-2 border-amber-200' : 'bg-slate-100'
                }`}>
                  {badge.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${isEarned ? 'text-slate-900' : 'text-slate-500'}`}>
                    {badge.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{badge.desc}</p>
                  {isEarned && earnedData && (
                    <p className="text-xs text-amber-600 font-semibold mt-1.5">
                      ✓ Earned {new Date(earnedData.awardedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
