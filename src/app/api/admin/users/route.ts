import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, role } = await req.json()
  if (!id || !['admin', 'student'].includes(role)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { role },
    select: { id: true, role: true },
  })
  return NextResponse.json(user)
}
