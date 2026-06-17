import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user || user.role !== 'admin') return null
  return user
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, title, description, category, badge, icon, isFree, price, mrp, whatYouLearn } = body

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const data = {
    title,
    description:  description  || null,
    category:     category     || null,
    badge:        badge        || null,
    icon:         icon         || null,
    isFree:       isFree === true || isFree === 'true',
    price:        price  != null && price  !== '' ? parseFloat(price)  : null,
    mrp:          mrp    != null && mrp    !== '' ? parseFloat(mrp)    : null,
    whatYouLearn: whatYouLearn || null,
  }

  if (id) {
    const course = await prisma.course.update({ where: { id: parseInt(id) }, data })
    return NextResponse.json(course)
  } else {
    const course = await prisma.course.create({ data })
    return NextResponse.json(course)
  }
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  await prisma.course.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
