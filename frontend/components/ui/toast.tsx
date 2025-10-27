import * as React from "react"
import { cn } from "../../lib/utils"

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className={cn(
        "rounded-lg border px-4 py-3 shadow-lg",
        type === 'success' && "bg-green-50 border-green-200 text-green-800",
        type === 'error' && "bg-red-50 border-red-200 text-red-800",
        type === 'info' && "bg-blue-50 border-blue-200 text-blue-800"
      )}>
        <div className="flex items-center gap-2">
          <span>{message}</span>
          <button
            onClick={onClose}
            className="ml-2 text-sm font-semibold hover:opacity-70"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

