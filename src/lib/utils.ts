import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case 'easy':   return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'hard':   return 'text-red-600 bg-red-50 border-red-200'
    default:       return 'text-slate-600 bg-slate-50 border-slate-200'
  }
}
