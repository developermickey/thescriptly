import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  const [user, referralCount] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true, referralCode: true, bio: true, github: true, twitter: true, website: true, emailDigest: true },
    }),
    prisma.user.count({ where: { referredBy: userId } }),
  ])
  return NextResponse.json({ ...user, referralCount })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  const { name, bio, github, twitter, website, emailDigest } = await req.json() as {
    name?: string; bio?: string; github?: string; twitter?: string; website?: string; emailDigest?: boolean
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
  }

  const data: Record<string, string | boolean | null> = {}
  if (name        !== undefined) data.name        = name.trim()
  if (bio         !== undefined) data.bio         = bio.trim() || null
  if (github      !== undefined) data.github      = github.trim() || null
  if (twitter     !== undefined) data.twitter     = twitter.trim() || null
  if (website     !== undefined) data.website     = website.trim() || null
  if (emailDigest !== undefined) data.emailDigest = emailDigest

  const user = await prisma.user.update({
    where:  { id: userId },
    data,
    select: { id: true, name: true, email: true, bio: true, github: true, twitter: true, website: true, emailDigest: true },
  })

  return NextResponse.json(user)
}
