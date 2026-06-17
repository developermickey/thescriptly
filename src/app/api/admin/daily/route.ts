import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { date, questionId } = await req.json() as { date: string; questionId: number }

  if (!date || !questionId) {
    return NextResponse.json({ error: 'date and questionId required' }, { status: 400 })
  }

  const pin = await prisma.dailyPin.upsert({
    where:  { date },
    update: { questionId },
    create: { date, questionId },
    include: { question: { select: { id: true, title: true, difficulty: true } } },
  })

  return NextResponse.json({ pin })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { date } = await req.json() as { date: string }
  await prisma.dailyPin.deleteMany({ where: { date } })
  return NextResponse.json({ success: true })
}
