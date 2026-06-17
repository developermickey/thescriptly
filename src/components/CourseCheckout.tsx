'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Lock, CheckCircle } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface Props {
  courseId:  number
  price:     number
  mrp:       number
  title:     string
  isLoggedIn: boolean
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export function CourseCheckout({ courseId, price, mrp, title, isLoggedIn }: Props) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const discount = Math.round(((mrp - price) / mrp) * 100)

  async function handleCheckout() {
    if (!isLoggedIn) { router.push('/login'); return }
    setLoading(true)
    setError('')

    const ok = await loadRazorpayScript()
    if (!ok) { setError('Failed to load payment gateway. Try again.'); setLoading(false); return }

    const res = await fetch('/api/payments/create-order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ courseId }),
    })

    const data = await res.json()

    if (!res.ok) {
      // Already enrolled?
      if (data.error === 'Already enrolled') {
        router.push(`/courses/${courseId}`)
        return
      }
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    const options = {
      key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount:      data.amount,
      currency:    data.currency,
      name:        'Scriptly',
      description: title,
      order_id:    data.order_id,
      theme:       { color: '#2563eb' },
      prefill:     {},
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        const verify = await fetch('/api/payments/verify', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            courseId,
          }),
        })
        if (verify.ok) {
          router.push(`/courses/${courseId}?enrolled=1`)
        } else {
          const d = await verify.json()
          setError(d.error || 'Payment verification failed')
          setLoading(false)
        }
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (res: any) => {
      setError(res.error?.description || 'Payment failed')
      setLoading(false)
    })
    rzp.open()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Pricing */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-extrabold text-slate-900">₹{price}</span>
        {mrp > price && (
          <>
            <span className="text-lg text-slate-400 line-through mb-0.5">₹{mrp}</span>
            <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-0.5">{discount}% off</span>
          </>
        )}
      </div>

      {/* Includes */}
      <div className="space-y-2">
        {[
          'Lifetime access',
          'All lessons & exercises',
          'Course completion certificate',
          'Discussion access per lesson',
          'Free updates forever',
        ].map(item => (
          <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle size={14} className="text-emerald-500 shrink-0" /> {item}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
      >
        {loading ? (
          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</span>
        ) : (
          <><Zap size={15} /> {isLoggedIn ? `Enroll Now — ₹${price}` : `Sign in & Enroll — ₹${price}`}</>
        )}
      </button>

      {error && <p className="text-xs text-red-600 text-center">{error}</p>}

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <Lock size={11} /> Secured by Razorpay
      </div>
    </div>
  )
}
