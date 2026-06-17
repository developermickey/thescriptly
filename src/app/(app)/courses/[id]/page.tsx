import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  BookOpen, CheckCircle, Clock, ChevronRight, Play, Lock,
  Users, Zap, Star, Code2, FileText, HelpCircle, Award,
  BarChart2, Globe, Shield, Flame, Layers,
} from 'lucide-react'
import Link from 'next/link'
import { EnrollButton } from './EnrollButton'
import { CourseRating } from '@/components/CourseRating'
import { CurriculumAccordion } from './CurriculumAccordion'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const course = await prisma.course.findUnique({
    where: { id: parseInt(id) },
    select: { title: true, description: true, category: true },
  })
  if (!course) return {}
  return {
    title: `${course.title} · Scriptly`,
    description: course.description ?? `Learn ${course.title} on Scriptly.`,
  }
}

const gradients = [
  { from: 'from-blue-600',   to: 'to-cyan-500',    accent: '#2563eb' },
  { from: 'from-violet-600', to: 'to-purple-500',  accent: '#7c3aed' },
  { from: 'from-orange-500', to: 'to-amber-400',   accent: '#f97316' },
  { from: 'from-emerald-600',to: 'to-teal-500',    accent: '#059669' },
  { from: 'from-pink-600',   to: 'to-rose-500',    accent: '#e11d48' },
  { from: 'from-slate-700',  to: 'to-slate-900',   accent: '#475569' },
  { from: 'from-indigo-600', to: 'to-blue-500',    accent: '#4338ca' },
  { from: 'from-teal-600',   to: 'to-cyan-500',    accent: '#0d9488' },
]

