'use client'
import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; type: ToastType }

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void
}>({ toast: () => {} })

export function useToast() { return useContext(ToastContext) }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextIdRef = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const icons = {
    success: <CheckCircle size={15} className="text-emerald-500 shrink-0" />,
    error:   <XCircle    size={15} className="text-red-500    shrink-0" />,
    info:    <AlertCircle size={15} className="text-blue-500  shrink-0" />,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 items-end">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-3 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl shadow-black/30 animate-fadeIn max-w-sm"
          >
            {icons[t.type]}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-white ml-1 transition-colors">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
