import { useEffect, useState } from "react"

export interface ToastItem {
  id: string
  message: string
  description?: string
  variant: "default" | "destructive"
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((listener) => listener(toasts))
}

function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function push(message: string, options?: { description?: string; variant?: ToastItem["variant"] }) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
  toasts = [...toasts, { id, message, description: options?.description, variant: options?.variant ?? "default" }]
  emit()
  setTimeout(() => dismiss(id), 3200)
  return id
}

/** Fire-and-forget toast, callable from anywhere (event handlers, context actions) — not just components. */
export const toast = Object.assign(push, {
  error: (message: string, options?: { description?: string }) => push(message, { ...options, variant: "destructive" }),
})

/** Subscribes a component (the <Toaster/> host) to the live toast queue. */
export function useToasts() {
  const [state, setState] = useState(toasts)
  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])
  return { toasts: state, dismiss }
}
