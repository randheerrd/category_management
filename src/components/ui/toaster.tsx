import { CheckCircle2, X } from "lucide-react"

import { useToasts } from "@/lib/toast"

/** Bottom-right toast stack — mounted once at the app root. */
export function Toaster() {
  const { toasts, dismiss } = useToasts()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border bg-card p-3 text-sm shadow-[0px_8px_24px_-4px_rgba(0,0,0,0.15)] ${
            t.variant === "destructive" ? "border-destructive/20" : "border-border"
          }`}
        >
          {t.variant === "destructive" ? (
            <X className="mt-0.5 size-4 shrink-0 text-destructive" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="font-medium text-foreground">{t.message}</p>
            {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
