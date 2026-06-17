import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (!user) return NextResponse.json({ ok: true }) // avoid enumeration

  const token  = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data:  { resetToken: token, resetTokenExpiry: expiry },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`
  await sendPasswordResetEmail(user.email, user.name, resetUrl)

  return NextResponse.json({ ok: true, _devResetUrl: process.env.RESEND_API_KEY ? undefined : resetUrl })
}
