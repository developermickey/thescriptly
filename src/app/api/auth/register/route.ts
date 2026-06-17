import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

function genReferralCode(): string {
  return 'CODEX-' + randomBytes(3).toString('hex').toUpperCase()
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, referralCode } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 })
    }

    // Resolve referrer
    let referredById: number | undefined
    if (referralCode) {
      const referrer = await prisma.user.findFirst({ where: { referralCode: referralCode.toUpperCase() } })
      if (referrer) referredById = referrer.id
    }

    // Generate unique referral code for the new user
    let myCode = genReferralCode()
    while (await prisma.user.findFirst({ where: { referralCode: myCode } })) {
      myCode = genReferralCode()
    }

    const hashed = await bcrypt.hash(password, 12)
    const user   = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'student',
        referralCode: myCode,
        ...(referredById ? { referredBy: referredById } : {}),
      },
    })
    return NextResponse.json({ success: true, id: user.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
