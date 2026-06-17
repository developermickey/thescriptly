'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Code, Trophy, ShieldCheck, User, Search, X } from 'lucide-react'

interface UserRow {
  id: number
  name: string
  email: string
  role: string | null
  createdAt: string
  _count: { enrollments: number; submissions: number; certificates: number }
}

export function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users,   setUsers]   = useState(initialUsers)
  const [loading, setLoading] = useState<number | null>(null)
  const [query,   setQuery]   = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'student'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(u => {
      const matchQ    = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchRole = roleFilter === 'all' || (roleFilter === 'admin' ? u.role === 'admin' : u.role !== 'admin')
      return matchQ && matchRole
    })
  }, [users, query, roleFilter])

  async function toggleRole(user: UserRow) {
    const newRole = user.role === 'admin' ? 'student' : 'admin'
    if (!confirm(`${newRole === 'admin' ? 'Promote' : 'Demote'} ${user.name} to ${newRole}?`)) return
    setLoading(user.id)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, role: newRole }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'student', 'admin'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                roleFilter === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 shrink-0">
          {filtered.length} of {users.length}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <BookOpen size={11} className="inline mr-1" />Enrolled
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Code size={11} className="inline mr-1" />Submissions
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Trophy size={11} className="inline mr-1" />Certs
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-sm text-slate-400 py-12">
                  No users match your search.
                </td>
              </tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <Link href={`/admin/users/${u.id}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                        {u.name}
                      </Link>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    u.role === 'admin'
                      ? 'bg-violet-50 text-violet-700 border-violet-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {u.role || 'student'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-600 font-semibold">{u._count.enrollments}</td>
                <td className="px-4 py-3.5 text-slate-600 font-semibold">{u._count.submissions}</td>
                <td className="px-4 py-3.5 text-slate-600 font-semibold">{u._count.certificates}</td>
                <td className="px-4 py-3.5 text-slate-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/users/${u.id}`} className="text-xs text-blue-600 font-semibold hover:underline">
                      View
                    </Link>
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={loading === u.id}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                        u.role === 'admin'
                          ? 'text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          : 'text-violet-600 border-violet-200 hover:bg-violet-50'
                      }`}
                    >
                      {loading === u.id
                        ? '…'
                        : u.role === 'admin'
                          ? <><User size={11} /> Demote</>
                          : <><ShieldCheck size={11} /> Make Admin</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
