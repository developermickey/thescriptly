'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Code2, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [devUrl,  setDevUrl]  = useState<string | null>(null)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      setSent(true)
      if (data._devResetUrl) setDevUrl(data._devResetUrl)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Codex</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-slate-400 text-sm mt-2">
            {sent ? "Check the instructions below." : "Enter your email and we'll send a reset link."}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-all shadow-lg shadow-blue-600/30"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Reset link sent!</p>
                <p className="text-slate-400 text-sm mt-1">
                  If <span className="text-white font-mono">{email}</span> is registered, a reset link was generated.
                </p>
              </div>

              {/* Dev-mode: show the reset URL directly since no email is configured */}
              {devUrl && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-left">
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">Dev mode — no email configured</p>
                  <p className="text-xs text-slate-400 mb-2">Use this link to reset the password:</p>
                  <Link
                    href={devUrl}
                    className="text-xs text-blue-400 break-all hover:text-blue-300 underline"
                  >
                    {devUrl}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
