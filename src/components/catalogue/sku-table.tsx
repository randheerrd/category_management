import { Fragment, useMemo } from "react"
import { CircleHelp, ChevronLeft, ChevronRight } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import type { Category, CategorySku, StockStatus } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"
import { channelLogos } from "@/lib/channel-logos"

const stockDotClasses: Record<StockStatus, string> = {
  "In Stock": "text-emerald-700",
  "Low Stock": "text-amber-600",
  "Out of Stock": "text-destructive",
}

// Deterministic tag color per category name — no per-category color is stored anywhere,
// so this hashes the name to pick a consistent swatch across renders. Matches the
// ".tag-base" treatment used elsewhere (colored bg/border/text at low opacity).
const categoryTagClasses = [
  "border-emerald-600/10 bg-emerald-600/5 text-emerald-800",
  "border-blue-600/10 bg-blue-600/5 text-blue-800",
  "border-amber-600/10 bg-amber-600/5 text-amber-800",
  "border-rose-600/10 bg-rose-600/5 text-rose-800",
  "border-violet-600/10 bg-violet-600/5 text-violet-800",
  "border-cyan-600/10 bg-cyan-600/5 text-cyan-800",
  "border-orange-600/10 bg-orange-600/5 text-orange-800",
  "border-teal-600/10 bg-teal-600/5 text-teal-800",
]
function categoryTagClass(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return categoryTagClasses[hash % categoryTagClasses.length]
}

