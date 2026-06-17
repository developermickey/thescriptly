import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE = process.env.NEXTAUTH_URL ?? 'https://codex.dev'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, problems, certs] = await Promise.all([
    prisma.course.findMany({ select: { id: true } }),
    prisma.practiceQuestion.findMany({ select: { id: true, createdAt: true } }),
    prisma.certificate.findMany({ where: { certificateCode: { not: null } }, select: { certificateCode: true, createdAt: true } }),
  ])

  const statics: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/courses`,   changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/problems`,  changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/roadmap`,   changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/topics`,    changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/companies`, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/leaderboard`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE}/login`,     changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/register`,  changeFrequency: 'monthly', priority: 0.5 },
  ]

  const courseUrls: MetadataRoute.Sitemap = courses.map(c => ({
    url: `${BASE}/courses/${c.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const problemUrls: MetadataRoute.Sitemap = problems.map(p => ({
    url: `${BASE}/problems/${p.id}`,
    lastModified:    p.createdAt,
    changeFrequency: 'monthly',
    priority:        0.6,
  }))

  const certUrls: MetadataRoute.Sitemap = certs.map(c => ({
    url: `${BASE}/certificates/${c.certificateCode}`,
    lastModified:    c.createdAt,
    changeFrequency: 'never',
    priority:        0.4,
  }))

  return [...statics, ...courseUrls, ...problemUrls, ...certUrls]
}
