import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function isAdmin() {
  const session = await getServerSession(authOptions)
  return (session?.user as any)?.role === 'admin'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { body, sortOrder } = await req.json()
  const hint = await prisma.problemHint.update({
    where: { id: parseInt(id) },
    data:  { ...(body !== undefined && { body }), ...(sortOrder !== undefined && { sortOrder }) },
  })
  return NextResponse.json(hint)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await prisma.problemHint.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
