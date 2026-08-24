import { useState } from "react"
import { Plus, CloudUpload, Play, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { VideoTourDialog } from "@/components/catalogue/video-tour-dialog"
import { useCatalogue } from "@/lib/catalogue-context"

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

/** New-user empty state for the Catalogue board — shown before any products exist. */
export function CatalogueEmptyState({ onAddManually }: CatalogueEmptyStateProps) {
  const { openUploadCsv } = useCatalogue()
  const [showTour, setShowTour] = useState(true)
  const [videoOpen, setVideoOpen] = useState(false)

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

      {showTour && (
        <div className="absolute right-6 bottom-6 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-[0px_4px_16px_-2px_rgba(0,0,0,0.12),0px_1px_2px_-1px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={() => setShowTour(false)}
            aria-label="Dismiss tour card"
            className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className="relative flex h-36 w-full items-center justify-center bg-gradient-to-br from-amber-100 via-orange-100 to-stone-200"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md transition-transform hover:scale-105">
              <Play className="size-4 translate-x-px fill-current" />
            </div>
          </button>
          <div className="flex flex-col items-start gap-1 p-3">
            <p className="text-sm leading-5 font-semibold text-foreground">Watch 2-min tour</p>
            <p className="text-xs leading-4 text-muted-foreground">
              Learn how to add SKUs, create categories, move products, and check catalogue coverage.
            </p>
          </div>
        </div>
      )}

      <VideoTourDialog open={videoOpen} onOpenChange={setVideoOpen} />
    </div>
  )
}
