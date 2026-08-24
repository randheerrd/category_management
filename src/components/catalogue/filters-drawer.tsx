import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Check, ChevronDown, ListFilter, Search } from "lucide-react"

import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CategoryStatus, CoverageLevel, StockStatus } from "@/lib/catalogue-data"
import { channelNames } from "@/lib/catalogue-data"
import { darkStoreCities, darkStoreLocations } from "@/lib/dark-store-locations"
import { useCatalogue } from "@/lib/catalogue-context"
import { categoryDotClass } from "@/lib/category-colors"

const statuses: CategoryStatus[] = ["Active", "Planning", "Discontinued"]
const stockStatuses: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]
const coverageLevels: { value: CoverageLevel; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "none", label: "No Coverage" },
  { value: "full", label: "Full Coverage" },
  { value: "partial", label: "Partial" },
]

const selectTriggerClass =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">{children}</span>
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

/**
 * Multi-select dropdown used across the modal — a checkbox per option, menu stays open
 * between picks. Trigger collapses the selection down to a label instead of a native <select>.
 */
function MultiSelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: Set<string>
  onChange: (next: Set<string>) => void
  placeholder: string
  options: { value: string; label: string; dotClass?: string }[]
}) {
  const selectedLabel =
    value.size === 0
      ? placeholder
      : value.size === 1
        ? (options.find((option) => value.has(option.value))?.label ?? placeholder)
        : `${value.size} selected`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" className={selectTriggerClass}>
            <span className={value.size ? "" : "text-muted-foreground"}>{selectedLabel}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="max-h-64">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.has(option.value)}
            onCheckedChange={() => onChange(toggleInSet(value, option.value))}
          >
            {option.dotClass && <span className={`size-2 shrink-0 rounded-full ${option.dotClass}`} />}
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Dark Store picker — every physical store across all channels, city-grouped and
 * searchable, multi-select. Distinct from MultiSelectField (a flat checkbox dropdown)
 * because a flat list of 40 stores across 5 channels is unbrowsable without search
 * and city sections.
 */
