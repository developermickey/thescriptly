'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Lock, Code2, ArrowRight, Gift } from 'lucide-react'

function RegisterForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [refCode, setRefCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    const ref = params.get('ref')
    if (ref) setRefCode(ref.toUpperCase())
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, referralCode: refCode || undefined }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push('/login?registered=1')
    } else {
      setError(data.error || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form, label: string, type: string, placeholder: string, Icon: React.ElementType) => (
    <div>
      <label className="block text-sm font-semibold text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          required
          minLength={key === 'password' ? 8 : undefined}
          className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-500/30">
            <Code2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Start your coding journey for free</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {refCode && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2.5 rounded-xl mb-5">
              <Gift size={13} /> Referred by a friend — welcome to Codex!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {field('name',     'Full Name',  'text',     'John Doe',           User)}
            {field('email',    'Email',      'email',    'you@example.com',    Mail)}
            {field('password', 'Password',   'password', 'Min. 8 characters',  Lock)}

            {/* Referral code */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                Referral Code <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <div className="relative">
                <Gift size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={refCode}
                  onChange={e => setRefCode(e.target.value.toUpperCase())}
                  placeholder="CODEX-XXXX"
                  className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase tracking-widest"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition-all shadow-lg shadow-blue-600/30 mt-2"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Create Account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <RegisterForm />
    </Suspense>
  )
}
