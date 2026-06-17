import { MetadataRoute } from 'next'

const BASE = process.env.NEXTAUTH_URL ?? 'https://codex.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/courses', '/problems', '/roadmap', '/topics', '/companies', '/leaderboard', '/certificates'],
        disallow: ['/dashboard', '/settings', '/admin', '/api', '/notes', '/submissions'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
