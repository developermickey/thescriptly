'use client'
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer'
    const variants = {
      primary:   'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300',
      ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      danger:    'bg-red-600 text-white hover:bg-red-700',
      outline:   'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 bg-white',
    }
    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2',
    }
    return (
      <button ref={ref} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {loading && (
          <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