function DarkStoreMultiSelect({
  value,
  onChange,
}: {
  value: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const trimmed = query.trim().toLowerCase()
  const filtered = darkStoreLocations.filter(
    (store) => store.name.toLowerCase().includes(trimmed) || store.city.toLowerCase().includes(trimmed)
  )
  const citiesInOrder = darkStoreCities.filter((city) => filtered.some((store) => store.city === city))

  const selectedLabel = value.size === 0 ? "All dark stores" : `${value.size} selected`

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger
        render={
          <button type="button" className={selectTriggerClass}>
            <span className={value.size ? "" : "text-muted-foreground"}>{selectedLabel}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) max-w-[calc(100vw-3rem)] p-2">
        <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or store"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex max-h-72 flex-col overflow-y-auto">
          {citiesInOrder.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No stores match.</p>
          ) : (
            citiesInOrder.map((city) => (
              <div key={city} className="flex flex-col">
                <p className="px-2 pt-2 pb-1 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                  {city}
                </p>
                {filtered
                  .filter((store) => store.city === city)
                  .map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => onChange(toggleInSet(value, store.id))}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                          value.has(store.id) ? "border-primary bg-primary text-primary-foreground" : "border-input"
                        }`}
                      >
                        {value.has(store.id) && <Check className="size-3" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-foreground">{store.name}</span>
                    </button>
                  ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Product (SKU name) picker — same search + multi-select interaction as Dark Store,
 *  just flat (no grouping) since there's no natural category to bucket product names by. */
function ProductMultiSelect({
  value,
  onChange,
  options,
}: {
  value: Set<string>
  onChange: (next: Set<string>) => void
  options: string[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const trimmed = query.trim().toLowerCase()
  const filtered = options.filter((name) => name.toLowerCase().includes(trimmed))

  const selectedLabel = value.size === 0 ? "All products" : `${value.size} selected`

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger
        render={
          <button type="button" className={selectTriggerClass}>
            <span className={value.size ? "" : "text-muted-foreground"}>{selectedLabel}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) max-w-[calc(100vw-3rem)] p-2">
        <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex max-h-72 flex-col overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No products match.</p>
          ) : (
            filtered.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onChange(toggleInSet(value, name))}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                    value.has(name) ? "border-primary bg-primary text-primary-foreground" : "border-input"
                  }`}
                >
                  {value.has(name) && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">{name}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Right-side Filters sheet matching the Figma drawer. Field options come from the SKU table
 * (platform, dark store, category, stock, price, grammage) so every control actually filters
 * rows — every dropdown here is multi-select.
 */
export function FiltersDrawer() {
  const {
    categories,
    activeFilterCount,
    categoryFilterIds,
    setCategoryFilterIds,
    statusFilter,
    setStatusFilterAll,
    productNameFilter,
    setProductNameFilterAll,
    stockStatusFilter,
    setStockStatusFilterAll,
    platformFilter,
    setPlatformFilterAll,
    darkStoreFilter,
    setDarkStoreFilterAll,
    coverageFilter,
    setCoverageFilter,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    grammageFilter,
    setGrammageFilterAll,
  } = useCatalogue()

  const [open, setOpen] = useState(false)
  const [draftCategoryIds, setDraftCategoryIds] = useState<Set<string>>(new Set())
  const [draftStatus, setDraftStatus] = useState<Set<CategoryStatus>>(new Set())
  const [draftProductNames, setDraftProductNames] = useState<Set<string>>(new Set())
  const [draftStock, setDraftStock] = useState<Set<StockStatus>>(new Set())
  const [draftPlatforms, setDraftPlatforms] = useState<Set<string>>(new Set())
  const [draftDarkStores, setDraftDarkStores] = useState<Set<string>>(new Set())
  const [draftCoverage, setDraftCoverage] = useState<CoverageLevel>("any")
  const [draftPriceMin, setDraftPriceMin] = useState("")
  const [draftPriceMax, setDraftPriceMax] = useState("")
  const [draftGrammages, setDraftGrammages] = useState<Set<string>>(new Set())

  const platforms = useMemo(() => {
    const fromTable = categories.flatMap((category) => category.skus.flatMap((sku) => sku.platforms))
    return [...new Set([...channelNames, ...fromTable])].filter(Boolean)
  }, [categories])

  const productNames = useMemo(
    () => [...new Set(categories.flatMap((category) => category.skus.map((sku) => sku.name)))].sort(),
    [categories]
  )

  const categoryOptions = useMemo(
    () => [...new Map(categories.map((category) => [category.title, category.id])).entries()],
    [categories]
  )

  const grammages = useMemo(
    () =>
      [...new Set(categories.flatMap((category) => category.skus.map((sku) => sku.weightGrams)))].sort((a, b) => a - b),
    [categories]
  )

  useEffect(() => {
    if (!open) return
    setDraftCategoryIds(new Set(categoryFilterIds))
    setDraftStatus(new Set(statusFilter))
    setDraftProductNames(new Set(productNameFilter))
    setDraftStock(new Set(stockStatusFilter))
    setDraftPlatforms(new Set(platformFilter))
    // darkStoreFilter is channel-level (that's the granularity the underlying coverage
    // data has); the picker itself works in specific store ids, so re-opening the drawer
    // pre-checks every store belonging to a previously-applied channel.
    setDraftDarkStores(new Set(darkStoreLocations.filter((s) => darkStoreFilter.has(s.channel)).map((s) => s.id)))
    setDraftCoverage(coverageFilter)
    setDraftPriceMin(priceMin != null ? String(priceMin) : "")
    setDraftPriceMax(priceMax != null ? String(priceMax) : "")
    setDraftGrammages(new Set([...grammageFilter].map(String)))
  }, [
    open,
    categoryFilterIds,
    statusFilter,
    productNameFilter,
    stockStatusFilter,
    platformFilter,
    darkStoreFilter,
    coverageFilter,
    priceMin,
    priceMax,
    grammageFilter,
  ])

  const parsedPriceMin = draftPriceMin.trim() === "" ? null : Number(draftPriceMin)
  const priceMinDraft = parsedPriceMin != null && !Number.isNaN(parsedPriceMin) ? parsedPriceMin : null
  const parsedPriceMax = draftPriceMax.trim() === "" ? null : Number(draftPriceMax)
  const priceMaxDraft = parsedPriceMax != null && !Number.isNaN(parsedPriceMax) ? parsedPriceMax : null

  const handleClearAll = () => {
    setDraftCategoryIds(new Set())
    setDraftStatus(new Set())
    setDraftProductNames(new Set())
    setDraftStock(new Set())
    setDraftPlatforms(new Set())
    setDraftDarkStores(new Set())
    setDraftCoverage("any")
    setDraftPriceMin("")
    setDraftPriceMax("")
    setDraftGrammages(new Set())
  }

  const hasDraftFilters =
    draftCategoryIds.size > 0 ||
    draftStatus.size > 0 ||
    draftProductNames.size > 0 ||
    draftStock.size > 0 ||
    draftPlatforms.size > 0 ||
    draftDarkStores.size > 0 ||
    draftCoverage !== "any" ||
    draftPriceMin !== "" ||
    draftPriceMax !== "" ||
    draftGrammages.size > 0

  const handleApply = () => {
    setCategoryFilterIds(draftCategoryIds)
    setStatusFilterAll(draftStatus)
    setProductNameFilterAll(draftProductNames)
    setStockStatusFilterAll(draftStock)
    setPlatformFilterAll(draftPlatforms)
    // Collapse the selected store ids back down to their parent channels — that's the
    // granularity skuMatchesFilters actually checks against.
    setDarkStoreFilterAll(
      new Set(
        darkStoreLocations.filter((s) => draftDarkStores.has(s.id)).map((s) => s.channel)
      )
    )
    setCoverageFilter(draftCoverage)
    setPriceMin(priceMinDraft)
    setPriceMax(priceMaxDraft)
    setGrammageFilterAll(new Set([...draftGrammages].map(Number)))
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

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
            <label className="flex flex-col gap-1.5">
              <SectionLabel>Products</SectionLabel>
              <ProductMultiSelect value={draftProductNames} onChange={setDraftProductNames} options={productNames} />
            </label>

            <label className="flex flex-col gap-1.5">
              <SectionLabel>Dark Store</SectionLabel>
              <DarkStoreMultiSelect value={draftDarkStores} onChange={setDraftDarkStores} />
            </label>

            <label className="flex flex-col gap-1.5">
              <SectionLabel>Platform</SectionLabel>
              <MultiSelectField
                value={draftPlatforms}
                onChange={setDraftPlatforms}
                placeholder="All platforms"
                options={platforms.map((platform) => ({ value: platform, label: platform }))}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <SectionLabel>Categories</SectionLabel>
              <MultiSelectField
                value={draftCategoryIds}
                onChange={setDraftCategoryIds}
                placeholder="All categories"
                options={categoryOptions.map(([title, id]) => ({ value: id, label: title, dotClass: categoryDotClass(title) }))}
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <SectionLabel>Category Status</SectionLabel>
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
              <SectionLabel>Stock Status</SectionLabel>
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
              <SectionLabel>Dark Store Coverage</SectionLabel>
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

            <div className="flex flex-col gap-2">
              <SectionLabel>Price &amp; Size</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Min Price (₹)</span>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Min"
                    value={draftPriceMin}
                    onChange={(e) => setDraftPriceMin(e.target.value)}
                    className="h-8"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Max Price (₹)</span>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Max"
                    value={draftPriceMax}
                    onChange={(e) => setDraftPriceMax(e.target.value)}
                    className="h-8"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Grammage</span>
                <MultiSelectField
                  value={draftGrammages}
                  onChange={setDraftGrammages}
                  placeholder="All"
                  options={grammages.map((grams) => ({ value: String(grams), label: `${grams}g` }))}
                />
              </label>
            </div>
          </div>

          <SheetFooter>
            {hasDraftFilters ? (
              <Button type="button" variant="ghost" onClick={handleClearAll}>
                Clear all
              </Button>
            ) : (
              <span />
            )}
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
