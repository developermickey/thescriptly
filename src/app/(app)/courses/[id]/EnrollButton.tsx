'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Lock } from 'lucide-react'

declare global {
  interface Window { Razorpay: any }
}

interface Props {
  courseId: number
  isFree:   boolean
  price?:   number | null
  mrp?:     number | null
  title?:   string
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

export function EnrollButton({ courseId, isFree, price, mrp, title = '' }: Props) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleFreeEnroll() {
    setLoading(true)
    await fetch('/api/courses/enroll', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ courseId }),
    })
    router.refresh()
    setLoading(false)
  }

  async function handlePaidEnroll() {
    setLoading(true)
    setError('')

    const ok = await loadRazorpayScript()
    if (!ok) { setError('Failed to load payment gateway.'); setLoading(false); return }

    const res  = await fetch('/api/payments/create-order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ courseId }),
    })

    let data: any = {}
    try { data = await res.json() } catch {}

    if (!res.ok) {
      if (data.error === 'Already enrolled') { router.refresh(); return }
      setError(data.error || 'Failed to create order')
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
          router.refresh()
        } else {
          let msg = 'Verification failed'
          try { const d = await verify.json(); msg = d.error || msg } catch {}
          setError(msg)
          setLoading(false)
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (r: any) => {
      setError(r.error?.description || 'Payment failed')
      setLoading(false)
    })
    rzp.open()
  }

  const discount = price && mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  return (
    <div className="space-y-2">
      {!isFree && price && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-extrabold text-white">₹{price}</span>
            {mrp && mrp > price && <span className="text-white/50 text-sm line-through">₹{mrp}</span>}
            {discount > 0 && <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>}
          </div>
          <p className="text-white/50 text-[11px] mt-0.5">One-time payment · Lifetime access</p>
        </div>
      )}

      <button
        onClick={isFree ? handleFreeEnroll : handlePaidEnroll}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full bg-white text-blue-700 font-bold text-sm py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg disabled:opacity-60"
      >
        {loading ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : <Zap size={15} />}
        {loading ? 'Processing…' : isFree ? 'Enroll for Free' : `Enroll — ₹${price}`}
      </button>

      {!isFree && (
        <p className="text-[10px] text-white/40 flex items-center justify-center gap-1">
          <Lock size={10} /> Secured by Razorpay
        </p>
      )}
      {error && <p className="text-[11px] text-red-300 text-center">{error}</p>}
    </div>
  )
}
