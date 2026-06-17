import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id }     = await params
  const reportId   = parseInt(id)
  const { status } = await req.json() as { status: string }

  if (!['open', 'resolved', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  await prisma.problemReport.update({ where: { id: reportId }, data: { status } })
  return NextResponse.json({ success: true })
}
