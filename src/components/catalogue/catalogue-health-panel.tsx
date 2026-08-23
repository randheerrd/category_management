import { useState } from "react"
import { PanelLeftClose, ArrowRight } from "lucide-react"

import { ScoreRing } from "@/components/catalogue/score-ring"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { channelCoverage, statusRows } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"
import { channelLogos } from "@/lib/channel-logos"

/** Left rail summarizing overall catalogue health. */
export function CatalogueHealthPanel() {
  const { categories, setSearch, toggleAnalyticsPanel } = useCatalogue()
  const [reportOpen, setReportOpen] = useState(false)
  const [issuesOpen, setIssuesOpen] = useState(false)

  const needsAttention = categories.filter((c) => c.status === "Planning" || c.skus.length < c.itemCount)

  return (
    <div id="tour-health-panel" className="flex h-full w-[400px] shrink-0 flex-col border-r border-border">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <p className="text-base leading-6 font-semibold text-foreground">Catalogue Health</p>
        <button
          type="button"
          onClick={toggleAnalyticsPanel}
          aria-label="Hide catalogue health panel"
          className="flex size-4 items-center justify-center text-foreground"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-4 py-5">
        <div className="flex flex-col items-start gap-6">
          {/* Score + status */}
          <div className="flex w-full flex-col items-center gap-3">
            <ScoreRing score={82} />
            <div className="flex w-full flex-col items-center text-center">
              <p className="w-full text-base leading-6 font-semibold text-foreground">Looking Good</p>
              <p className="w-full text-sm leading-5 text-amber-600">3 Items need your attention</p>
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

            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1 rounded-lg py-1 text-sm leading-6 font-medium text-foreground hover:underline"
            >
              Full Report
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Quick tip */}
        <div className="flex w-full flex-col items-start gap-1.5 rounded-[10px] border border-[rgba(241,245,249,0.4)] bg-[rgba(241,245,249,0.5)] p-4">
          <div className="flex w-full flex-col items-start gap-1 text-foreground">
            <p className="w-full text-base leading-none font-medium">Quick Tip</p>
            <p className="w-full text-sm leading-6">3 SKUs have coverage gaps. Review them before the next sync</p>
          </div>
          <button
            type="button"
            onClick={() => setIssuesOpen(true)}
            className="flex items-center gap-1 rounded-lg py-1 text-sm leading-6 font-medium text-foreground hover:underline"
          >
            Review Issues
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catalogue health — full report</DialogTitle>
            <DialogDescription>Live snapshot across all pinned categories and channels.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-muted-foreground">Categories on the board</span>
              <span className="font-medium text-foreground">{categories.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-muted-foreground">Active categories</span>
              <span className="font-medium text-foreground">{categories.filter((c) => c.status === "Active").length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-muted-foreground">Total SKUs pinned</span>
              <span className="font-medium text-foreground">{categories.reduce((sum, c) => sum + c.skus.length, 0)}</span>
            </div>
            {channelCoverage.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-muted-foreground">{channel.name}</span>
                <span className="font-medium text-foreground">{channel.value}%</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={issuesOpen} onOpenChange={setIssuesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categories that need attention</DialogTitle>
            <DialogDescription>Planning-stage clusters or categories missing pinned SKUs.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {needsAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
            ) : (
              needsAttention.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSearch(c.title)
                    setIssuesOpen(false)
                  }}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-medium text-foreground">{c.title}</span>
                  <span className="text-muted-foreground">
                    {c.status === "Planning" ? "Planning" : `${c.skus.length}/${c.itemCount} SKUs pinned`}
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
