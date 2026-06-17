import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const JUDGE0_HOST = process.env.JUDGE0_HOST || 'https://judge0-ce.p.rapidapi.com'
const JUDGE0_KEY  = process.env.JUDGE0_KEY  || ''

const LANG_IDS: Record<string, number> = {
  javascript: 93,
  python:     71,
  java:       62,
  cpp:        54,
  typescript: 94,
  rust:       73,
  go:         95,
  ruby:       72,
  csharp:     51,
  kotlin:     78,
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

  const { language, code, stdin } = await req.json()

  if (!JUDGE0_KEY) {
    return NextResponse.json({
      status: 'error',
      message: 'Code execution not configured. Add JUDGE0_KEY to .env',
      stdout: null, stderr: null,
    })
  }

  const langId = LANG_IDS[language]
  if (!langId) return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 })

  const wrapped = wrapCode(code, language)

  const body: Record<string, string> = {
    source_code: Buffer.from(wrapped).toString('base64'),
    language_id: String(langId),
  }
  if (stdin?.trim()) body.stdin = Buffer.from(stdin).toString('base64')

  const res = await fetch(`${JUDGE0_HOST}/submissions?base64_encoded=true&wait=true`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'X-RapidAPI-Key': JUDGE0_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify(body),
  })

  const result = await res.json()

  const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : null
  const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : null
  const compile = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : null

  return NextResponse.json({
    status:     result.status?.description ?? 'Unknown',
    stdout,
    stderr:     stderr || compile,
    runtime_ms: result.time ? Math.round(parseFloat(result.time) * 1000) : null,
    memory_kb:  result.memory ?? null,
  })
}
