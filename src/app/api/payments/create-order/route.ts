import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Razorpay from 'razorpay'

const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  ? new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  if (!razorpay) {
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 })
  }

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  if (course.isFree || !course.price) {
    return NextResponse.json({ error: 'Course is free — no payment needed' }, { status: 400 })
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findFirst({ where: { userId, courseId } })
  if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 400 })

  const amountPaise = Math.round(Number(course.price) * 100)
  if (amountPaise < 100) return NextResponse.json({ error: 'Amount too low' }, { status: 400 })

  try {
    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `course_${courseId}_user_${userId}_${Date.now()}`,
      notes:    { courseId: String(courseId), userId: String(userId) },
    })

    return NextResponse.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      course:   { id: course.id, title: course.title, price: course.price },
    })
  } catch (err: any) {
    console.error('Razorpay create order error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
