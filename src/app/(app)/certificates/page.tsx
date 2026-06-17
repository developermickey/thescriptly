import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GraduationCap, Award, BookOpen, ExternalLink } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  const userId  = parseInt((session?.user as any)?.id)

  const certs = await prisma.certificate.findMany({
    where: { userId },
    include: { course: { select: { title: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Certificates</h1>
          <p className="text-slate-500 mt-1 text-sm">Certificates earned by completing courses.</p>
        </div>
        <div className="text-3xl font-bold text-slate-200">{certs.length > 0 ? certs.length : '—'}</div>
      </div>

      {certs.length === 0 ? (
        <Card>
          <CardBody className="text-center py-20">
            <GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-600 font-bold text-lg">No certificates yet</p>
            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Complete any course to earn your first certificate. They&apos;re yours to keep and share.</p>
            <Link href="/courses" className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
              <BookOpen size={15} /> Browse Courses
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certs.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-violet-600" />
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Award size={11} /> Certificate of Completion
                    </p>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{cert.course.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Issued {new Date(cert.completionDate ?? cert.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Certificate ID</p>
                        <code className="text-xs font-mono text-slate-700 tracking-wider font-bold">{cert.certificateCode}</code>
                      </div>
                      <Link
                        href={`/certificates/${cert.certificateCode}`}
                        className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-700 shrink-0"
                      >
                        <ExternalLink size={11} /> View
                      </Link>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
