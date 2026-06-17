'use client'
import { useState, useEffect } from 'react'
import { Settings, Moon, Sun, Bell, Code2, Palette, Check, User, Loader2, Gift, Copy, CheckCheck, Users } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'
type EditorTheme = 'vs-dark' | 'light' | 'hc-black'
type FontSize = '13' | '14' | '15' | '16'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function SettingsPage() {
  const [theme,        setThemeState] = useState<Theme>('system')
  const [editorTheme,  setEditorTheme] = useState<EditorTheme>('vs-dark')
  const [fontSize,     setFontSize]   = useState<FontSize>('14')
  const [notifBadge,   setNotifBadge]   = useState(true)
  const [notifCert,    setNotifCert]    = useState(true)
  const [notifReply,   setNotifReply]   = useState(true)
  const [emailDigest,  setEmailDigest]  = useState(true)
  const [digestSaving, setDigestSaving] = useState(false)
  const [saved, setSaved]               = useState(false)

  // Profile state
  const [profileName,  setProfileName]  = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [refCopied, setRefCopied]       = useState(false)
  const [referralCount, setReferralCount] = useState(0)

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => {
        if (d.name)         setProfileName(d.name)
        if (d.email)        setProfileEmail(d.email)
        if (d.referralCode) setReferralCode(d.referralCode)
        if (d.referralCount != null) setReferralCount(d.referralCount)
        if (d.emailDigest   != null) setEmailDigest(d.emailDigest)
      })
  }, [])

  function copyReferral() {
    const link = `${window.location.origin}/register?ref=${referralCode}`
    navigator.clipboard.writeText(link).then(() => {
      setRefCopied(true)
      setTimeout(() => setRefCopied(false), 2500)
    })
  }

  async function saveProfile() {
    if (profileLoading) return
    setProfileError('')
    setProfileLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName }),
      })
      const data = await res.json()
      if (!res.ok) { setProfileError(data.error || 'Failed to save'); return }
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } finally {
      setProfileLoading(false)
    }
  }

  // Load from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem('codex_settings')
      if (s) {
        const p = JSON.parse(s)
        if (p.theme)       setThemeState(p.theme)
        if (p.editorTheme) setEditorTheme(p.editorTheme)
        if (p.fontSize)    setFontSize(p.fontSize)
        if (p.notifBadge  != null) setNotifBadge(p.notifBadge)
        if (p.notifCert   != null) setNotifCert(p.notifCert)
        if (p.notifReply  != null) setNotifReply(p.notifReply)
      }
      const t = localStorage.getItem('theme')
      if (t === 'dark' || t === 'light') setThemeState(t)
    } catch {}
  }, [])

  function applyTheme(t: Theme) {
    setThemeState(t)
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else if (t === 'light') {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      localStorage.removeItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }

  async function toggleDigest(val: boolean) {
    setEmailDigest(val)
    setDigestSaving(true)
    await fetch('/api/user/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ emailDigest: val }),
    }).catch(() => {})
    setDigestSaving(false)
  }

  function save() {
    localStorage.setItem('codex_settings', JSON.stringify({
      theme, editorTheme, fontSize, notifBadge, notifCert, notifReply,
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sectionCls = 'bg-white rounded-xl border border-slate-200 overflow-hidden'
  const rowCls     = 'flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0'
  const labelCls   = 'text-sm font-medium text-slate-800'
  const subCls     = 'text-xs text-slate-400 mt-0.5'

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fadeIn">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Settings size={18} className="text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Customize your Codex experience</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <div className={sectionCls}>
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <User size={14} className="text-slate-500" />
            <span className="text-sm font-bold text-slate-900">Profile</span>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Display Name</label>
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                value={profileEmail}
                disabled
                className="w-full border border-slate-100 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            {profileError && <p className="text-xs text-red-500 font-medium">{profileError}</p>}
            <div className="flex justify-end">
              <button
                onClick={saveProfile}
                disabled={profileLoading}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  profileSaved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
                }`}
              >
                {profileLoading ? <Loader2 size={13} className="animate-spin" /> : profileSaved ? <Check size={13} /> : null}
                {profileSaved ? 'Saved!' : 'Update Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Referral */}
        {referralCode && (
          <div className={sectionCls}>
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <Gift size={14} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-900">Refer a Friend</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-500">Share your unique link. Friends who sign up via your link are counted as your referrals.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-700 truncate select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : `/register?ref=${referralCode}`}
                </div>
                <button
                  onClick={copyReferral}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    refCopied ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {refCopied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Users size={13} />
                <span><span className="font-bold text-slate-700">{referralCount}</span> {referralCount === 1 ? 'person' : 'people'} signed up with your link</span>
              </div>
            </div>
          </div>
        )}

        {/* Appearance */}
        <div className={sectionCls}>
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Palette size={14} className="text-slate-500" />
            <span className="text-sm font-bold text-slate-900">Appearance</span>
          </div>

          <div className={rowCls}>
            <div>
              <p className={labelCls}>Theme</p>
              <p className={subCls}>Choose light, dark, or follow your system</p>
            </div>
            <div className="flex gap-2">
              {(['light', 'system', 'dark'] as Theme[]).map(t => (
                <button
                  key={t}
                  onClick={() => applyTheme(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    theme === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {t === 'dark' ? <Moon size={12} /> : t === 'light' ? <Sun size={12} /> : <Palette size={12} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className={sectionCls}>
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Code2 size={14} className="text-slate-500" />
            <span className="text-sm font-bold text-slate-900">Code Editor</span>
          </div>

          <div className={rowCls}>
            <div>
              <p className={labelCls}>Editor Theme</p>
              <p className={subCls}>Monaco editor color scheme</p>
            </div>
            <select
              value={editorTheme}
              onChange={e => setEditorTheme(e.target.value as EditorTheme)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="vs-dark">Dark (default)</option>
              <option value="light">Light</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>

          <div className={rowCls}>
            <div>
              <p className={labelCls}>Font Size</p>
              <p className={subCls}>Code editor font size in pixels</p>
            </div>
            <div className="flex gap-1.5">
              {(['13', '14', '15', '16'] as FontSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`w-9 h-8 rounded-lg text-xs font-bold border transition-all ${
                    fontSize === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className={sectionCls}>
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Bell size={14} className="text-slate-500" />
            <span className="text-sm font-bold text-slate-900">Notifications</span>
          </div>

          {[
            { label: 'Badge unlocked',     sub: 'When you earn a new badge',        val: notifBadge, set: setNotifBadge },
            { label: 'Course certificate', sub: 'When you complete a course',        val: notifCert,  set: setNotifCert  },
            { label: 'Comment replies',    sub: 'When someone replies to your post', val: notifReply, set: setNotifReply },
          ].map(({ label, sub, val, set }) => (
            <div key={label} className={rowCls}>
              <div>
                <p className={labelCls}>{label}</p>
                <p className={subCls}>{sub}</p>
              </div>
              <Toggle checked={val} onChange={set} />
            </div>
          ))}

          <div className={rowCls}>
            <div>
              <p className={labelCls}>Weekly digest email</p>
              <p className={subCls}>A personalised weekly progress summary sent to your email</p>
            </div>
            <div className="flex items-center gap-2">
              {digestSaving && <span className="text-xs text-slate-400">Saving…</span>}
              <Toggle checked={emailDigest} onChange={toggleDigest} />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={save}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saved ? <><Check size={14} /> Saved!</> : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
