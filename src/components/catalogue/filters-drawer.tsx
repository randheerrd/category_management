import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, ListFilter } from "lucide-react"

import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CategoryStatus, CoverageLevel, StockStatus } from "@/lib/catalogue-data"
import { channelCoverage } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

const statuses: CategoryStatus[] = ["Active", "Planning", "Discontinued"]
const stockStatuses: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]
const coverageLevels: { value: CoverageLevel; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "none", label: "No Coverage" },
  { value: "full", label: "Full Coverage" },
  { value: "partial", label: "Partial" },
]

const selectClass =
  "flex h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

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
      className={`flex h-8 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors ${
        active
          ? "border-border bg-muted text-foreground"
          : "border-input bg-background text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  )
}

function FieldSelect({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

/**
 * Right-side Filters sheet matching the Figma drawer. Field options come from the SKU table
 * (platform, dark store, category, stock, price, grammage) so every control actually filters rows.
 */
export function FiltersDrawer() {
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
    setPlatformFilter,
    darkStoreFilter,
    setDarkStoreFilter,
    coverageFilter,
    setCoverageFilter,
    priceMin,
    setPriceMin,
    grammageFilter,
    setGrammageFilter,
  } = useCatalogue()

  const [open, setOpen] = useState(false)
  const [draftCategory, setDraftCategory] = useState("")
  const [draftStatus, setDraftStatus] = useState<Set<CategoryStatus>>(new Set())
  const [draftStock, setDraftStock] = useState<Set<StockStatus>>(new Set())
  const [draftPlatform, setDraftPlatform] = useState("")
  const [draftDarkStore, setDraftDarkStore] = useState("")
  const [draftCoverage, setDraftCoverage] = useState<CoverageLevel>("any")
  const [draftPrice, setDraftPrice] = useState("")
  const [draftGrammage, setDraftGrammage] = useState("")

  const platforms = useMemo(() => {
    const fromTable = categories.flatMap((category) => category.skus.map((sku) => sku.platform))
    return [...new Set([...channelCoverage.map((channel) => channel.name), ...fromTable])].filter(Boolean)
  }, [categories])

  const darkStores = useMemo(() => {
    const fromTable = categories.flatMap((category) =>
      category.skus.flatMap((sku) => sku.darkStoreAvailability.map((store) => store.name))
    )
    return [...new Set([...channelCoverage.map((channel) => channel.name), ...fromTable])]
  }, [categories])

  const categoryTitles = useMemo(() => [...new Set(categories.map((category) => category.title))], [categories])

  const grammages = useMemo(
    () =>
      [...new Set(categories.flatMap((category) => category.skus.map((sku) => sku.weightGrams)))].sort((a, b) => a - b),
    [categories]
  )

  useEffect(() => {
    if (!open) return
    setDraftCategory(categoryFilterId ?? "")
    setDraftStatus(new Set(statusFilter))
    setDraftStock(new Set(stockStatusFilter))
    setDraftPlatform(platformFilter ?? "")
    setDraftDarkStore(darkStoreFilter ?? "")
    setDraftCoverage(coverageFilter)
    setDraftPrice(priceMin != null ? String(priceMin) : "")
    setDraftGrammage(grammageFilter != null ? String(grammageFilter) : "")
  }, [
    open,
    categoryFilterId,
    statusFilter,
    stockStatusFilter,
    platformFilter,
    darkStoreFilter,
    coverageFilter,
    priceMin,
    grammageFilter,
  ])

  const parsedPrice = draftPrice.trim() === "" ? null : Number(draftPrice)
  const priceMinDraft = parsedPrice != null && !Number.isNaN(parsedPrice) ? parsedPrice : null
  const grammageDraft = draftGrammage ? Number(draftGrammage) : null

  const matchCount = countMatchingSkus({
    categoryFilterId: draftCategory || null,
    statusFilter: draftStatus,
    stockStatusFilter: draftStock,
    platformFilter: draftPlatform || null,
    darkStoreFilter: draftDarkStore || null,
    coverageFilter: draftCoverage,
    priceMin: priceMinDraft,
    grammageFilter: grammageDraft,
  })

  const handleApply = () => {
    setCategoryFilterId(draftCategory || null)
    setStatusFilterAll(draftStatus)
    setStockStatusFilterAll(draftStock)
    setPlatformFilter(draftPlatform || null)
    setDarkStoreFilter(draftDarkStore || null)
    setCoverageFilter(draftCoverage)
    setPriceMin(priceMinDraft)
    setGrammageFilter(grammageDraft)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 min-w-16 items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-sm font-medium text-primary"
      >
        <ListFilter className="size-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent showCloseButton className="sm:max-w-[400px]">
          <SheetHeader className="pr-10">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Platform</span>
              <FieldSelect value={draftPlatform} onChange={setDraftPlatform}>
                <option value="">All Platforms</option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </FieldSelect>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Dark Store</span>
              <FieldSelect value={draftDarkStore} onChange={setDraftDarkStore}>
                <option value="">All Dark Stores</option>
                {darkStores.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </FieldSelect>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Categories</span>
              <FieldSelect value={draftCategory} onChange={setDraftCategory}>
                <option value="">All Categories</option>
                {categoryTitles.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </FieldSelect>
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Chip
                    key={status}
                    active={draftStatus.has(status)}
                    onClick={() => setDraftStatus((prev) => toggleInSet(prev, status))}
                  >
                    {status}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Stock Status</span>
              <div className="flex flex-wrap gap-2">
                {stockStatuses.map((status) => (
                  <Chip
                    key={status}
                    active={draftStock.has(status)}
                    onClick={() => setDraftStock((prev) => toggleInSet(prev, status))}
                  >
                    {status}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Coverage</span>
              <div className="flex flex-wrap gap-2">
                {coverageLevels.map((level) => (
                  <Chip
                    key={level.value}
                    active={draftCoverage === level.value}
                    onClick={() => setDraftCoverage(level.value)}
                  >
                    {level.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Price</span>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Min"
                  value={draftPrice}
                  onChange={(e) => setDraftPrice(e.target.value)}
                  className="h-9"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Grammage</span>
                <FieldSelect value={draftGrammage} onChange={setDraftGrammage}>
                  <option value="">All</option>
                  {grammages.map((grams) => (
                    <option key={grams} value={String(grams)}>
                      {grams}g
                    </option>
                  ))}
                </FieldSelect>
              </label>
            </div>
          </div>

          <SheetFooter>
            <p className="text-xs text-muted-foreground">
              {matchCount}/{totalSkuCount} SKUs match right now.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply}>Apply</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
