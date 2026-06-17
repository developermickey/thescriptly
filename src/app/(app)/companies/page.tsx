import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, CheckCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Companies' }

const COMPANY_META: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  'Google':    { emoji: '🔵', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  'Meta':      { emoji: '🟣', color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  'Amazon':    { emoji: '🟠', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  'Microsoft': { emoji: '🟩', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Apple':     { emoji: '🍎', color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  'Netflix':   { emoji: '🔴', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  'Uber':      { emoji: '⚫', color: 'text-gray-700',    bg: 'bg-gray-50',    border: 'border-gray-200' },
  'Twitter':   { emoji: '🐦', color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200' },
  'LinkedIn':  { emoji: '💼', color: 'text-blue-800',    bg: 'bg-blue-50',    border: 'border-blue-300' },
  'Stripe':    { emoji: '💳', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  'Airbnb':    { emoji: '🏠', color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  'Spotify':   { emoji: '🎵', color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200' },
}
const DEFAULT_META = { emoji: '🏢', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' }

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions)
  const rawId   = parseInt((session?.user as any)?.id)
  const userId  = isNaN(rawId) ? -1 : rawId

  const [problems, solvedRaw] = await Promise.all([
    prisma.practiceQuestion.findMany({
      where:  { company: { not: null } },
      select: { id: true, difficulty: true, company: true },
    }),
    userId > 0
      ? prisma.submission.findMany({
          where: { userId, status: 'accepted' }, distinct: ['questionId'], select: { questionId: true },
        })
      : Promise.resolve([]),
  ])

  const solvedSet = new Set(solvedRaw.map((s: any) => s.questionId))

  type CompanyData = { total: number; solved: number; easy: number; medium: number; hard: number }
  const companyMap: Record<string, CompanyData> = {}

  for (const p of problems) {
    const c = p.company!
    if (!companyMap[c]) companyMap[c] = { total: 0, solved: 0, easy: 0, medium: 0, hard: 0 }
    companyMap[c].total++
    if (solvedSet.has(p.id)) companyMap[c].solved++
    if (p.difficulty === 'Easy')   companyMap[c].easy++
    if (p.difficulty === 'Medium') companyMap[c].medium++
    if (p.difficulty === 'Hard')   companyMap[c].hard++
  }

  const knownOrder = Object.keys(COMPANY_META)
  const sorted = (Object.entries(companyMap) as [string, CompanyData][]).sort(([a, ad], [b, bd]) => {
    const ai = knownOrder.indexOf(a), bi = knownOrder.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1; if (bi !== -1) return 1
    return bd.total - ad.total
  })

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 size={20} className="text-blue-600" /> Companies
        </h1>
        <p className="text-slate-500 text-sm mt-1">Practice problems asked in real interviews at top companies.</p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-slate-400 text-center py-16">No company-tagged problems yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(([company, data]) => {
            const meta = COMPANY_META[company] ?? DEFAULT_META
            const pct  = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0
            return (
              <Link
                key={company}
                href={`/problems?company=${encodeURIComponent(company)}`}
                className={`group block bg-white border ${meta.border} rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.emoji}</span>
                    <div>
                      <h3 className={`font-bold text-sm ${meta.color} group-hover:underline`}>{company}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{data.total} problems</p>
                    </div>
                  </div>
                  {pct === 100 && <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />}
                </div>

                <div className="flex gap-1.5 mb-3">
                  {data.easy > 0   && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">{data.easy}E</span>}
                  {data.medium > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100  text-amber-700  rounded-full">{data.medium}M</span>}
                  {data.hard > 0   && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100    text-red-700    rounded-full">{data.hard}H</span>}
                </div>

                {userId > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>{data.solved}/{data.total} solved</span>
                      <span className={`font-bold ${pct === 100 ? 'text-emerald-600' : meta.color}`}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
