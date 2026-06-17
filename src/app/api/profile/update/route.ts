import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const { name, email, avatar, bio, github, twitter, website } = await req.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const conflict = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } })
  if (conflict) return NextResponse.json({ error: 'Email already in use by another account' }, { status: 400 })

  await prisma.user.update({
    where: { id: userId },
    data: {
      name:    name.trim(),
      email:   email.trim(),
      ...(avatar  !== undefined ? { avatar }               : {}),
      ...(bio     !== undefined ? { bio: bio?.trim() || null }     : {}),
      ...(github  !== undefined ? { github: github?.trim() || null } : {}),
      ...(twitter !== undefined ? { twitter: twitter?.trim() || null } : {}),
      ...(website !== undefined ? { website: website?.trim() || null } : {}),
    },
  })
  return NextResponse.json({ success: true })
}