function CategoryBadge({ name }: { name: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border-[0.5px] px-1.5 py-0.5 text-xs font-normal whitespace-nowrap ${categoryTagClass(name)}`}
    >
      {name}
    </span>
  )
}

/** Thin accent bar on the row's left edge — invisible at rest, appears on hover/selection. */
const rowAccentClasses =
  "relative before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary before:opacity-0 before:transition-opacity hover:before:opacity-30 data-[state=selected]:before:opacity-100"

interface ProductRowData {
  sku: CategorySku
  skuIds: string[]
  categories: string[]
  platforms: string[]
}

function ProductRow({ row }: { row: ProductRowData }) {
  const { selectedSkuIds, setSelectedSkuIds, openSkuDetail } = useCatalogue()
  const { sku, skuIds, categories, platforms } = row
  const selected = skuIds.every((id) => selectedSkuIds.has(id))

  const toggleAll = () => {
    const next = new Set(selectedSkuIds)
    if (selected) skuIds.forEach((id) => next.delete(id))
    else skuIds.forEach((id) => next.add(id))
    setSelectedSkuIds(next)
  }

  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      onClick={() => openSkuDetail(sku.id)}
      className={`h-9 cursor-pointer font-normal [&>td]:h-9 [&>td]:py-0 ${rowAccentClasses}`}
    >
      <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={toggleAll} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <img src={sku.image} alt="" className="size-5 shrink-0 rounded-[3px] object-cover" />
          <span className="font-normal text-foreground">{sku.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          {categories.length > 0 ? (
            categories.map((name) => <CategoryBadge key={name} name={name} />)
          ) : (
            <span className="text-muted-foreground">Unsorted</span>
          )}
        </div>
      </TableCell>
      <TableCell className="font-normal text-muted-foreground">₹ {sku.mrp}</TableCell>
      <TableCell className="font-normal">₹ {sku.price}</TableCell>
      <TableCell className="font-normal">{sku.weightGrams}g</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 font-normal text-foreground">
          {platforms.map((platform) => (
            <span key={platform} className="inline-flex items-center gap-1">
              {channelLogos[platform] ? (
                <img src={channelLogos[platform]} alt="" className="size-3.5 shrink-0 rounded-[2px] object-cover" />
              ) : (
                <CircleHelp className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              {platform}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell className="font-normal">{sku.darkStores}</TableCell>
      <TableCell>
        <span className={`inline-flex items-center gap-1 text-xs font-normal ${stockDotClasses[sku.stock]}`}>
          <span aria-hidden className="text-[8px] leading-none">
            •
          </span>
          {sku.stock}
        </span>
      </TableCell>
    </TableRow>
  )
}

function CategoryGroupHeader({ category }: { category: Category }) {
  return (
    <TableRow className="h-9 bg-slate-50 font-normal hover:bg-slate-50">
      <TableCell colSpan={9} className="py-2 text-sm font-normal">
        <span className="text-muted-foreground">Category: </span>
        <span className="font-normal text-foreground">{category.title}</span>{" "}
        <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-normal text-primary-foreground">
          {category.skus.length}
        </span>
      </TableCell>
    </TableRow>
  )
}

/** Flat, edge-to-edge table of every visible product — unique by product name, each row rolling
 *  up every category it's pinned in and every platform it's listed on. Optionally grouped by category. */
export function SkuTable() {
  const { visibleCategories, groupByCategory, selectedSkuIds, setSelectedSkuIds } = useCatalogue()

  // Unique-by-name rollup: a product can be pinned into several categories and appear with a
  // different platform in each — this merges every instance sharing a name into one row.
  const productRows = useMemo(() => {
    const byName = new Map<string, ProductRowData>()
    for (const category of visibleCategories) {
      for (const sku of category.skus) {
        const existing = byName.get(sku.name)
        if (existing) {
          existing.skuIds.push(sku.id)
          if (!existing.categories.includes(category.title)) existing.categories.push(category.title)
          if (!existing.platforms.includes(sku.platform)) existing.platforms.push(sku.platform)
        } else {
          byName.set(sku.name, {
            sku,
            skuIds: [sku.id],
            categories: [category.title],
            platforms: [sku.platform],
          })
        }
      }
    }
    return Array.from(byName.values())
  }, [visibleCategories])

  const allSkuIds = useMemo(() => productRows.flatMap((row) => row.skuIds), [productRows])
  const allSelected = allSkuIds.length > 0 && allSkuIds.every((id) => selectedSkuIds.has(id))
  const someSelected = allSkuIds.some((id) => selectedSkuIds.has(id))

  const toggleSelectAll = () => {
    setSelectedSkuIds(allSelected ? new Set() : new Set(allSkuIds))
  }

  return (
    <div className="flex w-full flex-col border-t border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow className="h-9 bg-[rgba(241,245,249,0.4)] font-normal hover:bg-[rgba(241,245,249,0.4)] [&>th]:h-9 [&>th]:py-0">
            <TableHead className="w-12 font-normal">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="font-normal">Name</TableHead>
            <TableHead className="font-normal">Categories</TableHead>
            <TableHead className="font-normal">MRP</TableHead>
            <TableHead className="font-normal">Price</TableHead>
            <TableHead className="font-normal">Grammage</TableHead>
            <TableHead className="font-normal">Platform</TableHead>
            <TableHead className="font-normal">Dark Stores</TableHead>
            <TableHead className="font-normal">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                No SKUs match your search or filters.
              </TableCell>
            </TableRow>
          )}
          {groupByCategory
            ? visibleCategories.map((category) =>
                category.skus.length === 0 ? null : (
                  <Fragment key={category.id}>
                    <CategoryGroupHeader category={category} />
                    {category.skus.map((sku) => (
                      <ProductRow
                        key={sku.id}
                        row={{ sku, skuIds: [sku.id], categories: [category.title], platforms: [sku.platform] }}
                      />
                    ))}
                  </Fragment>
                )
              )
            : productRows.map((row) => <ProductRow key={row.sku.name} row={row} />)}
        </TableBody>
      </Table>

      <div className="flex h-11 w-full shrink-0 items-center justify-end gap-3 border-t border-border px-4 text-sm text-muted-foreground">
        <span>Showing all {groupByCategory ? visibleCategories.reduce((sum, c) => sum + c.skus.length, 0) : productRows.length} SKUs</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled className="text-muted-foreground/50">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" disabled className="text-muted-foreground/50">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
