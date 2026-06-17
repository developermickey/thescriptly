import Link from 'next/link'
import { Code2, ArrowLeft, Search, BookOpen } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Animated code block */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-200">
            <Code2 size={44} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
            !
          </div>
        </div>

        <div className="font-mono text-6xl font-black text-slate-200 mb-2 select-none">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Page not found</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Looks like this page doesn&apos;t exist or was moved. Don&apos;t worry — there&apos;s plenty more to explore.
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { href: '/dashboard',  icon: Code2,    label: 'Dashboard'  },
            { href: '/problems',   icon: Search,   label: 'Problems'   },
            { href: '/courses',    icon: BookOpen, label: 'Courses'    },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:shadow-sm transition-all"
            >
              <Icon size={15} /> {label}
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
    </div>
  )
}
