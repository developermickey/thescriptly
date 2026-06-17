import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { id: parseInt((session.user as any).id) }, select: { role: true } })
  return user?.role === 'admin' ? session : null
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, ...data } = body

  if (id) {
    await prisma.practiceQuestion.update({ where: { id }, data })
    return NextResponse.json({ ok: true, id })
  } else {
    const q = await prisma.practiceQuestion.create({ data })
    return NextResponse.json({ ok: true, id: q.id })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  await prisma.practiceQuestion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
