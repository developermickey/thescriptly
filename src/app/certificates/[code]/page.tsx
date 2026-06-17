import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CheckCircle, GraduationCap, Award, BookOpen, Calendar } from 'lucide-react'
import Link from 'next/link'
import { PrintButton } from './PrintButton'
import { ShareButtons } from './ShareButtons'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const cert = await prisma.certificate.findUnique({
    where: { certificateCode: code.toUpperCase() },
    select: { user: { select: { name: true } }, course: { select: { title: true } } },
  })
  if (!cert) return { title: 'Certificate Not Found' }
  const title = `${cert.user.name}'s Certificate — ${cert.course.title}`
  return {
    title,
    description: `${cert.user.name} completed "${cert.course.title}" on Codex. Verify this certificate.`,
    openGraph: {
      title,
      description: `${cert.user.name} completed "${cert.course.title}" on Codex.`,
    },
  }
}

export default async function PublicCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certificateCode: code.toUpperCase() },
    include: {
      user:   { select: { name: true } },
      course: { select: { title: true, category: true, modules: { include: { lessons: { select: { id: true } } } } } },
    },
  })

  if (!cert) notFound()

  const totalLessons = cert.course.modules.reduce((s, m) => s + m.lessons.length, 0)
  const issuedDate   = new Date(cert.completionDate ?? cert.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-8">
      {/* Verified badge */}
      <div className="mb-6 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold px-4 py-2 rounded-full print:hidden">
        <CheckCircle size={15} /> Certificate Verified
      </div>

      {/* Certificate card */}
      <div
        id="certificate"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 print:shadow-none print:rounded-none print:border-0"
      >
        <div className="h-2 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600" />

        <div className="px-12 py-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-200">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">Certificate of Completion</p>
          <p className="text-slate-600 text-base mb-1">This certifies that</p>

          <h1 className="text-3xl font-bold text-slate-900 my-3">{cert.user.name}</h1>

          <p className="text-slate-600 text-base mb-1">has successfully completed</p>

          <h2 className="text-2xl font-bold text-blue-700 mt-2 mb-1">{cert.course.title}</h2>

          {cert.course.category && (
            <p className="text-sm text-slate-400 mb-6">{cert.course.category} · {totalLessons} lessons</p>
          )}

          <div className="border-t border-slate-100 my-6" />

          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1 justify-center">
                <Calendar size={13} /> Issue Date
              </div>
              <p className="font-bold text-slate-700">{issuedDate}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1 justify-center">
                <Award size={13} /> Certificate ID
              </div>
              <code className="font-mono font-bold text-slate-700 tracking-wider">{cert.certificateCode}</code>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-6 pt-4">
            <p className="text-xs text-slate-300">Issued by Codex · codex.dev</p>
          </div>
        </div>

        <div className="h-2 bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500" />
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center print:hidden">
        <PrintButton />
        <ShareButtons
          certCode={cert.certificateCode!}
          courseName={cert.course.title}
          userName={cert.user.name}
        />
        <Link
          href="/courses"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <BookOpen size={15} /> Browse Courses on Codex
        </Link>
      </div>

      <p className="mt-4 text-xs text-slate-400 print:hidden">
        Share this URL to let anyone verify this certificate — no account required.
      </p>
    </div>
  )
}
