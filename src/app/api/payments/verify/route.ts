import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  let body: any = {}
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify HMAC-SHA256 signature
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 })
  }

  const bodyStr  = razorpay_order_id + '|' + razorpay_payment_id
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(bodyStr)
    .digest('hex')

  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  try {
    // Upsert enrollment — safe if already exists
    await prisma.enrollment.upsert({
      where:  { userId_courseId: { userId, courseId } },
      update: { paymentId: razorpay_payment_id },
      create: { userId, courseId, paymentId: razorpay_payment_id },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Enrollment upsert error:', err)
    return NextResponse.json({
      error: 'Failed to enroll.',
      detail: process.env.NODE_ENV === 'development' ? String(err?.message ?? err) : undefined,
    }, { status: 500 })
  }
}
