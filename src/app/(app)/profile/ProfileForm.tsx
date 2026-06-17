'use client'
import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { User, Lock, Check, AlertCircle, GitFork, Globe, AtSign } from 'lucide-react'

const AVATAR_GRADIENTS = [
  'from-blue-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
  'from-violet-500 to-purple-600',
  'from-red-500 to-orange-500',
  'from-slate-600 to-slate-800',
]

interface Props {
  user: { id: number; name: string; email: string; avatar: string | null; bio?: string | null; github?: string | null; twitter?: string | null; website?: string | null }
}

export function ProfileForm({ user }: Props) {
  const [name,    setName]    = useState(user.name)
  const [email,   setEmail]   = useState(user.email)
  const [avatar,  setAvatar]  = useState(user.avatar ?? AVATAR_GRADIENTS[0])
  const [bio,     setBio]     = useState(user.bio ?? '')
  const [github,  setGithub]  = useState(user.github ?? '')
  const [twitter, setTwitter] = useState(user.twitter ?? '')
  const [website, setWebsite] = useState(user.website ?? '')
  const [savingInfo, setSavingInfo]   = useState(false)
  const [infoMsg, setInfoMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [curPw, setCurPw]       = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confPw, setConfPw]     = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault()
    setSavingInfo(true)
    setInfoMsg(null)
    const res  = await fetch('/api/profile/update', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, avatar, bio, github, twitter, website }),
    })
    const data = await res.json()
    setInfoMsg(res.ok ? { type: 'success', text: 'Profile updated successfully!' } : { type: 'error', text: data.error })
    setSavingInfo(false)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confPw) { setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return }
    if (newPw.length < 8)  { setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return }
    setSavingPw(true)
    setPwMsg(null)
    const res  = await fetch('/api/profile/password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    })
    const data = await res.json()
    if (res.ok) {
      setPwMsg({ type: 'success', text: 'Password changed successfully!' })
      setCurPw(''); setNewPw(''); setConfPw('')
    } else {
      setPwMsg({ type: 'error', text: data.error })
    }
    setSavingPw(false)
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

  return (
    <>
      {/* Personal Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <User size={15} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Personal Information</p>
              <p className="text-xs text-slate-400">Update your name and email address</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={saveInfo} className="space-y-4">
            {/* Avatar color picker */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Avatar Color</label>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                  {name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_GRADIENTS.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setAvatar(g)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} transition-all ${
                        avatar === g ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Your name" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="your@email.com" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Tell the community a bit about yourself…"
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/300</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <GitFork size={12} /> GitHub username
                </label>
                <input value={github} onChange={e => setGithub(e.target.value)} className={inputCls} placeholder="username" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <AtSign size={12} /> Twitter/X handle
                </label>
                <input value={twitter} onChange={e => setTwitter(e.target.value)} className={inputCls} placeholder="handle" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Globe size={12} /> Website
                </label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className={inputCls} placeholder="https://…" />
              </div>
            </div>

            {infoMsg && (
              <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
                infoMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {infoMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                {infoMsg.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingInfo}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {savingInfo ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : <Check size={14} />}
                {savingInfo ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <Lock size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Change Password</p>
              <p className="text-xs text-slate-400">Use a strong password with at least 8 characters</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
              <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} className={inputCls} placeholder="••••••••" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className={inputCls} placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} className={inputCls} placeholder="••••••••" required />
              </div>
            </div>

            {pwMsg && (
              <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
                pwMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {pwMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                {pwMsg.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPw}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {savingPw ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : <Lock size={14} />}
                {savingPw ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  )
}