function lessonIcon(type: string) {
  switch (type) {
    case 'video': return <Play size={12} className="text-blue-500" />
    case 'quiz':  return <HelpCircle size={12} className="text-amber-500" />
    case 'code':  return <Code2 size={12} className="text-emerald-500" />
    default:      return <FileText size={12} className="text-slate-400" />
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params
  const session  = await getServerSession(authOptions)
  const rawId    = parseInt((session?.user as any)?.id)
  const userId   = isNaN(rawId) ? -1 : rawId
  const courseId = parseInt(id)

  const [course, totalEnrollments, ratingAgg] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
        },
        enrollments: { where: { userId }, select: { id: true } },
      },
    }),
    prisma.enrollment.count({ where: { courseId } }),
    prisma.courseRating.aggregate({
      where:  { courseId },
      _avg:   { rating: true },
      _count: { rating: true },
    }),
  ])

  if (!course) notFound()

  const enrolled     = course.enrollments.length > 0
  const allIds       = course.modules.flatMap(m => m.lessons.map(l => l.id))
  const totalLessons = allIds.length
  const completed    = allIds.length > 0
    ? await prisma.lessonProgress.findMany({ where: { userId, lessonId: { in: allIds } }, select: { lessonId: true } })
    : []
  const doneIds = new Set(completed.map(c => c.lessonId))
  const pct     = totalLessons > 0 ? Math.round(doneIds.size / totalLessons * 100) : 0

  const firstLesson    = course.modules[0]?.lessons[0]
  const continueLesson = enrolled
    ? course.modules.flatMap(m => m.lessons).find(l => !doneIds.has(l.id)) ?? firstLesson
    : firstLesson

  const grad     = gradients[courseId % gradients.length]
  const rating   = ratingAgg._avg.rating ?? 0
  const ratingCt = ratingAgg._count.rating
  const totalHrs = Math.round(totalLessons * 12 / 60 * 10) / 10

  const discount = course.price && course.mrp && Number(course.mrp) > Number(course.price)
    ? Math.round(((Number(course.mrp) - Number(course.price)) / Number(course.mrp)) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ── */}
      <div className={`bg-gradient-to-br ${grad.from} ${grad.to} relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -right-32 -top-32 w-[500px] h-[500px] bg-white/5 rounded-full" />
        <div className="absolute -left-20 bottom-0 w-72 h-72 bg-black/10 rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto px-6 pt-8 pb-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/50 text-xs mb-6">
            <Link href="/courses" className="hover:text-white transition-colors font-medium">Courses</Link>
            <ChevronRight size={12} />
            {course.category && (
              <>
                <span className="hover:text-white/80">{course.category}</span>
                <ChevronRight size={12} />
              </>
            )}
            <span className="text-white/80 truncate max-w-xs">{course.title}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Left — copy */}
            <div className="flex-1 pb-10">
              {course.category && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/15 text-white border border-white/20 mb-4">
                  {course.category}
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-white/75 text-base leading-relaxed max-w-2xl mb-6">
                  {course.description}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                {ratingCt > 0 && (
                  <span className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-white/30'} />
                      ))}
                    </div>
                    <span className="font-bold text-white">{rating.toFixed(1)}</span>
                    <span className="text-white/50">({ratingCt} reviews)</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-white/50" />
                  <strong className="text-white">{totalEnrollments.toLocaleString()}</strong> students
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} className="text-white/50" />
                  <strong className="text-white">{totalLessons}</strong> lessons
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-white/50" />
                  ~<strong className="text-white">{totalHrs}h</strong> total
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe size={14} className="text-white/50" />
                  English
                </span>
              </div>

              {/* Enrolled progress bar */}
              {enrolled && (
                <div className="mt-6 bg-white/10 rounded-2xl px-5 py-4 border border-white/15 max-w-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-semibold">Your progress</span>
                    <span className="text-white font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="h-2 bg-white rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-white/60 text-xs mt-1.5">{doneIds.size} of {totalLessons} lessons completed</p>
                </div>
              )}
            </div>

            {/* Right — sticky card (desktop) */}
            <div className="hidden lg:block w-80 shrink-0 relative">
              <div className="sticky top-20 translate-y-8">
                <CourseCard
                  courseId={courseId}
                  course={course}
                  enrolled={enrolled}
                  pct={pct}
                  doneIds={doneIds}
                  totalLessons={totalLessons}
                  continueLesson={continueLesson}
                  firstLesson={firstLesson}
                  discount={discount}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Quick stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              {[
                { icon: <BarChart2 size={16} className="text-blue-600" />,   bg: 'bg-blue-50',    label: 'Skill level',  val: course.category ?? 'All levels' },
                { icon: <Clock size={16} className="text-violet-600" />,     bg: 'bg-violet-50',  label: 'Duration',     val: `~${totalHrs}h` },
                { icon: <BookOpen size={16} className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Lessons',      val: String(totalLessons) },
                { icon: <Globe size={16} className="text-amber-600" />,      bg: 'bg-amber-50',   label: 'Language',     val: 'English' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>{s.icon}</div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
                    <p className="text-sm font-bold text-slate-800">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* What you'll learn */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle size={18} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">What you&apos;ll learn</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Skills and topics covered in this course</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(course.whatYouLearn
                  ? (() => {
                      try {
                        const parsed = JSON.parse(course.whatYouLearn)
                        return Array.isArray(parsed) ? parsed : course.whatYouLearn.split('\n').filter(Boolean).map((s: string) => s.replace(/^[-•*]\s*/, ''))
                      } catch {
                        return course.whatYouLearn.split('\n').filter(Boolean).map((s: string) => s.replace(/^[-•*]\s*/, ''))
                      }
                    })()
                  : course.modules.map((m: any) => m.title)
                ).map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={10} className="text-white" />
                    </div>
                    <span className="text-sm text-slate-700 leading-relaxed font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course description — rich content */}
            {course.description && (
              <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">About this course</h2>
                    <p className="text-xs text-slate-400 mt-0.5">What you&apos;ll do in this course</p>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-slate-600 leading-relaxed">{course.description}</p>
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Skill level', value: course.category ?? 'All levels', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                      { label: 'Lessons',     value: `${totalLessons} lessons`,       color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                      { label: 'Duration',    value: `~${totalHrs} hours`,            color: 'bg-amber-50 text-amber-700 border-amber-100' },
                    ].map(s => (
                      <div key={s.label} className={`${s.color} border rounded-xl px-4 py-3 text-center`}>
                        <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">{s.label}</p>
                        <p className="font-bold text-lg mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <BarChart2 size={18} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Requirements</h2>
                  <p className="text-xs text-slate-400 mt-0.5">What you need before starting</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'A computer or laptop with a modern browser (Chrome / Firefox / Safari)',
                  'Stable internet connection for video lessons and the code editor',
                  'No prior coding experience needed — we start from absolute scratch',
                  'Consistency: 30–60 minutes per day is enough to complete in 8 weeks',
                ].map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-extrabold text-amber-600">{i + 1}</span>
                    </div>
                    <span className="text-sm text-slate-600 leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Curriculum */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6">
              <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900">Course Content</h2>
                <span className="text-xs text-slate-400 font-medium">
                  {course.modules.length} sections · {totalLessons} lessons · ~{totalHrs}h
                </span>
              </div>
              <CurriculumAccordion
                modules={course.modules}
                enrolled={enrolled}
                doneIds={Array.from(doneIds)}
              />
            </div>

            {/* Instructor */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900 mb-5">Your Instructor</h2>
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xl font-extrabold shrink-0 shadow-md">
                  M
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-lg leading-tight">Mukesh Pathak</p>
                  <p className="text-sm text-blue-600 font-semibold mb-3">Full Stack Engineer & DSA Instructor</p>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {[
                      { icon: <Star size={13} className="text-amber-400 fill-amber-400" />,   label: '4.9 Instructor Rating' },
                      { icon: <Users size={13} className="text-blue-500" />,                   label: '10,000+ Students' },
                      { icon: <BookOpen size={13} className="text-emerald-500" />,             label: '10+ Courses' },
                      { icon: <Award size={13} className="text-violet-500" />,                 label: '200+ Mock Interviews' },
                    ].map(s => (
                      <span key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                        {s.icon} {s.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    5+ years building production web apps. Helped 10,000+ students get placed at companies like Amazon, Flipkart, Razorpay and more. Specialises in making complex concepts click fast.
                  </p>
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900 mb-5">Student Reviews</h2>
              <CourseRating courseId={courseId} enrolled={enrolled} />
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="lg:hidden">
            <CourseCard
              courseId={courseId}
              course={course}
              enrolled={enrolled}
              pct={pct}
              doneIds={doneIds}
              totalLessons={totalLessons}
              continueLesson={continueLesson}
              firstLesson={firstLesson}
              discount={discount}
            />
          </div>

        </div>
      </div>

    </div>
  )
}

// ── Shared CTA card ──────────────────────────────────────────────────────────
function CourseCard({
  courseId, course, enrolled, pct, doneIds, totalLessons,
  continueLesson, firstLesson, discount,
}: {
  courseId: number
  course: any
  enrolled: boolean
  pct: number
  doneIds: Set<number>
  totalLessons: number
  continueLesson: any
  firstLesson: any
  discount: number
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Course thumbnail / gradient banner */}
      <div className={`h-36 bg-gradient-to-br ${
        ['from-blue-500 to-cyan-400','from-violet-500 to-purple-400','from-orange-400 to-amber-300','from-emerald-500 to-teal-400'][courseId % 4]
      } relative flex items-center justify-center`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
            <BookOpen size={26} className="text-white" />
          </div>
          <p className="text-white font-bold text-sm">{course.title}</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {enrolled ? (
          <>
            {/* Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-900">Your progress</span>
                <span className="text-sm font-extrabold text-blue-600">{pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="h-2.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{doneIds.size} of {totalLessons} lessons done</p>
            </div>

            {continueLesson && (
              <Link
                href={`/lessons/${continueLesson.id}`}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-blue-200 hover:-translate-y-0.5"
              >
                <Zap size={15} />
                {pct === 0 ? 'Start Learning' : pct === 100 ? 'Review Course' : 'Continue Learning'}
              </Link>
            )}

            {pct === 100 && (
              <Link href="/certificates" className="flex items-center justify-center gap-2 w-full border border-amber-200 bg-amber-50 text-amber-700 font-bold text-sm py-3 rounded-xl hover:bg-amber-100 transition-colors">
                <Award size={14} /> Get Your Certificate
              </Link>
            )}
          </>
        ) : (
          <>
            {/* Price */}
            {!course.isFree ? (
              <div>
                <div className="flex items-end gap-2.5">
                  <span className="text-3xl font-extrabold text-slate-900">₹{Number(course.price)}</span>
                  {course.mrp && Number(course.mrp) > Number(course.price ?? 0) && (
                    <span className="text-slate-400 line-through text-lg mb-0.5">₹{Number(course.mrp)}</span>
                  )}
                  {discount > 0 && (
                    <span className="bg-green-100 text-green-700 text-xs font-extrabold px-2.5 py-1 rounded-full mb-0.5">{discount}% OFF</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">One-time payment · Lifetime access</p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-extrabold text-emerald-600">Free</p>
                <p className="text-xs text-slate-400 mt-0.5">Enroll to start tracking progress</p>
              </div>
            )}

            <EnrollButton
              courseId={courseId}
              isFree={course.isFree}
              price={course.price ? Number(course.price) : null}
              mrp={course.mrp ? Number(course.mrp) : null}
              title={course.title}
            />

            {firstLesson && (
              <Link
                href={`/lessons/${firstLesson.id}`}
                className="flex items-center justify-center gap-2 w-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 font-semibold text-sm py-3 rounded-xl hover:bg-slate-50 transition-all"
              >
                <Play size={13} /> Preview first lesson free
              </Link>
            )}

            {/* Guarantees */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {[
                { icon: <Shield size={13} className="text-emerald-500" />, text: 'Secured by Razorpay' },
                { icon: <Flame size={13} className="text-orange-500" />,  text: 'Lifetime access' },
                { icon: <Award size={13} className="text-blue-500" />,    text: 'Certificate on completion' },
                { icon: <Globe size={13} className="text-violet-500" />,  text: 'Access on mobile & desktop' },
              ].map(g => (
                <div key={g.text} className="flex items-center gap-2 text-xs text-slate-500">
                  {g.icon} {g.text}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
