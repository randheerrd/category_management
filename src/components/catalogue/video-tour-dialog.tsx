import { useEffect, useRef, useState } from "react"
import { Volume2, X } from "lucide-react"

import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"

interface VideoTourDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Full "Watch tour" video player — opens covering ~70% of the viewport (both width
 * and height) and autoplays. Closing it (X, Escape, backdrop click) just flips `open`
 * to false; it's the caller's job to collapse the entry point into a small replay
 * button instead of losing it entirely — see CatalogueEmptyState's `tourState`.
 *
 * tour.mp4 genuinely has an audio track (checked with `afinfo`) — the old declarative
 * `autoplay` attribute just never reliably produced sound: the dialog is portalled, so
 * the video element can mount a render cycle after `open` flips true, and a bare
 * `useEffect([open])` calling `.play()` can fire before that element exists. Playback
 * is kicked off from the video's own `onCanPlay` event instead — that only fires once
 * the real, mounted element is actually ready — with a muted fallback (plus a visible
 * "Tap for sound" prompt) for the rare browser that still blocks unmuted autoplay.
 */
export function VideoTourDialog({ open, onOpenChange }: VideoTourDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasAttemptedPlay = useRef(false)
  const [needsUnmutePrompt, setNeedsUnmutePrompt] = useState(false)

  useEffect(() => {
    if (open) hasAttemptedPlay.current = false
    else setNeedsUnmutePrompt(false)
  }, [open])

  const handleCanPlay = () => {
    if (hasAttemptedPlay.current) return
    hasAttemptedPlay.current = true
    const video = videoRef.current
    if (!video) return
    video.muted = false
    video.play().catch(() => {
      // Autoplay-with-sound was blocked — fall back to muted so the video still
      // plays, and surface a one-tap way to turn sound on instead of it just being
      // silently muted with no indication why.
      video.muted = true
      setNeedsUnmutePrompt(true)
      video.play().catch(() => {})
    })
  }

  const unmute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = false
    setNeedsUnmutePrompt(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // DialogContent's base classes cap width at `sm:max-w-sm` (384px) — override that
        // breakpoint variant explicitly, not just the unprefixed max-w, or it wins at
        // any viewport ≥640px and the video never actually reaches 70% of the screen.
        className="flex h-[70vh] w-[70vw] max-w-[70vw] flex-col gap-0 overflow-hidden rounded-2xl bg-black p-0 ring-0 sm:max-w-[70vw]"
      >
        <DialogTitle className="sr-only">Product tour</DialogTitle>
        <DialogClose className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        {needsUnmutePrompt && (
          <button
            type="button"
            onClick={unmute}
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-sm text-white transition-colors hover:bg-black/90"
          >
            <Volume2 className="size-4" />
            Tap for sound
          </button>
        )}
        {/* Remounts each time the dialog opens, so replaying always restarts from the top
            instead of resuming wherever the previous viewing left off. */}
        {open && (
          <video
            key="tour-video"
            ref={videoRef}
            onCanPlay={handleCanPlay}
            src="/tour.mp4"
            controls
            // Hides the fullscreen button from the native controls — Chrome/Edge/Safari
            // all respect this; the dialog is already a large, dedicated video view, so
            // fullscreen isn't offering anything extra.
            controlsList="nofullscreen"
            className="no-fullscreen-button size-full object-cover"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
