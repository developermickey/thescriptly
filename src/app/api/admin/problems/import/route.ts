import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ImportRow {
  title: string
  difficulty?: string
  topic?: string
  company?: string
  problemStatement?: string
  examples?: string
  constraints?: string
  hints?: string
  solutionExplanation?: string
  starterCodeJs?: string
  starterCodePython?: string
  starterCodeJava?: string
  starterCodeCpp?: string
  timeComplexity?: string
  spaceComplexity?: string
}

const VALID_DIFFICULTIES = new Set(['Easy', 'Medium', 'Hard'])

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { rows } = await req.json() as { rows: ImportRow[] }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }
  if (rows.length > 200) {
    return NextResponse.json({ error: 'Max 200 rows per import' }, { status: 400 })
  }

  const errors: string[] = []
  const valid: ImportRow[] = []

  rows.forEach((row, i) => {
    if (!row.title?.trim()) {
      errors.push(`Row ${i + 1}: missing title`)
      return
    }
    const diff = row.difficulty?.trim()
    if (diff && !VALID_DIFFICULTIES.has(diff)) {
      errors.push(`Row ${i + 1}: invalid difficulty "${diff}" (must be Easy, Medium, or Hard)`)
      return
    }
    valid.push(row)
  })

  if (errors.length > 0 && valid.length === 0) {
    return NextResponse.json({ error: 'All rows failed validation', errors }, { status: 400 })
  }

  const created = await prisma.practiceQuestion.createMany({
    data: valid.map(r => ({
      title:               r.title.trim(),
      difficulty:          VALID_DIFFICULTIES.has(r.difficulty?.trim() ?? '') ? r.difficulty!.trim() : 'Medium',
      topic:               r.topic?.trim() || null,
      company:             r.company?.trim() || null,
      problemStatement:    r.problemStatement?.trim() || null,
      examples:            r.examples?.trim() || null,
      constraints:         r.constraints?.trim() || null,
      hints:               r.hints?.trim() || null,
      solutionExplanation: r.solutionExplanation?.trim() || null,
      starterCodeJs:       r.starterCodeJs?.trim() || null,
      starterCodePython:   r.starterCodePython?.trim() || null,
      starterCodeJava:     r.starterCodeJava?.trim() || null,
      starterCodeCpp:      r.starterCodeCpp?.trim() || null,
      timeComplexity:      r.timeComplexity?.trim() || null,
      spaceComplexity:     r.spaceComplexity?.trim() || null,
    })),
    skipDuplicates: true,
  })

  return NextResponse.json({ imported: created.count, skipped: valid.length - created.count, errors })
}
