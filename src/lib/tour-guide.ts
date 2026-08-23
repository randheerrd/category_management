/* ============================================================
   TOUR GUIDE — standalone spotlight walkthrough engine
   ------------------------------------------------------------
   Ported as-is (same DOM/CSS contract, same public API) from the
   vanilla tour-guide.js base, just as a typed ES module instead of
   a global IIFE so it plays nicely with Vite/React.

   REQUIRED IN THE DOM (see ProductTour component):
     <div id="tgOverlay"></div>                    — mount point, keep empty
     <button id="tgReplayTour">...</button>         — optional, non-destructive replay
     #tgUserSwitch / #tgUserNewBtn / #tgUserReturningBtn — optional new/returning toggle

   If the replay button or toggle aren't in the DOM, init() just
   skips wiring them instead of throwing — only #tgOverlay is required.
   ============================================================ */

export interface TourStep {
  /** CSS selector to spotlight, or null to render a centered card with no target. */
  target: string | null
  title: string
  body: string
}

export type TourMode = "new" | "returning"

export interface TourGuideOptions {
  steps: TourStep[]
  /** Runs right before every start() — e.g. switch to a known view/tab, scroll to top. */
  onBeforeStart?: () => void
  /** Runs ONLY when the built-in "New user" button is clicked — reset your app state here. */
  onReset?: () => void
  onModeChange?: (mode: TourMode) => void
  /** Run the tour immediately in New-user mode on init. Default: true. */
  autoStart?: boolean
}

let steps: TourStep[] = []
let tourStep = -1
let userMode: TourMode = "new"
let hooks: {
  onBeforeStart: (() => void) | null
  onReset: (() => void) | null
  onModeChange: ((mode: TourMode) => void) | null
} = { onBeforeStart: null, onReset: null, onModeChange: null }

const $ = (sel: string) => document.querySelector<HTMLElement>(sel)
const esc = (s: unknown) =>
  (s == null ? "" : String(s)).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  )

function getVisibleTarget(sel: string | null): HTMLElement | null {
  if (!sel) return null
  const el = document.querySelector<HTMLElement>(sel)
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  if (getComputedStyle(el).visibility === "hidden") return null
  return el
}

function setMode(mode: TourMode) {
  userMode = mode
  const newBtn = $("#tgUserNewBtn")
  const retBtn = $("#tgUserReturningBtn")
  if (newBtn) newBtn.classList.toggle("active", mode === "new")
  if (retBtn) retBtn.classList.toggle("active", mode === "returning")
  if (hooks.onModeChange) hooks.onModeChange(mode)
}

function start() {
  if (hooks.onBeforeStart) hooks.onBeforeStart()
  tourStep = 0
  renderStep()
}

function end() {
  tourStep = -1
  const overlay = $("#tgOverlay")
  if (overlay) overlay.innerHTML = ""
  setMode("returning")
}

function renderStep() {
  const overlay = $("#tgOverlay")
  if (!overlay || !steps.length) return
  const step = steps[tourStep]
  const total = steps.length
  const target = getVisibleTarget(step.target)
  let spotlightHTML = ""
  let cardStyle: string

  if (target) {
    target.scrollIntoView({ block: "center", inline: "center" })
    const r = target.getBoundingClientRect()
    const pad = 8
    const top = r.top - pad
    const left = r.left - pad
    const w = r.width + pad * 2
    const h = r.height + pad * 2
    spotlightHTML = `<div class="tg-spotlight" style="top:${top}px; left:${left}px; width:${w}px; height:${h}px;"></div>`
    const cardW = 300
    const cardH = 210
    let cardTop = r.bottom + 16
    if (cardTop + cardH > window.innerHeight) cardTop = Math.max(16, r.top - cardH - 16)
    const cardLeft = Math.min(Math.max(16, r.left), Math.max(16, window.innerWidth - cardW - 16))
    cardStyle = `top:${cardTop}px; left:${cardLeft}px;`
  } else {
    cardStyle = `top:50%; left:50%; transform:translate(-50%,-50%);`
  }

  const dots = steps
    .map((_, i) => `<span class="tg-dot ${i < tourStep ? "done" : i === tourStep ? "active" : ""}"></span>`)
    .join("")

  overlay.innerHTML = `
    <div class="tg-blocker" id="tgBlocker"></div>
    ${spotlightHTML}
    <div class="tg-card" style="${cardStyle}">
      <div class="tg-progress">${dots}</div>
      <div class="tg-eyebrow">Tour &middot; ${tourStep + 1} of ${total}</div>
      <div class="tg-title">${esc(step.title)}</div>
      <div class="tg-body">${esc(step.body)}</div>
      <div class="tg-nav">
        <button class="tg-skip" id="tgSkip">Skip tour</button>
        <div class="tg-nav-right">
          ${tourStep > 0 ? `<button class="tg-btn tg-btn-ghost" id="tgBack">Back</button>` : ""}
          <button class="tg-btn tg-btn-primary" id="tgNext">${tourStep === total - 1 ? "Finish" : "Next"}</button>
        </div>
      </div>
    </div>
  `

  $("#tgSkip")?.addEventListener("click", end)
  const backBtn = $("#tgBack")
  if (backBtn) backBtn.addEventListener("click", () => { tourStep--; renderStep() })
  $("#tgNext")?.addEventListener("click", () => {
    if (tourStep === total - 1) end()
    else { tourStep++; renderStep() }
  })
}

let resizeHandlerAttached = false

function init(options: TourGuideOptions) {
  steps = options.steps || []
  hooks.onBeforeStart = options.onBeforeStart || null
  hooks.onReset = options.onReset || null
  hooks.onModeChange = options.onModeChange || null

  const newBtn = $("#tgUserNewBtn")
  const retBtn = $("#tgUserReturningBtn")
  const replayBtn = $("#tgReplayTour")

  if (newBtn) {
    newBtn.addEventListener("click", () => {
      if (hooks.onReset) hooks.onReset()
      setMode("new")
      start()
    })
  }
  if (retBtn) retBtn.addEventListener("click", end)
  if (replayBtn) replayBtn.addEventListener("click", start)

  if (!resizeHandlerAttached) {
    window.addEventListener("resize", () => {
      if (tourStep >= 0) renderStep()
    })
    resizeHandlerAttached = true
  }

  setMode("new")
  if (options.autoStart !== false) start()
}

export const TourGuide = { init, start, end, setMode }
