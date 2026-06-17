import { prisma } from './prisma'

export async function updateStreak(userId: number) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { currentStreak: true, longestStreak: true, lastStreakDate: true },
  })
  if (!user) return

  const today    = new Date().toISOString().slice(0, 10)
  const lastDate = user.lastStreakDate?.toISOString().slice(0, 10)

  if (lastDate === today) return // already updated today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const newStreak = lastDate === yesterday ? user.currentStreak + 1 : 1
  const longest   = Math.max(newStreak, user.longestStreak)

  await prisma.user.update({
    where: { id: userId },
    data:  { currentStreak: newStreak, longestStreak: longest, lastStreakDate: new Date() },
  })
}
