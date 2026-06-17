import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'
import { updateStreak } from '@/lib/streak'

const JUDGE0_HOST = process.env.JUDGE0_HOST || 'https://judge0-ce.p.rapidapi.com'
const JUDGE0_KEY  = process.env.JUDGE0_KEY  || ''

const LANG_IDS: Record<string, number> = {
  javascript: 93,
  python:     71,
  java:       62,
  cpp:        54,
}

function wrapCode(code: string, language: string): string {
  if (language === 'java') {
    if (!code.includes('class Main') && !code.includes('public static void main')) {
      return `public class Main {\n    public static void main(String[] args) {\n        ${code.replace(/\n/g, '\n        ')}\n    }\n}`
    }
  }
  if (language === 'cpp') {
    if (!code.includes('#include')) {
      return `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ${code.replace(/\n/g, '\n    ')}\n    return 0;\n}`
    }
  }
  return code
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const { questionId, language, code, submit } = await req.json()

  if (!JUDGE0_KEY) {
    return NextResponse.json({
      status: 'error',
      message: 'Code execution not configured (no Judge0 API key). Add JUDGE0_KEY to .env',
      stdout: null,
      stderr: null,
    })
  }

  const langId = LANG_IDS[language]
  if (!langId) return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 })
  const wrappedCode = wrapCode(code, language)
  const encoded     = Buffer.from(wrappedCode).toString('base64')

  try {
    // Submit to Judge0
    const submitRes = await fetch(`${JUDGE0_HOST}/submissions?base64_encoded=true&wait=true`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'X-RapidAPI-Key':  JUDGE0_KEY,
      },
      body: JSON.stringify({ source_code: encoded, language_id: langId }),
    })
    const result = await submitRes.json()

    const statusName = result.status?.description?.toLowerCase() || 'error'
    const accepted   = statusName === 'accepted'
    const stdout     = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : null
    const stderr     = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : null
    const compileErr = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : null

    // Save submission if requested
    let newBadges: any[] = []
    if (submit) {
      await prisma.submission.create({
        data: {
          userId,
          questionId,
          language,
          code,
          status:    accepted ? 'accepted' : 'failed',
          runtimeMs: result.time ? Math.round(parseFloat(result.time) * 1000) : null,
          memoryMb:  result.memory ? result.memory / 1024 : null,
        },
      })
      if (accepted) {
        await updateStreak(userId)
        newBadges = await checkAndAwardBadges(userId)
      }
    }

    return NextResponse.json({
      status:     accepted ? 'accepted' : statusName,
      stdout,
      stderr:     stderr || compileErr,
      runtime_ms: result.time ? Math.round(parseFloat(result.time) * 1000) : null,
      memory_mb:  result.memory ? result.memory / 1024 : null,
      newBadges,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
