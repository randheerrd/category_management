import { useState } from "react"
import { Plus, CloudUpload, Play, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { VideoTourDialog } from "@/components/catalogue/video-tour-dialog"
import { useCatalogue } from "@/lib/catalogue-context"
import tourThumbnail from "@/assets/tour-thumbnail.png"

function ImagePlaceholderCard() {
  return (
    <div className="flex size-[72px] shrink-0 items-center justify-center rounded-lg border border-border bg-card p-3">
      <div className="size-full rounded-md bg-muted" />
    </div>
  )
}

function TextBarsCard() {
  return (
    <div className="flex w-full flex-col justify-center gap-2 rounded-lg border border-border bg-card p-3">
      <div className="h-2.5 w-full rounded-full bg-muted" />
      <div className="h-2.5 w-2/3 rounded-full bg-muted" />
    </div>
  )
}

interface CatalogueEmptyStateProps {
  /** "Add Manually" — loads the sample catalogue and moves past onboarding. */
  onAddManually: () => void
}

/** Tour entry point's own state, independent of the video dialog:
 *  - "card": the full preview card, dismissible down to "minimized"
 *  - "playing": the video dialog is open
 *  - "minimized": collapsed to a small bottom-right button that replays the video */
type TourState = "card" | "playing" | "minimized"

/** New-user empty state for the Catalogue board — shown before any products exist. */
export function CatalogueEmptyState({ onAddManually }: CatalogueEmptyStateProps) {
  const { openUploadCsv } = useCatalogue()
  const [tourState, setTourState] = useState<TourState>("card")

  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-6 bg-background px-6">
      <div className="flex w-full max-w-[227px] flex-col gap-2">
        <div className="flex items-stretch gap-2">
          <ImagePlaceholderCard />
          <TextBarsCard />
        </div>
        <div className="flex items-stretch gap-2">
          <TextBarsCard />
          <ImagePlaceholderCard />
        </div>
      </div>

      <div className="flex max-w-md flex-col items-center gap-1.5 text-center">
        <h1 className="text-base leading-6 font-semibold text-foreground">
          Bring your existing catalogue in, and we&apos;ll help you organise it.
        </h1>
        <p className="text-sm leading-5 text-muted-foreground">
          Organise your products into categories, add SKU details, and manage where each product is
          available across channels.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onAddManually}>
          <Plus />
          Add Manually
        </Button>
        <Button onClick={openUploadCsv}>
          <CloudUpload />
          Upload CSV
        </Button>
      </div>

      {tourState === "card" && (
        <div className="absolute right-6 bottom-6 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-[0px_4px_16px_-2px_rgba(0,0,0,0.12),0px_1px_2px_-1px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-end p-3 pb-0">
            <button
              type="button"
              onClick={() => setTourState("minimized")}
              aria-label="Minimize tour card"
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setTourState("playing")}
            className="relative mx-3 mb-3 flex h-44 w-[calc(100%-1.5rem)] items-center justify-center overflow-hidden rounded-xl"
          >
            <img src={tourThumbnail} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative flex size-14 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md transition-transform hover:scale-105">
              <Play className="size-5 translate-x-px fill-current" />
            </div>
          </button>
          <div className="flex flex-col items-start gap-1.5 px-4 pb-4">
            <p className="text-lg leading-6 font-semibold text-foreground">Watch 2-min tour</p>
            <p className="text-sm leading-5 text-muted-foreground">
              Learn how to add SKUs, create categories, move products, and check catalogue coverage.
            </p>
          </div>
        </div>
      )}

      {/* Collapsed state after the card is dismissed or the video's been watched — a
          small tab pinned to the screen's right edge (fixed to the true viewport, not
          just this panel), keeping the tour one click away instead of losing the entry
          point for good. Exact box from the Figma spec: 76×60, right:4px bottom:40px,
          rounded-l-full/rounded-r-lg, 1px border on 3 sides only (right edge open). */}
      {tourState === "minimized" && (
        <button
          type="button"
          onClick={() => setTourState("playing")}
          aria-label="Replay 2-min tour video"
          className="fixed right-1 bottom-10 z-40 flex h-[60px] w-[76px] items-center justify-center rounded-l-full rounded-r-lg border-t border-b border-l bg-white shadow-md"
          style={{ borderColor: "rgba(241,245,249,0.4)" }}
        >
          <span className="relative flex size-7 items-center justify-center">
            <span className="absolute inset-[10.42%] rounded-full" style={{ background: "#0F172A" }} />
            <Play className="relative size-2.5 translate-x-px fill-white text-white" />
          </span>
        </button>
      )}

      <VideoTourDialog
        open={tourState === "playing"}
        onOpenChange={(open) => setTourState(open ? "playing" : "minimized")}
      />
    </div>
  )
}
