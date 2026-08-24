import { useEffect } from "react"

import { TourGuide, type TourStep } from "@/lib/tour-guide"

const steps: TourStep[] = [
  {
    target: null,
    title: "Welcome to Catalogue Health",
    body: "A quick look at where everything lives before you start pinning categories and SKUs.",
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
    body: "That's the whole board — start pinning categories and SKUs whenever you're ready.",
  },
]

/**
 * Spotlight walkthrough for the catalogue board. Always auto-starts as a first-time
 * interaction on landing — no "seen it before" memory. No replay button — the tour
 * only ever runs on that initial landing.
 */
export function ProductTour() {
  useEffect(() => {
    TourGuide.init({ steps, autoStart: false })

    // Give layout (fonts, images, the collapsible health panel) a tick to settle before spotlighting.
    const timer = setTimeout(() => TourGuide.start(), 400)
    return () => clearTimeout(timer)
  }, [])

  return <div id="tgOverlay" />
}
