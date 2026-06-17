import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json([], { status: 403 })

  const collections = await prisma.problemCollection.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    include: { _count: { select: { items: true } } },
  })
  return NextResponse.json(collections)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({}, { status: 403 })

  const { title, description, icon, isPinned, questionIds } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const baseSlug = slugify(title.trim())
  let slug = baseSlug
  let n = 1
  while (await prisma.problemCollection.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`
  }

  const collection = await prisma.problemCollection.create({
    data: {
      slug,
      title:       title.trim(),
      description: description?.trim() || null,
      icon:        icon?.trim() || null,
      isPinned:    isPinned ?? false,
      items: questionIds?.length
        ? { create: questionIds.map((qId: number, i: number) => ({ questionId: qId, sortOrder: i })) }
        : undefined,
    },
    include: { _count: { select: { items: true } } },
  })

  return NextResponse.json(collection)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({}, { status: 403 })

  const { id, title, description, icon, isPinned, questionIds } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (title !== undefined)       data.title       = title.trim()
  if (description !== undefined) data.description = description?.trim() || null
  if (icon !== undefined)        data.icon        = icon?.trim() || null
  if (isPinned !== undefined)    data.isPinned    = isPinned

  if (questionIds !== undefined) {
    await prisma.collectionItem.deleteMany({ where: { collectionId: id } })
    data.items = { create: questionIds.map((qId: number, i: number) => ({ questionId: qId, sortOrder: i })) }
  }

  const updated = await prisma.problemCollection.update({
    where: { id },
    data,
    include: { _count: { select: { items: true } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({}, { status: 403 })

  const { id } = await req.json()
  await prisma.problemCollection.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
