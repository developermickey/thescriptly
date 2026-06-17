import { prisma } from './prisma'

interface Badge {
  slug: string
  name: string
  desc: string
  emoji: string
}

const BADGES: Badge[] = [
  { slug: 'first_solve',     name: 'First Blood',       desc: 'Solved your first problem',              emoji: '⚔️' },
  { slug: 'solve_10',        name: 'Problem Crusher',   desc: 'Solved 10 problems',                     emoji: '💪' },
  { slug: 'solve_50',        name: 'Grinder',           desc: 'Solved 50 problems',                     emoji: '🔥' },
  { slug: 'solve_100',       name: 'Century Club',      desc: 'Solved 100 problems',                    emoji: '💯' },
  { slug: 'first_course',    name: 'Scholar',           desc: 'Completed your first course',            emoji: '🎓' },
  { slug: 'streak_7',        name: 'Week Warrior',      desc: 'Maintained a 7-day streak',              emoji: '📅' },
  { slug: 'streak_30',       name: 'Monthly Master',    desc: 'Maintained a 30-day streak',             emoji: '🏆' },
  { slug: 'hard_solver',     name: 'Hard Mode',         desc: 'Solved a Hard difficulty problem',       emoji: '💀' },
  { slug: 'speed_demon',     name: 'Speed Demon',       desc: 'Got accepted in under 100ms runtime',    emoji: '⚡' },
  { slug: 'polyglot',        name: 'Polyglot',          desc: 'Submitted in 3 different languages',     emoji: '🌍' },
  { slug: 'multi_course',    name: 'Knowledge Seeker',  desc: 'Completed 3 or more courses',            emoji: '📚' },
  { slug: 'first_share',     name: 'Open Source',       desc: 'Shared your first community solution',   emoji: '🤝' },
  { slug: 'first_comment',   name: 'Discusser',         desc: 'Posted your first problem comment',      emoji: '💬' },
  { slug: 'helpful',         name: 'Helpful',           desc: 'Received 5 upvotes on a shared solution',emoji: '⭐' },
]

export async function checkAndAwardBadges(userId: number) {
  const existing = await prisma.userBadge.findMany({ where: { userId }, select: { badgeSlug: true } })
  const owned    = new Set(existing.map(b => b.badgeSlug))

  const toAward: Badge[] = []

  const [solveCounts, certs, fastSub, langs, sharedSols, comments, topSolution] = await Promise.all([
    prisma.submission.groupBy({
      by: ['questionId'],
      where: { userId, status: 'accepted' },
      _count: { questionId: true },
    }),
    prisma.certificate.count({ where: { userId } }),
    prisma.submission.findFirst({
      where: { userId, status: 'accepted', runtimeMs: { lte: 100, not: null } },
    }),
    prisma.submission.groupBy({
      by: ['language'],
      where: { userId, status: 'accepted' },
    }),
    prisma.sharedSolution.count({ where: { userId } }),
    prisma.problemComment.count({ where: { userId } }),
    prisma.sharedSolution.findFirst({
      where:   { userId },
      orderBy: { upvotes: 'desc' },
      select:  { upvotes: true },
    }),
  ])

  const uniqueSolved = solveCounts.length

  // Check hard problems
  let hardSolved = false
  if (uniqueSolved > 0) {
    const solvedIds  = solveCounts.map(s => s.questionId)
    const hardCount  = await prisma.practiceQuestion.count({
      where: { id: { in: solvedIds }, difficulty: 'Hard' },
    })
    hardSolved = hardCount > 0
  }

  // Streak check — include both submissions and lesson completions
  const [subDates, lessonDates] = await Promise.all([
    prisma.submission.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.lessonProgress.findMany({ where: { userId }, select: { completedAt: true } }),
  ])
  const days = [...new Set([
    ...subDates.map(s => s.createdAt.toISOString().slice(0, 10)),
    ...lessonDates.map(p => p.completedAt.toISOString().slice(0, 10)),
  ])].sort().reverse()
  let streak = 0
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] === today || days[0] === yesterday) {
    streak = 1
    for (let i = 1; i < days.length; i++) {
      const diff = (new Date(days[i-1]).getTime() - new Date(days[i]).getTime()) / 86400000
      if (diff === 1) streak++; else break
    }
  }

  const checks: [string, boolean][] = [
    ['first_solve',   uniqueSolved >= 1],
    ['solve_10',      uniqueSolved >= 10],
    ['solve_50',      uniqueSolved >= 50],
    ['solve_100',     uniqueSolved >= 100],
    ['first_course',  certs >= 1],
    ['multi_course',  certs >= 3],
    ['streak_7',      streak >= 7],
    ['streak_30',     streak >= 30],
    ['hard_solver',   hardSolved],
    ['first_share',   sharedSols >= 1],
    ['first_comment', comments >= 1],
    ['helpful',       (topSolution?.upvotes ?? 0) >= 5],
    ['speed_demon',  !!fastSub],
    ['polyglot',     langs.length >= 3],
  ]

  for (const [slug, earned] of checks) {
    if (earned && !owned.has(slug)) {
      const badge = BADGES.find(b => b.slug === slug)!
      toAward.push(badge)
    }
  }

  if (toAward.length > 0) {
    await prisma.userBadge.createMany({
      data: toAward.map(b => ({
        userId,
        badgeSlug: b.slug,
        badgeName: `${b.emoji} ${b.name}`,
        badgeDesc: b.desc,
        awardedAt: new Date(),
      })),
    })
    await prisma.notification.createMany({
      data: toAward.map(b => ({
        userId,
        actorId:  userId,
        type:     'badge',
        message:  `You earned the "${b.emoji} ${b.name}" badge! ${b.desc}`,
      })),
    })
  }

  return toAward
}

export const ALL_BADGES = BADGES
