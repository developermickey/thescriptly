import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const mono  = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Codex — Learn to Code', template: '%s · Codex' },
  description: 'Master programming with interactive courses, 160+ coding challenges, mock interviews, and learning roadmaps. Earn certificates and track your progress.',
  keywords: ['coding', 'programming', 'DSA', 'data structures', 'algorithms', 'interview prep', 'JavaScript', 'Python'],
  openGraph: {
    type:        'website',
    siteName:    'Codex',
    title:       'Codex — Learn to Code',
    description: 'Interactive coding education: courses, challenges, mock interviews & certificates.',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Codex — Learn to Code',
    description: 'Interactive coding education: courses, challenges, mock interviews & certificates.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');}catch(e){}})();
        `}</Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
