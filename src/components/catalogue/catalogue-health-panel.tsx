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
  type LucideIcon,
} from "lucide-react"

import { ScoreRing } from "@/components/catalogue/score-ring"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  computeCatalogueIssues,
  computeChannelCoverage,
  computeHealthScore,
  computeStatusBreakdown,
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
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const { icon: Icon, className } = activityIconMeta[type]
  return (
    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${className}`}>
      <Icon className="size-4" />
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
  const { categories, activity, setSearch, openSkuDetail, showAnalyticsPanel, toggleAnalyticsPanel } = useCatalogue()
  const [reportOpen, setReportOpen] = useState(false)
  const [issuesOpen, setIssuesOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  const score = computeHealthScore(categories)
  const statusRows = computeStatusBreakdown(categories)
  const channelCoverage = computeChannelCoverage(categories)
  const issues = computeCatalogueIssues(categories)

  const allSkus = categories.flatMap((c) => c.skus)
  const hasData = allSkus.length > 0

  const stockCounts = {
    "In Stock": allSkus.filter((s) => s.stock === "In Stock").length,
    "Low Stock": allSkus.filter((s) => s.stock === "Low Stock").length,
    "Out of Stock": allSkus.filter((s) => s.stock === "Out of Stock").length,
  }

  const openIssue = (issue: (typeof issues)[number]) => {
    if (issue.type === "sku" && issue.skuId) openSkuDetail(issue.skuId)
    else setSearch(issue.label)
    setIssuesOpen(false)
    setReportOpen(false)
  }

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
        <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-4 py-5">
          <div className="flex flex-col items-start gap-6">
            {/* Score + status */}
            <div className="flex w-full flex-col items-center gap-3">
              <ScoreRing score={score} />
              <div className="flex w-full flex-col items-center text-center">
                <p className="w-full text-base leading-6 font-semibold text-foreground">{scoreLabel(score)}</p>
                <p className="w-full text-sm leading-5 text-amber-600">
                  {issues.length} Item{issues.length === 1 ? "" : "s"} need your attention
                </p>
              </div>

              <div className="flex w-full flex-col items-start overflow-hidden rounded-sm border border-border">
                {statusRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex w-full items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <p className="text-sm leading-5 font-medium text-foreground">{row.label}</p>
                      <p className="text-xs leading-4 text-muted-foreground">{row.helper}</p>
                    </div>
                    <span className="flex shrink-0 items-center justify-center rounded-full bg-secondary px-2.5 py-0.5 text-xs leading-4 font-semibold text-secondary-foreground">
                      {row.value}
                    </span>
                  </div>
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
                      <ArrowRight className="size-4" />
                    </button>
                  )}
                </div>
                <div className="flex w-full flex-col items-start">
                  {activity.slice(0, 3).map((entry, index, arr) => (
                    <div key={entry.id} className="flex w-full items-stretch gap-3">
                      <div className="flex shrink-0 flex-col items-center">
                        <ActivityIcon type={entry.type} />
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

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catalogue health — full report</DialogTitle>
            <DialogDescription>Live snapshot across all pinned categories and channels.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Overview</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-medium text-foreground">{categories.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium text-foreground">
                    {categories.filter((c) => c.status === "Active").length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Planning</span>
                  <span className="font-medium text-foreground">
                    {categories.filter((c) => c.status === "Planning").length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Discontinued</span>
                  <span className="font-medium text-foreground">
                    {categories.filter((c) => c.status === "Discontinued").length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Total SKUs</span>
                  <span className="font-medium text-foreground">{allSkus.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">In Stock</span>
                  <span className="font-medium text-foreground">{stockCounts["In Stock"]}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Low Stock</span>
                  <span className="font-medium text-foreground">{stockCounts["Low Stock"]}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Out of Stock</span>
                  <span className="font-medium text-foreground">{stockCounts["Out of Stock"]}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Channel coverage</p>
              <div className="flex flex-col gap-2">
                {channelCoverage.map((channel) => (
                  <div key={channel.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="text-muted-foreground">{channel.name}</span>
                    <span className="font-medium text-foreground">{channel.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {issues.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Top issues</p>
                <div className="flex flex-col gap-1.5">
                  {issues.slice(0, 5).map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => openIssue(issue)}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">{issue.label}</span>
                      <span className="text-muted-foreground">{issue.helper}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReportOpen(false)
                    setIssuesOpen(true)
                  }}
                  className="flex w-fit items-center gap-1 text-sm font-medium text-foreground hover:underline"
                >
                  View all {issues.length}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={issuesOpen} onOpenChange={setIssuesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Items that need attention</DialogTitle>
            <DialogDescription>Planning-stage or understaffed categories, plus SKUs low on stock or coverage.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
            ) : (
              (["category", "sku"] as const).map((type) => {
                const group = issues.filter((issue) => issue.type === type)
                if (group.length === 0) return null
                return (
                  <div key={type} className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {type === "category" ? "Categories" : "SKUs"}
                    </p>
                    <div className="flex flex-col gap-2">
                      {group.map((issue) => (
                        <button
                          key={issue.id}
                          onClick={() => openIssue(issue)}
                          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span className="font-medium text-foreground">{issue.label}</span>
                          <span className="text-muted-foreground">{issue.helper}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={activityOpen} onOpenChange={setActivityOpen}>
        <SheetContent showCloseButton className="sm:max-w-[400px]">
          <SheetHeader className="flex-col items-start gap-1 pr-10">
            <SheetTitle>Recent activity</SheetTitle>
            <SheetDescription>The last {Math.min(activity.length, 20)} changes across this catalogue.</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col items-start overflow-y-auto p-4">
            {activity.slice(0, 20).map((entry, index, arr) => (
              <div key={entry.id} className="flex w-full items-stretch gap-3">
                <div className="flex shrink-0 flex-col items-center">
                  <ActivityIcon type={entry.type} />
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
        </SheetContent>
      </Sheet>
    </div>
  )
}
