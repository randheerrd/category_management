import { useEffect } from "react"
import { Compass } from "lucide-react"

import { TourGuide, type TourStep } from "@/lib/tour-guide"

const TOUR_SEEN_KEY = "gc-catalogue-tour-seen"

const steps: TourStep[] = [
  {
    target: null,
    title: "Welcome to Catalogue Health",
    body: "A quick look at where everything lives before you start pinning categories and SKUs.",
  },
  {
    target: "#tour-sidebar",
    title: "Switch modules here",
    body: "Catalogue, Brands, Promotions, Analytics — every module in the workspace lives in this rail.",
  },
  {
    target: "#tour-health-panel",
    title: "Your catalogue health, at a glance",
    body: "Overall score, what's live vs. needs attention, and coverage per channel — updates as you edit the board.",
  },
  {
    target: "#tour-search",
    title: "Search the board",
    body: "Filters categories and SKUs together — matching a product name surfaces its whole category.",
  },
  {
    target: "#tour-filters",
    title: "Narrow things down",
    body: "Filter by category, status, stock level, platform, or coverage — only what has real data behind it.",
  },
  {
    target: "#tour-create",
    title: "Add to the catalogue",
    body: "Create a category, add a single product, or bulk-import a whole spreadsheet with Upload CSV.",
  },
  {
    target: "#tour-first-card",
    title: "This is a category card",
    body: "Drag SKUs between cards, click + to add one, or click a card's title to collapse it.",
  },
  {
    target: null,
    title: "You're all set",
    body: "Replay this tour any time from the Tour button in the top bar.",
  },
]

/**
 * Spotlight walkthrough for first-time visitors to the catalogue board.
 * Auto-starts once per browser (tracked in localStorage); always replayable via the Tour button.
 */
export function ProductTour() {
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_SEEN_KEY) === "1"

    TourGuide.init({
      steps,
      autoStart: false,
      onModeChange: (mode) => {
        if (mode === "returning") {
          try {
            localStorage.setItem(TOUR_SEEN_KEY, "1")
          } catch {
            // localStorage can throw in private-browsing contexts — the tour still works, it just replays every visit.
          }
        }
      },
    })

    if (!hasSeenTour) {
      // Give layout (fonts, images, the collapsible health panel) a tick to settle before spotlighting.
      const timer = setTimeout(() => TourGuide.start(), 400)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <>
      <button id="tgReplayTour" type="button" className="tg-replay-btn">
        <Compass className="size-3.5" />
        Tour
      </button>
      <div id="tgOverlay" />
    </>
  )
}
