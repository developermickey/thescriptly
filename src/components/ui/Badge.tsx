import { cn, getDifficultyColor } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'difficulty'
  difficulty?: string
  className?: string
}

export function Badge({ children, variant = 'default', difficulty, className }: BadgeProps) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border'
  const variants = {
    default:    'bg-slate-100 text-slate-700 border-slate-200',
    success:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning:    'bg-amber-50 text-amber-700 border-amber-200',
    danger:     'bg-red-50 text-red-700 border-red-200',
    difficulty: getDifficultyColor(difficulty || ''),
  }
  return <span className={cn(base, variants[variant], className)}>{children}</span>
}
