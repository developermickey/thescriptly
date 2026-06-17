'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Code2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

function ResetForm() {
  const searchParams = useSearchParams()
  const token  = searchParams.get('token') ?? ''
  const router = useRouter()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Codex</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-slate-400 text-sm mt-2">Must be at least 6 characters.</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          {!token ? (
            <div className="text-center py-4">
              <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
              <p className="text-red-400 font-semibold">Invalid reset link</p>
              <p className="text-slate-400 text-sm mt-1">This link is missing a token. Please request a new one.</p>
              <Link href="/forgot-password" className="mt-4 inline-block text-sm text-blue-400 hover:underline">Request new link</Link>
            </div>
          ) : done ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <p className="text-white font-semibold">Password updated!</p>
              <p className="text-slate-400 text-sm">Redirecting to sign in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">New password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 rounded-lg pl-10 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-all shadow-lg shadow-blue-600/30"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading…</div>}>
      <ResetForm />
    </Suspense>
  )
}
