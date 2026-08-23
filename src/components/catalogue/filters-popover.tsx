import { useEffect, useState, type ReactNode } from "react"
import { ListFilter } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import type { CategoryStatus, CoverageLevel, StockStatus } from "@/lib/catalogue-data"
import { channelCoverage } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

const statuses: CategoryStatus[] = ["Active", "Planning"]
const stockStatuses: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]
const coverageLevels: { value: CoverageLevel; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "none", label: "No Coverage" },
  { value: "full", label: "Full Coverage" },
  { value: "partial", label: "Partial" },
]
const platforms = channelCoverage.map((c) => c.name)

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-8 items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Filters popover — matches the Figma "Filters" design, scoped to fields this app actually
 * has data for. The design's "City" field has no backing data, so it's omitted; "Dark Store"
 * is repurposed as "Platform" (Amazon Now / Blinkit / …), the closest real equivalent here.
 * Draft state previews a live match count and only commits to shared state on "Apply".
 */
export function FiltersPopover() {
  const {
    categories,
    activeFilterCount,
    totalSkuCount,
    countMatchingSkus,
    categoryFilterId,
    setCategoryFilterId,
    statusFilter,
    setStatusFilterAll,
    stockStatusFilter,
    setStockStatusFilterAll,
    platformFilter,
    setPlatformFilterAll,
    coverageFilter,
    setCoverageFilter,
    clearFilters,
  } = useCatalogue()

  const [open, setOpen] = useState(false)
  const [draftCategoryId, setDraftCategoryId] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<Set<CategoryStatus>>(new Set())
  const [draftStock, setDraftStock] = useState<Set<StockStatus>>(new Set())
  const [draftPlatform, setDraftPlatform] = useState<Set<string>>(new Set())
  const [draftCoverage, setDraftCoverage] = useState<CoverageLevel>("any")

  useEffect(() => {
    if (!open) return
    setDraftCategoryId(categoryFilterId)
    setDraftStatus(new Set(statusFilter))
    setDraftStock(new Set(stockStatusFilter))
    setDraftPlatform(new Set(platformFilter))
    setDraftCoverage(coverageFilter)
  }, [open, categoryFilterId, statusFilter, stockStatusFilter, platformFilter, coverageFilter])

  const matchCount = countMatchingSkus({
    categoryFilterId: draftCategoryId,
    statusFilter: draftStatus,
    stockStatusFilter: draftStock,
    platformFilter: draftPlatform,
    coverageFilter: draftCoverage,
  })

  const handleApply = () => {
    setCategoryFilterId(draftCategoryId)
    setStatusFilterAll(draftStatus)
    setStockStatusFilterAll(draftStock)
    setPlatformFilterAll(draftPlatform)
    setCoverageFilter(draftCoverage)
    setOpen(false)
  }

  const handleClear = () => {
    setDraftCategoryId(null)
    setDraftStatus(new Set())
    setDraftStock(new Set())
    setDraftPlatform(new Set())
    setDraftCoverage("any")
    clearFilters()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-8 min-w-16 items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-sm font-medium text-primary">
        <ListFilter className="size-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">Filters</p>
          <button
            type="button"
            onClick={handleClear}
            disabled={activeFilterCount === 0 && draftCategoryId === null && draftStatus.size === 0 && draftStock.size === 0 && draftPlatform.size === 0 && draftCoverage === "any"}
            className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Clear all
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Categories</span>
          <select
            value={draftCategoryId ?? ""}
            onChange={(e) => setDraftCategoryId(e.target.value || null)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Platform</span>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <Chip
                key={platform}
                active={draftPlatform.has(platform)}
                onClick={() => setDraftPlatform((prev) => toggleInSet(prev, platform))}
              >
                {platform}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Chip key={status} active={draftStatus.has(status)} onClick={() => setDraftStatus((prev) => toggleInSet(prev, status))}>
                {status}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Stock Status</span>
          <div className="flex flex-wrap gap-2">
            {stockStatuses.map((status) => (
              <Chip key={status} active={draftStock.has(status)} onClick={() => setDraftStock((prev) => toggleInSet(prev, status))}>
                {status}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Coverage</span>
          <div className="flex flex-wrap gap-2">
            {coverageLevels.map((level) => (
              <Chip key={level.value} active={draftCoverage === level.value} onClick={() => setDraftCoverage(level.value)}>
                {level.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="-mx-2.5 -mb-2.5 flex items-center justify-between gap-2 border-t border-border px-2.5 pt-2.5">
          <p className="text-xs text-muted-foreground">
            {matchCount}/{totalSkuCount} SKUs match right now.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
