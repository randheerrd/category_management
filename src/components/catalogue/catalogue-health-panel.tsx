import { useState } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import {
  PanelLeft,
  ArrowRight,
  BarChart3,
  PackagePlus,
  ArrowRightLeft,
  FolderMinus,
  Trash2,
  FolderPlus,
  FolderX,
  UploadCloud,
  SquarePen,
  type LucideIcon,
} from "lucide-react"

import { ScoreRing } from "@/components/catalogue/score-ring"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  computeCatalogueIssues,
  computeChannelCoverage,
  computeHealthScore,
  computeSkuHealthCounts,
  UNLISTED_CATEGORY_ID,
  type ActivityType,
} from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"
import { channelLogos } from "@/lib/channel-logos"

/** "1 day ago" / "5 days ago" — matches the design's relative timestamps. */
function timeAgo(timestamp: number) {
  return `${formatDistanceToNowStrict(timestamp)} ago`
}

/** Icon + accent color per activity type — lets the feed read at a glance instead of
 *  relying on a generic avatar for every row. */
const activityIconMeta: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  add: { icon: PackagePlus, className: "bg-emerald-600/10 text-emerald-700" },
  move: { icon: ArrowRightLeft, className: "bg-indigo-600/10 text-indigo-700" },
  remove: { icon: FolderMinus, className: "bg-amber-600/10 text-amber-700" },
  delete: { icon: Trash2, className: "bg-red-600/10 text-red-700" },
  "category-create": { icon: FolderPlus, className: "bg-emerald-600/10 text-emerald-700" },
  "category-delete": { icon: FolderX, className: "bg-red-600/10 text-red-700" },
  import: { icon: UploadCloud, className: "bg-sky-600/10 text-sky-700" },
  edit: { icon: SquarePen, className: "bg-slate-600/10 text-slate-700" },
}

