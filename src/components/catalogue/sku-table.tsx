import { Fragment, useMemo, useRef, useState, type DragEvent } from "react"
import { CircleHelp, ChevronLeft, ChevronRight, ChevronDown, GripVertical } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Category, CategorySku, StockStatus } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"
import { channelLogos } from "@/lib/channel-logos"

/** How many platform avatars show before the rest collapse into a "+N" chip. */
const MAX_VISIBLE_PLATFORMS = 4

/** One logo in the platform stack — overlapping circles with a background-colored ring
 *  so they read as a group instead of a cluttered row of icon+label pairs. */
function PlatformAvatar({ platform, overlap }: { platform: string; overlap: boolean }) {
  const logo = channelLogos[platform]
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={`flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted ${overlap ? "-ml-2" : ""}`}
          >
            {logo ? (
              <img src={logo} alt="" className="size-full object-cover" />
            ) : (
              <CircleHelp className="size-3.5 text-muted-foreground" />
            )}
          </span>
        }
      />
      <TooltipContent side="top">{platform}</TooltipContent>
    </Tooltip>
  )
}

function PlatformStack({ platforms }: { platforms: string[] }) {
  const visible = platforms.slice(0, MAX_VISIBLE_PLATFORMS)
  const overflow = platforms.length - visible.length

  return (
    <div className="flex items-center">
      {visible.map((platform, i) => (
        <PlatformAvatar key={platform} platform={platform} overlap={i > 0} />
      ))}
      {overflow > 0 && (
        <span className="-ml-2 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  )
}

const stockDotClasses: Record<StockStatus, string> = {
  "In Stock": "text-emerald-700",
  "Low Stock": "text-amber-600",
  "Out of Stock": "text-destructive",
}

interface ProductRowData {
  sku: CategorySku
  skuIds: string[]
  platforms: string[]
  /** Only set for a grouped row (one SKU, one category) — that's the only case a drag has an
   *  unambiguous single category to move *from*, so only grouped rows get the grip handle. */
  categoryId?: string
}

function ProductRow({ row, dragOver, onDragOverRow, onDragLeaveRow, onDropRow }: {
  row: ProductRowData
  dragOver: boolean
  onDragOverRow: (e: DragEvent) => void
  onDragLeaveRow: () => void
  onDropRow: (e: DragEvent) => void
}) {
  const { selectedSkuIds, setSelectedSkuIds, openSkuDetail } = useCatalogue()
  const { sku, skuIds, platforms, categoryId } = row
  const selected = skuIds.every((id) => selectedSkuIds.has(id))
  const rowRef = useRef<HTMLTableRowElement>(null)

  const toggleAll = () => {
    const next = new Set(selectedSkuIds)
    if (selected) skuIds.forEach((id) => next.delete(id))
    else skuIds.forEach((id) => next.add(id))
    setSelectedSkuIds(next)
  }

  const handleDragStart = (e: DragEvent) => {
    if (!categoryId) return
    e.dataTransfer.setData("text/sku-id", sku.id)
    e.dataTransfer.setData("text/category-id", categoryId)
    e.dataTransfer.effectAllowed = "move"

    // Detached, explicitly-sized clone so the browser only ever snapshots the row itself —
    // handing it the live in-flow row risks it grabbing the whole table as the drag image.
    const source = rowRef.current
    if (source) {
      const rect = source.getBoundingClientRect()
      const clone = source.cloneNode(true) as HTMLElement
      clone.style.position = "fixed"
      clone.style.top = "-9999px"
      clone.style.left = "-9999px"
      clone.style.width = `${rect.width}px`
      clone.style.height = `${rect.height}px`
      clone.style.display = "table"
      clone.style.pointerEvents = "none"
      document.body.appendChild(clone)
      e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top)
      requestAnimationFrame(() => clone.remove())
    }
  }

  return (
    <TableRow
      ref={rowRef}
      data-state={selected ? "selected" : undefined}
      onClick={() => openSkuDetail(sku.id)}
      onDragOver={categoryId ? onDragOverRow : undefined}
      onDragLeave={categoryId ? onDragLeaveRow : undefined}
      onDrop={categoryId ? onDropRow : undefined}
      className={`group h-9 cursor-pointer font-normal [&>td]:h-9 [&>td]:py-0 ${dragOver ? "bg-primary/5" : ""}`}
    >
      <TableCell className="w-6 p-0" onClick={(e) => e.stopPropagation()}>
        {categoryId && (
          <div
            draggable
            onDragStart={handleDragStart}
            className="flex size-9 cursor-grab items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripVertical className="size-3.5 text-muted-foreground/50" />
          </div>
        )}
      </TableCell>
      <TableCell className="w-9 p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex size-9 items-center justify-center">
          <Checkbox checked={selected} onCheckedChange={toggleAll} />
        </div>
      </TableCell>
      <TableCell className="overflow-hidden">
        <div className="flex min-w-0 items-center gap-2">
          <img src={sku.image} alt="" className="size-5 shrink-0 rounded-[3px] object-cover" />
          <span className="truncate font-normal text-foreground">{sku.name}</span>
        </div>
      </TableCell>
      <TableCell className="font-normal text-muted-foreground">₹ {sku.mrp}</TableCell>
      <TableCell className="font-normal">₹ {sku.price}</TableCell>
      <TableCell className="font-normal">{sku.weightGrams}g</TableCell>
      <TableCell className="overflow-hidden">
        <PlatformStack platforms={platforms} />
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

function CategoryGroupHeader({
  category,
  collapsed,
  onToggle,
  dragOver,
  onDragOverRow,
  onDragLeaveRow,
  onDropRow,
}: {
  category: Category
  collapsed: boolean
  onToggle: () => void
  dragOver: boolean
  onDragOverRow: (e: DragEvent) => void
  onDragLeaveRow: () => void
  onDropRow: (e: DragEvent) => void
}) {
  return (
    <TableRow
      className={`h-9 cursor-pointer bg-slate-50 font-normal hover:bg-slate-100 ${dragOver ? "bg-primary/5" : ""}`}
      onClick={onToggle}
      onDragOver={onDragOverRow}
      onDragLeave={onDragLeaveRow}
      onDrop={onDropRow}
    >
      <TableCell colSpan={9} className="py-2 text-sm font-normal">
        <div className="flex items-center gap-1.5">
          <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          <span className="text-muted-foreground">Category: </span>
          <span className="font-normal text-foreground">{category.title}</span>
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-normal text-primary-foreground">
            {category.skus.length}
          </span>
        </div>
      </TableCell>
    </TableRow>
  )
}

/** Flat, edge-to-edge table of every visible product — unique by product name, each row rolling
 *  up every category it's pinned in and every platform it's listed on. Optionally grouped by category. */
export function SkuTable() {
  const { visibleCategories, groupByCategory, selectedSkuIds, setSelectedSkuIds, moveSku, collapsedIds, toggleCollapsed } =
    useCatalogue()
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)

  const dragHandlersFor = (toCategoryId: string) => ({
    dragOver: dragOverCategoryId === toCategoryId,
    onDragOverRow: (e: DragEvent) => {
      e.preventDefault()
      setDragOverCategoryId(toCategoryId)
    },
    onDragLeaveRow: () => setDragOverCategoryId((prev) => (prev === toCategoryId ? null : prev)),
    onDropRow: (e: DragEvent) => {
      e.preventDefault()
      setDragOverCategoryId(null)
      const skuId = e.dataTransfer.getData("text/sku-id")
      const fromCategoryId = e.dataTransfer.getData("text/category-id")
      if (skuId && fromCategoryId) moveSku(skuId, fromCategoryId, toCategoryId)
    },
  })

  // Unique-by-name rollup: a product can be pinned into several categories and appear with a
  // different platform in each — this merges every instance sharing a name into one row.
  const productRows = useMemo(() => {
    const byName = new Map<string, ProductRowData>()
    for (const category of visibleCategories) {
      for (const sku of category.skus) {
        const existing = byName.get(sku.name)
        if (existing) {
          existing.skuIds.push(sku.id)
          for (const platform of sku.platforms) {
            if (!existing.platforms.includes(platform)) existing.platforms.push(platform)
          }
        } else {
          byName.set(sku.name, {
            sku,
            skuIds: [sku.id],
            platforms: [...sku.platforms],
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
    <div className="flex w-full flex-col bg-background">
      <Table className="table-fixed">
        <colgroup>
          <col className="w-6" />
          <col className="w-9" />
          <col className="w-[28%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          <col className="w-[10%]" />
          <col className="w-[15%]" />
          <col className="w-[14%]" />
          <col className="w-[15%]" />
        </colgroup>
        <TableHeader className="[&_tr]:border-b [&_tr]:border-border">
          <TableRow className="h-9 bg-background font-normal text-muted-foreground hover:bg-background [&>th]:h-9 [&>th]:py-0">
            <TableHead className="w-6 p-0" />
            <TableHead className="w-9 p-0 font-normal">
              <div className="flex size-9 items-center justify-center">
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onCheckedChange={toggleSelectAll}
                />
              </div>
            </TableHead>
            <TableHead className="font-normal text-muted-foreground">Name</TableHead>
            <TableHead className="font-normal text-muted-foreground">MRP</TableHead>
            <TableHead className="font-normal text-muted-foreground">Price</TableHead>
            <TableHead className="font-normal text-muted-foreground">Grammage</TableHead>
            <TableHead className="font-normal text-muted-foreground">Platform</TableHead>
            <TableHead className="font-normal text-muted-foreground">Dark Stores</TableHead>
            <TableHead className="font-normal text-muted-foreground">Stock</TableHead>
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
            ? visibleCategories.map((category) => {
                const collapsed = collapsedIds.has(category.id)
                const dragHandlers = dragHandlersFor(category.id)
                return (
                  <Fragment key={category.id}>
                    <CategoryGroupHeader
                      category={category}
                      collapsed={collapsed}
                      onToggle={() => toggleCollapsed(category.id)}
                      {...dragHandlers}
                    />
                    {!collapsed &&
                      (category.skus.length > 0 ? (
                        category.skus.map((sku) => (
                          <ProductRow
                            key={sku.id}
                            row={{ sku, skuIds: [sku.id], platforms: sku.platforms, categoryId: category.id }}
                            {...dragHandlers}
                          />
                        ))
                      ) : (
                        // Empty category (nothing pinned yet, or filters excluded every SKU
                        // it has) — same placeholder copy as the grid view's CategoryCard,
                        // still wired to this category's own drop handlers so dragging a
                        // SKU here pins it in, same as dropping on the header row above.
                        <TableRow
                          onDragOver={dragHandlers.onDragOverRow}
                          onDragLeave={dragHandlers.onDragLeaveRow}
                          onDrop={dragHandlers.onDropRow}
                        >
                          <TableCell colSpan={9} className="py-4 text-center text-sm text-muted-foreground">
                            Drag a SKU here, or use +Add above to add New SKU
                          </TableCell>
                        </TableRow>
                      ))}
                  </Fragment>
                )
              })
            : productRows.map((row) => (
                <ProductRow
                  key={row.sku.name}
                  row={row}
                  dragOver={false}
                  onDragOverRow={() => {}}
                  onDragLeaveRow={() => {}}
                  onDropRow={() => {}}
                />
              ))}
        </TableBody>
      </Table>

      <div className="sticky bottom-0 z-10 flex h-11 w-full shrink-0 items-center justify-end gap-3 border-t border-border bg-background px-4 text-sm text-muted-foreground">
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
