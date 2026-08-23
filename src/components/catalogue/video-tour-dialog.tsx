import { Play, X } from "lucide-react"

import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface VideoTourDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * "Watch 2-min tour" video modal.
 *
 * The reference design (Figma node 4781-32133) uses a real portrait video still —
 * that asset couldn't be pulled in (Figma MCP was rate-limited), so this uses a
 * warm gradient placeholder in its place. Swap `VideoThumbnail`'s contents for the
 * real still/video whenever that asset is available.
 */
export function VideoTourDialog({ open, onOpenChange }: VideoTourDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[380px] gap-0 overflow-visible rounded-2xl border border-border bg-card p-0 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
      >
        <DialogClose className="absolute top-5 right-5 z-10 text-muted-foreground hover:text-foreground">
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="flex flex-col gap-4 p-5 pt-14">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 via-orange-100 to-stone-300">
            <button
              type="button"
              aria-label="Play tour video"
              className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0px_4px_16px_-2px_rgba(0,0,0,0.2)] transition-transform hover:scale-105"
            >
              <Play className="size-6 translate-x-0.5 fill-foreground text-foreground" />
            </button>
          </div>

          <div className="flex flex-col items-start gap-1.5 text-left">
            <DialogTitle className="text-xl leading-7 font-semibold text-foreground">
              Watch 2-min tour
            </DialogTitle>
            <DialogDescription className="text-base leading-6 text-muted-foreground">
              Learn how to add SKUs, create categories, move products, and check catalogue coverage.
            </DialogDescription>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
