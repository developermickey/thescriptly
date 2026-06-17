'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Code2, BookOpen, Trophy, Zap, CheckCircle, ArrowRight,
  Users, Map, Terminal, Video, BarChart2, Flame,
  Sparkles, ChevronRight, Star, Shield, Clock, X, Menu,
  ChevronDown,
} from 'lucide-react'

const features = [
  { icon: BookOpen, title: 'Structured Courses',    desc: 'Step-by-step lessons on DSA, Full Stack, System Design — mapped to what interviewers actually test.',      gradient: 'from-blue-500 to-cyan-500',    light: 'bg-blue-50',   text: 'text-blue-600' },
  { icon: Code2,    title: 'Real Coding Problems',  desc: '160+ LeetCode-quality problems with instant Judge0 execution. JS, Python, Java, C++ and more.',             gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50', text: 'text-violet-600' },
  { icon: Map,      title: 'Learning Roadmaps',     desc: 'Curated paths — DSA Fundamentals, FAANG Track, Beginner Path. Know exactly what to do next.',              gradient: 'from-emerald-500 to-teal-500',  light: 'bg-emerald-50',text: 'text-emerald-600' },
  { icon: Terminal, title: 'Code Playground',       desc: 'Free-form editor for 10 languages. Test snippets, explore algorithms — zero setup required.',              gradient: 'from-orange-500 to-amber-500',  light: 'bg-orange-50', text: 'text-orange-600' },
  { icon: Video,    title: 'Mock Interviews',        desc: 'Timed sessions with AI scoring and feedback. Build the muscle memory to perform under pressure.',          gradient: 'from-pink-500 to-rose-500',    light: 'bg-pink-50',   text: 'text-pink-600' },
  { icon: Trophy,   title: 'Certificates & Badges', desc: 'Complete courses for verifiable certificates. Earn badges for streaks, Hard problems, and milestones.',    gradient: 'from-amber-500 to-yellow-500', light: 'bg-amber-50',  text: 'text-amber-600' },
]

const stats = [
  { value: '10,000+', label: 'Students',       icon: Users,    color: 'text-blue-600',    bg: 'bg-blue-50' },
  { value: '160+',    label: 'Problems',        icon: Code2,    color: 'text-violet-600',  bg: 'bg-violet-50' },
  { value: '10+',     label: 'Courses',         icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: '92%',     label: 'Placement Rate',  icon: Trophy,   color: 'text-amber-600',   bg: 'bg-amber-50' },
]

const testimonials = [
  {
    name: 'Rahul Sharma', role: 'SDE at Amazon', ctc: '₹18 LPA', avatar: 'RS', color: 'from-orange-400 to-red-500',
    body: 'Joined Scriptly 4 months before my interviews. The DSA roadmap is incredibly structured — I went from struggling with arrays to solving DP problems confidently. Got my Amazon offer on the first attempt.',
  },
  {
    name: 'Priya Nair', role: 'Frontend at Flipkart', ctc: '₹14 LPA', avatar: 'PN', color: 'from-blue-400 to-violet-500',
    body: 'The best HTML/CSS/JS content I\'ve ever seen. Real interview questions after every lesson. The coding editor is exactly what you face in actual interviews. Scriptly made the difference.',
  },
  {
    name: 'Arjun Mehta', role: 'Backend at Razorpay', ctc: '₹16 LPA', avatar: 'AM', color: 'from-emerald-400 to-teal-500',
    body: 'Progress tracking kept me consistent — I always knew exactly what to study next. The streak system stopped me skipping days. Got 3 offers in 2 weeks of applying.',
  },
]

const painPoints = [
  { color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',    text: 'Watching YouTube for hours but still can\'t solve real interview problems' },
  { color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20',      text: 'Know the theory but freeze when asked to code live' },
  { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',  text: 'Studying randomly with no structured path or progress tracking' },
  { color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',text: 'Overwhelmed by DSA — don\'t know where to even start' },
  { color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/20',    text: 'Paid ₹50K+ for bootcamps that didn\'t prepare for real interviews' },
  { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'Can\'t afford to quit your job to study full-time for 6 months' },
]

const comparison = [
  ['Structured learning path',   'yes', 'no',  'yes'],
  ['Interview-mapped content',   'yes', 'no',  'partial'],
  ['160+ coding problems',       'yes', 'no',  'partial'],
  ['Progress tracking',          'yes', 'no',  'partial'],
  ['Completion certificate',     'yes', 'no',  'yes'],
  ['Cost',                       'Free','Free','₹30K–2L'],
  ['Self-paced (no deadlines)',  'yes', 'yes', 'no'],
  ['Lifetime access',            'yes', 'yes', 'no'],
  ['FAANG-focused problems',     'yes', 'no',  'partial'],
]

const faqs = [
  ['Is Scriptly really free?', 'Yes — core features including courses, 160+ problems, roadmaps, and the playground are completely free. No credit card required.'],
  ['What skill level do I need to start?', 'None. Both DSA and Full Stack paths start from absolute basics. Select "Beginner" during onboarding and we\'ll tailor your experience.'],
  ['How is Scriptly different from YouTube?', 'YouTube has no structure, no progress tracking, no practice problems, and no certificate. Scriptly is a complete learning system — not a playlist.'],
  ['Will this help me crack FAANG interviews?', 'Our students have gotten placed at Amazon, Google, Flipkart, Razorpay, and more. Every problem is tagged by company and difficulty.'],
  ['How does the mock interview work?', 'You pick a difficulty, get a random problem, and have a timed session. Your code is scored and you get instant AI feedback with grading.'],
  ['Can I use Scriptly on mobile?', 'The dashboard, roadmaps, and lesson content are fully mobile-friendly. The code editor works best on desktop.'],
]

const companies = ['Amazon', 'Google', 'Flipkart', 'Razorpay', 'Swiggy', 'Zepto', 'Microsoft', 'PhonePe', 'Zomato', 'Paytm']

function FAQItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${open ? 'border-blue-200 shadow-sm shadow-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-6 py-5 text-left flex justify-between items-center gap-4"
      >
        <span className="text-sm font-semibold text-slate-900">{q}</span>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5">
          <div className="h-px bg-slate-100 mb-4" />
          <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard')
  }, [status, router])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  if (status === 'loading' || status === 'authenticated') return null

  return (
    <div className="min-h-screen bg-white antialiased scroll-smooth">

      {/* ── ANNOUNCEMENT BAR ────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-medium">
        <Sparkles size={12} className="inline align-middle mr-1.5 text-yellow-300" />
        Scriptly is <strong>100% free</strong> — courses, 160+ problems, certificates. No card needed.{' '}
        <Link href="/register" className="underline font-bold ml-1 hover:text-yellow-200 transition-colors">Start now →</Link>
      </div>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
        <div className={`absolute inset-0 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-lg'} border-b border-slate-200/70`} />
        <div className="relative max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-[10px] flex items-center justify-center shadow-md shadow-blue-200 group-hover:shadow-lg group-hover:scale-105 transition-all">
              <Code2 size={15} className="text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">Scriptly</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { href: '/courses',    label: 'Courses' },
              { href: '/problems',   label: 'Problems' },
              { href: '/roadmap',    label: 'Roadmaps' },
              { href: '/playground', label: 'Playground' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-500 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-100/80 transition-all">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all">
              Sign in
            </Link>
            <Link href="/register" className="flex items-center gap-1.5 text-sm font-bold text-white bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-px">
              Get started free <ChevronRight size={14} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMenuOpen(o => !o)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Menu size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-50 px-5 py-4">
            <nav className="flex flex-col gap-1 mb-4">
              {[
                { href: '/courses', label: 'Courses' },
                { href: '/problems', label: 'Problems' },
                { href: '/roadmap', label: 'Roadmaps' },
                { href: '/playground', label: 'Playground' },
              ].map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <Link href="/login" className="flex-1 text-center text-sm font-semibold text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="flex-1 text-center text-sm font-bold text-white bg-blue-600 px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                Get started free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 px-5 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-violet-100/60 rounded-full blur-3xl" />
          <div className="absolute -top-20 -left-40 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-60 bg-gradient-to-t from-white to-transparent" />
          <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left — copy */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-green-200 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 shadow-sm">
                <span className="flex -space-x-1.5">
                  {['bg-orange-400','bg-blue-400','bg-pink-400','bg-emerald-400'].map(c => (
                    <span key={c} className={`w-5 h-5 rounded-full ${c} border-2 border-white`} />
                  ))}
                </span>
                <span>Join 10,000+ students already learning</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>

              <h1 className="text-[2.8rem] sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 leading-[1.08] tracking-tight mb-5">
                From{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Zero to Hired</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-violet-500 rounded-full opacity-40" />
                </span>
                {' '}at Your<br className="hidden sm:block" /> Dream Tech Company
              </h1>

              <p className="text-[1.05rem] text-slate-500 leading-relaxed mb-5 max-w-xl mx-auto lg:mx-0">
                Structured, interview-proven courses in Full Stack Dev & DSA — with real coding problems, progress tracking, mock interviews, and certificates.{' '}
                <strong className="text-slate-800 font-bold">100% free.</strong>
              </p>

              {/* Trust chips */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-slate-500 mb-8">
                {['Free forever', 'Lifetime access', 'Certificate included', '10 languages'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                    <CheckCircle size={12} className="text-emerald-500 shrink-0" /> {t}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8">
                <Link href="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold px-7 py-3.5 rounded-xl text-[0.95rem] transition-all shadow-lg shadow-blue-300/50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                  Start learning free <ArrowRight size={16} />
                </Link>
                <Link href="/playground" className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-700 hover:text-slate-900 font-semibold px-7 py-3.5 rounded-xl text-[0.95rem] border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all">
                  <Terminal size={14} className="text-slate-400" /> Try playground
                </Link>
              </div>

              {/* Social proof row */}
              <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                </div>
                <span className="text-xs text-slate-500"><strong className="text-slate-700">4.9/5</strong> from 500+ students</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">92% placement rate</span>
              </div>
            </div>

            {/* Right — Code editor mockup */}
            <div className="flex-1 w-full max-w-lg mx-auto lg:mx-0">
              <div className="relative">
                {/* Glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-200/40 to-violet-200/40 rounded-3xl blur-2xl" />

                {/* Editor window */}
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/30 border border-slate-800">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-slate-800 rounded-md px-3 py-1 text-[11px] text-slate-400 font-mono">two-sum.js — Scriptly</div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex text-[11px] font-medium border-b border-slate-800">
                    <button className="px-4 py-2 text-white border-b-2 border-blue-500 bg-slate-900/50">Solution</button>
                    <button className="px-4 py-2 text-slate-500 hover:text-slate-300">Test Cases</button>
                    <button className="px-4 py-2 text-slate-500 hover:text-slate-300">Notes</button>
                  </div>

                  {/* Code */}
                  <div className="p-5 font-mono text-[12.5px] leading-relaxed">
                    <div className="flex gap-4">
                      <div className="text-slate-600 text-right select-none" style={{ minWidth: '1.5rem' }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n}>{n}</div>)}
                      </div>
                      <div>
                        <div className="text-slate-400"><span className="text-violet-400">/**</span></div>
                        <div className="text-slate-400"> * <span className="text-slate-300">Two Sum — Easy</span></div>
                        <div className="text-slate-400"> * <span className="text-emerald-400">Hint: Use a hash map for O(n)</span></div>
                        <div className="text-slate-400"><span className="text-violet-400"> */</span></div>
                        <div className="text-slate-300"><span className="text-blue-400">function</span> <span className="text-yellow-300">twoSum</span>(nums, target) {'{'}</div>
                        <div className="text-slate-300 pl-4"><span className="text-blue-400">const</span> map = <span className="text-blue-400">new</span> <span className="text-yellow-300">Map</span>()</div>
                        <div className="text-slate-300 pl-4"><span className="text-blue-400">for</span> (<span className="text-blue-400">let</span> i = <span className="text-orange-400">0</span>; i &lt; nums.length; i++) {'{'}</div>
                        <div className="text-slate-300 pl-8"><span className="text-blue-400">const</span> comp = target - nums[i]</div>
                        <div className="text-slate-500 pl-8">{'// cursor blinks here...'}<span className="inline-block w-0.5 h-3.5 bg-blue-400 ml-0.5 animate-pulse align-middle" /></div>
                        <div className="text-slate-600">&nbsp;</div>
                      </div>
                    </div>
                  </div>

                  {/* Result bar */}
                  <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] text-emerald-400 font-semibold font-mono">Accepted ✓ — Runtime: 72ms</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">beats 94%</span>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-2.5">
                  <Flame size={16} className="text-orange-500" />
                  <div>
                    <p className="text-[11px] font-extrabold text-slate-900 leading-none">42 day streak 🔥</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Keep it going!</p>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg border border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trophy size={13} className="text-amber-500" />
                    <span className="text-[11px] font-bold text-slate-900">Leaderboard #12</span>
                  </div>
                  <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[68%] bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">68 / 100 problems</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── COMPANY LOGOS MARQUEE ───────────────────────────── */}
      <div className="py-8 border-y border-slate-100 bg-white overflow-hidden">
        <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5">Students placed at</p>
        <div className="relative">
          <div className="flex animate-marquee gap-16 whitespace-nowrap">
            {[...companies, ...companies].map((co, i) => (
              <span key={i} className="text-slate-400 font-bold text-sm tracking-tight hover:text-slate-700 transition-colors cursor-default shrink-0">{co}</span>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
      </div>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-slate-50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <s.icon size={20} className={s.color} />
              </div>
              <p className={`text-3xl font-extrabold ${s.color} tracking-tight`}>{s.value}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN POINTS ─────────────────────────────────────── */}
      <section className="relative py-20 px-5 bg-slate-950 text-white overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-5">
            The struggle is real
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">Sound familiar?</h2>
          <p className="text-slate-400 text-base max-w-lg mx-auto">These are the <span className="text-white font-semibold">exact pain points</span> our students come to us with every week.</p>
        </div>

        <div className="relative max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {painPoints.map((p, i) => (
            <div key={i} className={`group relative border rounded-2xl p-5 ${p.bg} hover:scale-[1.02] transition-all duration-200 cursor-default`}>
              <span className="absolute top-4 right-4 text-[10px] font-mono font-bold text-slate-600">0{i + 1}</span>
              <div className={`w-9 h-9 rounded-xl ${p.bg} border flex items-center justify-center mb-4`}>
                <X size={16} className={`${p.color} opacity-80`} />
              </div>
              <p className={`text-sm leading-relaxed text-slate-300`}>{p.text}</p>
            </div>
          ))}
        </div>

        <div className="relative text-center mt-12">
          <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-sm px-6 py-3 rounded-full shadow-lg shadow-blue-600/20">
            <CheckCircle size={15} /> Scriptly is built to fix exactly this
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">Features</span>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Everything to get you hired</h2>
            <p className="text-slate-500 text-lg max-w-md mx-auto">From beginner to interview-ready, all in one place.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={f.title} className="group relative bg-white rounded-2xl border border-slate-200 p-7 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-default">
                {/* Hover gradient fill */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity rounded-2xl`} />
                <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className={`relative w-12 h-12 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="relative font-bold text-slate-900 text-[17px] mb-2 group-hover:text-slate-800">{f.title}</h3>
                <p className="relative text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-emerald-50 text-emerald-600 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">How it works</span>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Get started in 3 steps</h2>
            <p className="text-slate-500 text-lg">A clear path from zero to your dream role.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-[3.5rem] left-[calc(16.66%+3rem)] right-[calc(16.66%+3rem)] h-px">
              <div className="h-px bg-gradient-to-r from-blue-300 via-violet-300 to-emerald-300 opacity-60" />
              <div className="absolute left-0 top-0 transform -translate-x-1 -translate-y-1.5 w-3 h-3 rounded-full bg-blue-400 opacity-60" />
              <div className="absolute right-0 top-0 transform translate-x-1 -translate-y-1.5 w-3 h-3 rounded-full bg-emerald-400 opacity-60" />
            </div>
            {[
              { step: '01', icon: BookOpen, title: 'Sign Up Free',     desc: 'Create your account in 60 seconds. Pick a roadmap or course. No credit card, no paywall.',               color: 'from-blue-500 to-blue-700',    ring: 'ring-blue-100',    bg: 'bg-blue-50' },
              { step: '02', icon: Code2,    title: 'Learn & Practice', desc: 'Follow structured lessons, solve problems in your language, and take timed mock interviews.',            color: 'from-violet-500 to-violet-700', ring: 'ring-violet-100',  bg: 'bg-violet-50' },
              { step: '03', icon: Trophy,   title: 'Get Placed',       desc: 'Earn certificates, climb the leaderboard, build your portfolio, and crack those interviews.',           color: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-100', bg: 'bg-emerald-50' },
            ].map(item => (
              <div key={item.step} className={`${item.bg} rounded-2xl p-8 text-center border border-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200`}>
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-5 shadow-lg ring-4 ${item.ring} group-hover:scale-110`}>
                  <item.icon size={26} className="text-white" />
                  <span className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-white rounded-full border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ────────────────────────────────── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-violet-50 text-violet-600 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">Comparison</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Why not just use YouTube or a bootcamp?</h2>
            <p className="text-slate-500 text-sm">An honest side-by-side — no marketing fluff.</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-4 text-left font-semibold text-slate-500 bg-slate-50 border-b border-slate-200 w-2/5">Feature</th>
                  <th className="px-5 py-4 text-center font-bold text-white bg-gradient-to-br from-blue-600 to-violet-600 border-b border-blue-700">Scriptly ✓</th>
                  <th className="px-5 py-4 text-center font-semibold text-slate-400 bg-slate-50 border-b border-slate-200">YouTube</th>
                  <th className="px-5 py-4 text-center font-semibold text-slate-400 bg-slate-50 border-b border-slate-200">Bootcamps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparison.map(([feat, sc, yt, boot]) => {
                  function cell(v: string) {
                    if (v === 'yes')     return <div className="flex justify-center"><span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">✓</span></div>
                    if (v === 'no')      return <div className="flex justify-center"><span className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-400 text-sm font-bold">✕</span></div>
                    if (v === 'partial') return <span className="text-amber-600 text-[11px] font-bold bg-amber-50 px-2 py-0.5 rounded-full">Varies</span>
                    return <span className="text-slate-600 text-[11px] font-semibold">{v}</span>
                  }
                  return (
                    <tr key={feat} className="group hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-slate-700 group-hover:text-slate-900">{feat}</td>
                      <td className="px-5 py-4 text-center bg-blue-50/40">{cell(sc)}</td>
                      <td className="px-5 py-4 text-center">{cell(yt)}</td>
                      <td className="px-5 py-4 text-center">{cell(boot)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ──────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">This is what changes after Scriptly</h2>
            <p className="text-slate-400 text-sm">Real outcomes from students who committed to the platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-red-900/40">
              <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-900/50 text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Before Scriptly
              </div>
              <div className="space-y-3">
                {[
                  'Hours on YouTube with no clear direction',
                  'Know theory but blank out in live interviews',
                  'Random LeetCode grind with no strategy',
                  '100+ applications with zero callbacks',
                  'Feeling behind peers who seem to "get it"',
                  'No idea how to structure a real project',
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <X size={11} className="text-red-400" />
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-emerald-500/30 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
              <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-900/50 text-green-400 text-[11px] font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> After Scriptly
              </div>
              <div className="space-y-3">
                {[
                  'Clear daily plan — know exactly what to study',
                  'Solving problems confidently under pressure',
                  'Pattern-based approach to every DSA problem',
                  'Targeted prep for product companies',
                  'Certificate & portfolio that stand out on LinkedIn',
                  'Got offers from Amazon, Flipkart, Razorpay & more',
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={11} className="text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-900/30">
              I want the "After" <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-pink-50 text-pink-600 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">Student Stories</span>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Real results, not hype</h2>
            <p className="text-slate-500 text-lg">Stories from developers who leveled up with Scriptly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={t.name} className="group relative bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                {/* Top accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.color}`} />

                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                </div>

                <div className="inline-flex self-start mb-4">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">Got {t.ctc} offer 🎉</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6 italic">&ldquo;{t.body}&rdquo;</p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEADERBOARD PREVIEW ─────────────────────────────── */}
      <section className="py-20 px-5 bg-[#0b0f1a]">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-14">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold px-4 py-2 rounded-full mb-5">
              <BarChart2 size={12} /> Leaderboard
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">Compete with developers worldwide</h2>
            <p className="text-slate-400 text-base leading-relaxed mb-7 max-w-md">Earn points for every problem solved — Hard problems worth 3×. Climb the All-Time and Weekly rankings.</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-400/20 hover:-translate-y-0.5">
              Join the leaderboard <ArrowRight size={15} />
            </Link>
          </div>

          <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl shadow-black/50">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-amber-400" />
                <span className="text-sm font-bold text-slate-200">Top Coders</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">This Week</span>
            </div>
            {[
              { rank: '🥇', name: 'Alex K.',  pts: 840, streak: 42, color: 'text-yellow-300' },
              { rank: '🥈', name: 'Priya M.', pts: 710, streak: 28, color: 'text-slate-300' },
              { rank: '🥉', name: 'Jonas R.', pts: 590, streak: 15, color: 'text-orange-300' },
              { rank: '#4',  name: 'You?',     pts: 0,   streak: 0,  color: 'text-blue-300' },
            ].map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-4 border-b border-slate-800/60 last:border-0 transition-colors ${i === 3 ? 'bg-blue-900/20 border-blue-900/30' : 'hover:bg-slate-800/40'}`}>
                <span className="text-base w-6 text-center shrink-0">{r.rank}</span>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${i === 0 ? 'from-yellow-400 to-orange-500' : i === 1 ? 'from-slate-400 to-slate-600' : i === 2 ? 'from-orange-400 to-amber-500' : 'from-blue-500 to-violet-600'} flex items-center justify-center text-xs font-bold text-white shrink-0`}>{r.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${r.color}`}>{r.name}</p>
                  {r.streak > 0 && <p className="text-[10px] text-orange-400 flex items-center gap-1 mt-0.5"><Flame size={9} /> {r.streak}d streak</p>}
                  {i === 3 && <p className="text-[10px] text-blue-400 mt-0.5">← Your spot waiting</p>}
                </div>
                <span className="text-xs font-black text-amber-400 shrink-0">{r.pts > 0 ? `${r.pts} pts` : <span className="text-slate-600 font-normal text-xs">—</span>}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-white" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-amber-50 text-amber-600 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">Pricing</span>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Simple, honest pricing</h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">One-time payment. Lifetime access. No subscriptions, no hidden fees.</p>
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-2 rounded-full mt-4">
              <Sparkles size={12} className="text-green-500" /> Use code <strong className="bg-green-100 px-1.5 py-0.5 rounded font-mono mx-1">LAUNCH50</strong> for 50% off — limited time!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Full Stack */}
            <div className="bg-white border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-7 flex flex-col transition-all hover:shadow-xl group">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Code2 size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Full Stack Dev</h3>
              <p className="text-slate-500 text-sm mb-5 leading-relaxed">HTML, CSS, JavaScript, React, Node.js — everything to build and ship real web apps.</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">₹749</span>
                <span className="text-slate-400 line-through mb-1 text-lg">₹1,499</span>
              </div>
              <span className="text-green-600 text-xs font-bold mb-5">50% off — save ₹750</span>
              <ul className="space-y-2 mb-7 flex-1">
                {['60+ lessons across 6 modules','HTML, CSS, JS, React, Node, MongoDB','Real project builds with source code','1:1 problem sets after every lesson','Course completion certificate'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/courses" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                <Zap size={14} /> Enroll — ₹749
              </Link>
            </div>

            {/* DSA — Popular */}
            <div className="relative bg-gradient-to-br from-blue-600 to-violet-700 rounded-2xl p-7 flex flex-col shadow-2xl shadow-blue-200 scale-[1.02]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[11px] font-extrabold px-4 py-1.5 rounded-full shadow-md">
                🔥 MOST POPULAR
              </div>
              <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center mb-4">
                <BarChart2 size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">DSA Mastery</h3>
              <p className="text-blue-100 text-sm mb-5 leading-relaxed">Arrays to DP — structured DSA roadmap with 160+ company-tagged practice problems.</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold text-white">₹649</span>
                <span className="text-blue-300 line-through mb-1 text-lg">₹1,299</span>
              </div>
              <span className="text-green-300 text-xs font-bold mb-5">50% off — save ₹650</span>
              <ul className="space-y-2 mb-7 flex-1">
                {['50+ lessons — beginner to advanced','Arrays, Strings, Trees, Graphs, DP','160+ LeetCode-style problems','FAANG-tagged question bank','Mock interview sessions'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-blue-100">
                    <CheckCircle size={14} className="text-green-300 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/courses" className="w-full flex items-center justify-center gap-2 bg-white text-blue-700 font-bold py-3 rounded-xl text-sm transition-colors hover:bg-blue-50">
                <Zap size={14} /> Enroll — ₹649
              </Link>
            </div>

            {/* Bundle */}
            <div className="relative bg-slate-950 border-2 border-amber-400/30 hover:border-amber-400/60 rounded-2xl p-7 flex flex-col transition-all hover:shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[11px] font-extrabold px-4 py-1.5 rounded-full shadow-md">
                BEST VALUE ⚡
              </div>
              <div className="w-11 h-11 bg-amber-400/15 rounded-xl flex items-center justify-center mb-4">
                <Trophy size={20} className="text-amber-400" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">Complete Bundle</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">Full Stack + DSA — the complete package to get hired at top tech companies.</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold text-white">₹999</span>
                <span className="text-slate-500 line-through mb-1 text-lg">₹2,798</span>
              </div>
              <span className="text-amber-400 text-xs font-bold mb-5">Save ₹1,799 — best deal</span>
              <ul className="space-y-2 mb-7 flex-1">
                {['Everything in Full Stack + DSA','Priority support','All future updates included','System Design course (coming soon)','2× certificates'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle size={14} className="text-amber-400 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/courses" className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-xl text-sm transition-colors">
                <Zap size={14} /> Get Bundle — ₹999
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
            <Shield size={12} className="text-slate-400" /> Secured by Razorpay · One-time payment · Lifetime access · No subscription
          </p>
        </div>
      </section>

      {/* ── GUARANTEE / FREE ────────────────────────────────── */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl" />
            <div className="relative flex items-start gap-5">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                <Shield size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">100% Free — No Catch</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">No freemium paywalls, no hidden subscription, no credit card ever. Core features are genuinely free for life.</p>
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold bg-white border border-emerald-200 px-3 py-2 rounded-lg w-fit">
                  <CheckCircle size={13} /> Start in 60 seconds — no card needed
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
            <h3 className="text-base font-extrabold text-slate-900 mb-5">Everything included, free</h3>
            <div className="space-y-4">
              {[
                { icon: <BookOpen size={15} className="text-blue-600" />,    bg: 'bg-blue-50',    text: '10+ structured courses with step-by-step lessons' },
                { icon: <Code2 size={15} className="text-violet-600" />,     bg: 'bg-violet-50',  text: '160+ LeetCode-quality problems with instant feedback' },
                { icon: <Trophy size={15} className="text-amber-600" />,     bg: 'bg-amber-50',   text: 'Course completion certificates (verifiable & shareable)' },
                { icon: <Clock size={15} className="text-emerald-600" />,    bg: 'bg-emerald-50', text: 'Lifetime access — study at your own pace, no deadline' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center shrink-0`}>{item.icon}</div>
                  <p className="text-sm text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">FAQ</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Questions? Answered.</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(([q, a], i) => (
              <FAQItem key={i} q={q} a={a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="relative py-28 px-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_bottom,rgba(255,255,255,0.08),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Floating orbs */}
        <div className="absolute top-10 left-[10%] w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-[10%] w-56 h-56 bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-4 py-2 rounded-full mb-5">
            <Sparkles size={12} className="text-yellow-300" /> Free forever — no credit card needed
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 tracking-tight leading-[1.1]">
            Start your journey today
          </h2>
          <p className="text-blue-100 mb-9 text-lg max-w-lg mx-auto leading-relaxed">
            Join 10,000+ developers getting placed at Amazon, Google, Flipkart and more — with Scriptly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-9 py-4 rounded-xl text-base hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/30 hover:-translate-y-0.5 active:translate-y-0">
              Create free account <ArrowRight size={17} />
            </Link>
            <Link href="/playground" className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-9 py-4 rounded-xl text-base transition-all">
              <Terminal size={15} /> Try it first
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} className="text-amber-300 fill-amber-300" />)}
            </div>
            <span className="text-blue-200 text-sm">Loved by 10,000+ developers</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-500">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-[10px] flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
                  <Code2 size={15} className="text-white" />
                </div>
                <span className="font-extrabold text-white text-lg tracking-tight">Scriptly</span>
              </Link>
              <p className="text-sm leading-relaxed text-slate-500 max-w-xs mb-5">
                Structured, interview-focused coding education. Free forever — built for developers serious about leveling up.
              </p>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
                <span className="text-xs text-slate-600 ml-2">4.9/5 from 500+ students</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All systems operational
              </div>
            </div>

            {[
              { title: 'Learn',    links: [['Courses', '/courses'], ['Roadmaps', '/roadmap'], ['Problems', '/problems'], ['Playground', '/playground']] },
              { title: 'Practice', links: [['Mock Interviews', '/interview'], ['Leaderboard', '/leaderboard'], ['Badges', '/badges'], ['Certificates', '/certificates']] },
              { title: 'Account',  links: [['Sign up free', '/register'], ['Sign in', '/login'], ['Dashboard', '/dashboard'], ['Settings', '/settings']] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={href}><Link href={href} className="text-sm text-slate-500 hover:text-white transition-colors">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} Scriptly. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {[['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
                <Link key={href} href={href} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA ───────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-xl">
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight">100% free — no credit card 🎉</p>
            <p className="text-[11px] text-slate-500 mt-0.5">10,000+ students already learning</p>
          </div>
          <Link href="/register" className="shrink-0 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:from-blue-500 hover:to-violet-500 transition-all shadow-md shadow-blue-200">
            Start free →
          </Link>
        </div>
      </div>

    </div>
  )
}
