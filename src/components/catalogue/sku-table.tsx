import { Fragment } from "react"
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

function SkuRow({ category, sku }: { category: Category; sku: CategorySku }) {
  const { selectedSkuIds, toggleSkuSelected, openSkuDetail } = useCatalogue()
  const selected = selectedSkuIds.has(sku.id)

  return (
    <TableRow data-state={selected ? "selected" : undefined} onClick={() => openSkuDetail(sku.id)} className="cursor-pointer">
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={() => toggleSkuSelected(sku.id)} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <img src={sku.image} alt="" className="size-8 shrink-0 rounded-[3.667px] object-cover" />
          <span className="font-medium text-foreground">{sku.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center rounded-md border-[0.5px] border-emerald-600/10 bg-emerald-600/5 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
          {category.description}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">₹ {sku.mrp}</TableCell>
      <TableCell>₹ {sku.price}</TableCell>
      <TableCell>{sku.weightGrams}g</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-foreground">
          {channelLogos[sku.platform] ? (
            <img src={channelLogos[sku.platform]} alt="" className="size-3.5 shrink-0 rounded-[2px] object-cover" />
          ) : (
            <CircleHelp className="size-3.5 text-muted-foreground" />
          )}
          {sku.platform}
        </div>
      </TableCell>
      <TableCell>{sku.darkStores}</TableCell>
      <TableCell>
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${stockDotClasses[sku.stock]}`}>
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
    <TableRow className="bg-slate-50 hover:bg-slate-50">
      <TableCell colSpan={9} className="py-2 text-sm">
        <span className="text-muted-foreground">Category: </span>
        <span className="font-semibold text-foreground">{category.title}</span>{" "}
        <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {category.skus.length}
        </span>
      </TableCell>
    </TableRow>
  )
}

/** Sortable-by-eye table of every visible SKU, optionally grouped by category. */
export function SkuTable() {
  const { visibleCategories, groupByCategory, selectedSkuIds, setSelectedSkuIds } = useCatalogue()
  const rows = visibleCategories.flatMap((category) =>
    category.skus.map((sku) => ({ category, sku }))
  )

  const allSelected = rows.length > 0 && rows.every(({ sku }) => selectedSkuIds.has(sku.id))
  const someSelected = rows.some(({ sku }) => selectedSkuIds.has(sku.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedSkuIds(new Set())
    } else {
      setSelectedSkuIds(new Set(rows.map(({ sku }) => sku.id)))
    }
  }

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>MRP</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Grammage</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Dark Stores</TableHead>
            <TableHead>Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
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
                      <SkuRow key={sku.id} category={category} sku={sku} />
                    ))}
                  </Fragment>
                )
              )
            : rows.map(({ category, sku }) => <SkuRow key={sku.id} category={category} sku={sku} />)}
        </TableBody>
      </Table>

      <div className="flex h-11 w-full shrink-0 items-center justify-end gap-3 border-t border-border px-4 text-sm text-muted-foreground">
        <span>Showing all {rows.length} SKUs</span>
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