function ActivityIcon({
  type,
  circleClassName = "size-8",
  iconClassName = "size-4",
}: {
  type: ActivityType
  circleClassName?: string
  iconClassName?: string
}) {
  const { icon: Icon, className } = activityIconMeta[type]
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full ${circleClassName} ${className}`}>
      <Icon className={iconClassName} />
    </div>
  )
}

/** Score-threshold label — the only place this wording is decided. */
function scoreLabel(score: number) {
  if (score >= 80) return "Looking Good"
  if (score >= 60) return "Needs Improvement"
  return "Needs Attention"
}

/** Left rail summarizing overall catalogue health — collapses to a thin icon strip. */
export function CatalogueHealthPanel() {
  const {
    categories,
    activity,
    showAnalyticsPanel,
    toggleAnalyticsPanel,
    clearFilters,
    setStockStatusFilterAll,
    setCoverageFilter,
    setCategoryFilterIds,
    setStatusFilterAll,
  } = useCatalogue()
  const [activityOpen, setActivityOpen] = useState(false)

  const score = computeHealthScore(categories)
  const channelCoverage = computeChannelCoverage(categories)
  const issues = computeCatalogueIssues(categories)
  // Same count as the "Need attention" banner above it — both read off computeSkuHealthCounts
  // instead of separate math, so they can never disagree.
  const { live: liveCount, total: totalCount } = computeSkuHealthCounts(categories)
  const attentionCount = issues.length

  const unpinnedCount = categories.find((c) => c.id === UNLISTED_CATEGORY_ID)?.skus.length ?? 0
  const planningCount = categories.filter((c) => c.status === "Planning").length

  // Each row filters the board down to exactly what its own text describes — clearFilters
  // first so a stale filter from earlier browsing doesn't quietly narrow the result further.
  const actionRows = [
    {
      id: "live",
      label: `${liveCount}/${totalCount} SKUs Live`,
      helper: "Ready across all active channels",
      onClick: () => {
        clearFilters()
        setStockStatusFilterAll(new Set(["In Stock"]))
        setCoverageFilter("full")
      },
    },
    {
      id: "unpinned",
      label: `${unpinnedCount} SKU${unpinnedCount === 1 ? "" : "s"} aren't pinned to any category`,
      helper: "Need categorisation before going live",
      onClick: () => {
        clearFilters()
        setCategoryFilterIds(new Set([UNLISTED_CATEGORY_ID]))
      },
    },
    {
      id: "planning",
      label: `${planningCount} Categor${planningCount === 1 ? "y is" : "ies are"} still in Planning`,
      helper: "Not yet published",
      onClick: () => {
        clearFilters()
        setStatusFilterAll(new Set(["Planning"]))
      },
    },
  ]

  const allSkus = categories.flatMap((c) => c.skus)
  const hasData = allSkus.length > 0

  if (!showAnalyticsPanel) {
    return (
      <div className="flex h-full w-12 shrink-0 flex-col items-center border-r border-border">
        <div className="flex h-12 w-full shrink-0 items-center justify-center border-b border-border">
          <button
            type="button"
            onClick={toggleAnalyticsPanel}
            aria-label="Expand catalogue health panel"
            className="flex size-8 items-center justify-center rounded-lg text-foreground hover:bg-muted"
          >
            <PanelLeft className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div id="tour-health-panel" className="flex h-full w-[360px] shrink-0 flex-col border-r border-border">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <p className="text-base leading-6 font-semibold text-foreground">Catalogue Health</p>
        <button
          type="button"
          onClick={toggleAnalyticsPanel}
          aria-label="Collapse catalogue health panel"
          className="flex size-8 items-center justify-center rounded-lg text-foreground hover:bg-muted"
        >
          <PanelLeft className="size-4" />
        </button>
      </div>

      {!hasData ? (
        /* Nothing pinned yet — a score/coverage read-out would just be zeroes and empty bars,
           which reads as "your catalogue is broken" rather than "you haven't added anything".
           Say the latter instead, and don't offer Full Report / Review Issues over no data. */
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BarChart3 className="size-5" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm leading-5 font-semibold text-foreground">No health data yet</p>
            <p className="max-w-[240px] text-sm leading-5 text-muted-foreground">
              Health score, channel coverage, and issues will show up here once you add or import products.
            </p>
          </div>
        </div>
      ) : (
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-4 py-5">
          <div className="flex flex-col items-start gap-4">
            {/* Score + status */}
            <div className="flex w-full flex-col items-center gap-3">
              <ScoreRing score={score} />
              <div className="flex w-full flex-col items-center text-center">
                <p className="w-full text-base leading-6 font-semibold text-foreground">{scoreLabel(score)}</p>
                <p className="w-full text-sm leading-5 text-amber-600">
                  {attentionCount} Item{attentionCount === 1 ? "" : "s"} need your attention
                </p>
              </div>

              <div className="flex w-full flex-col items-start overflow-hidden rounded-sm border border-border">
                {actionRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={row.onClick}
                    className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-muted"
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <p className="text-sm leading-5 font-medium text-foreground">{row.label}</p>
                      <p className="text-xs leading-4 text-muted-foreground">{row.helper}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-foreground" />
                  </button>
                ))}
              </div>
            </div>

            {/* Channel coverage */}
            <div className="flex w-full flex-col items-start gap-[15px]">
              <p className="w-full text-sm leading-5 font-semibold text-foreground">Channel Coverage</p>
              <div className="flex w-full flex-col items-start gap-5">
                {channelCoverage.map((channel) => (
                  <div key={channel.name} className="flex w-full items-center gap-2">
                    <img
                      src={channelLogos[channel.name]}
                      alt=""
                      className="size-5 shrink-0 rounded-sm object-cover"
                    />
                    <div className="flex flex-1 items-center gap-2">
                      <p className="w-[100px] shrink-0 text-sm leading-5 text-foreground">{channel.name}</p>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(2,6,23,0.2)]">
                        <div className="h-full rounded-full bg-green-600" style={{ width: `${channel.value}%` }} />
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs leading-4 font-semibold text-secondary-foreground">
                        {channel.value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-4">
            {/* Recent activity */}
            {activity.length > 0 && (
              <div className="flex w-full flex-col items-start gap-3 rounded-[10px] bg-muted/50 p-3">
                <div className="flex w-full items-center justify-between">
                  <p className="text-sm leading-5 font-semibold text-foreground">Recent Activity</p>
                  {activity.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setActivityOpen(true)}
                      className="flex items-center gap-1 rounded-lg py-1 text-sm leading-6 font-medium text-foreground hover:underline"
                    >
                      Show All
                    </button>
                  )}
                </div>
                <div className="flex w-full flex-col items-start">
                  {activity.slice(0, 3).map((entry, index, arr) => (
                    <div key={entry.id} className="flex w-full items-stretch gap-3">
                      <div className="flex shrink-0 flex-col items-center">
                        <ActivityIcon type={entry.type} circleClassName="size-6" iconClassName="size-4" />
                        {index < arr.length - 1 && (
                          <div className="my-1 w-px flex-1 border-l border-dashed border-border" />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 pb-4">
                        <p className="text-sm leading-5 font-medium text-foreground">{entry.message}</p>
                        <p className="text-xs leading-4 text-muted-foreground">{timeAgo(entry.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Sheet open={activityOpen} onOpenChange={setActivityOpen}>
        <SheetContent showCloseButton>
          <SheetHeader className="flex-col items-start gap-1 pr-10">
            <SheetTitle>Recent activity</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col items-start overflow-y-auto p-4">
            {activity.slice(0, 20).map((entry, index, arr) => (
              <div key={entry.id} className="flex w-full items-stretch gap-3">
                <div className="flex shrink-0 flex-col items-center">
                  <ActivityIcon type={entry.type} circleClassName="size-6" iconClassName="size-4" />
                  {index < arr.length - 1 && (
                    <div className="my-1 w-px flex-1 border-l border-dashed border-border" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 pb-8">
                  <p className="text-sm leading-5 font-medium text-foreground">{entry.message}</p>
                  <p className="text-xs leading-4 text-muted-foreground">{timeAgo(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
