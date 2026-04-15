'use client'

import React, { useState, useCallback, createContext, useContext } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  title: string
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

let toastCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = ++toastCounter
    setToasts(prev => [...prev, { id, type, title, message }])

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 6000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const TOAST_STYLES: Record<ToastType, { border: string; bg: string; iconColor: string; icon: React.ReactNode }> = {
  success: {
    border: 'border-green-500/40',
    bg: 'bg-green-950/60',
    iconColor: 'text-green-400',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  error: {
    border: 'border-red-500/40',
    bg: 'bg-red-950/60',
    iconColor: 'text-red-400',
    icon: <XCircle className="w-5 h-5" />,
  },
  warning: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/60',
    iconColor: 'text-amber-400',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  info: {
    border: 'border-primary/40',
    bg: 'bg-surface-container-high/80',
    iconColor: 'text-primary',
    icon: <Info className="w-5 h-5" />,
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const style = TOAST_STYLES[toast.type]

  return (
    <div
      className={`pointer-events-auto ${style.bg} ${style.border} border backdrop-blur-2xl rounded-xl p-4 shadow-2xl animate-in slide-in-from-right-5 fade-in duration-300 flex items-start gap-3`}
    >
      <div className={`${style.iconColor} shrink-0 mt-0.5`}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-display text-sm font-bold uppercase tracking-wider ${style.iconColor}`}>
          {toast.title}
        </p>
        <p className="text-sm text-on-surface mt-1 leading-relaxed">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-on-surface-variant hover:text-foreground transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
