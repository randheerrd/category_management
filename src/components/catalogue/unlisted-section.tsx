import { useState, type DragEvent } from "react"
import { ChevronDown } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import type { Category } from "@/lib/catalogue-data"
import { UNLISTED_CATEGORY_ID } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

/** One Unlisted SKU rendered as a small card in the expanded stack grid. */
function StackCard({ sku, selected, onToggleSelected, onOpenDetail }: {
  sku: Category["skus"][number]
  selected: boolean
  onToggleSelected: () => void
  onOpenDetail: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpenDetail()
      }}
      className={`flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-2.5 text-left shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] transition-colors ${
        selected ? "border-primary/30 bg-primary/5" : "border-[rgba(241,245,249,0.4)] hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <img src={sku.image} alt="" className="size-10 shrink-0 rounded-[6px] object-cover" />
        <span
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center"
        >
          <Checkbox checked={selected} onCheckedChange={onToggleSelected} />
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="truncate text-sm leading-5 font-medium text-foreground">{sku.name}</p>
        <p className="text-xs leading-4 text-muted-foreground">
          ₹ {sku.price}・{sku.weightGrams}g・{sku.stores} Stores
        </p>
      </div>
    </div>
  )
}

/**
 * The catch-all "Unlisted" category, surfaced above the board as one collapsible bar
 * instead of a regular grid card — collapsed it's just a count, expanded it lays the
 * SKUs out as a grid of small cards that wraps across the row and down the page.
 */
export function UnlistedSection({ category }: { category: Category }) {
  const { moveSku, openSkuDetail, selectedSkuIds, toggleSkuSelected } = useCatalogue()
  const [expanded, setExpanded] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const skuId = e.dataTransfer.getData("text/sku-id")
    const fromCategoryId = e.dataTransfer.getData("text/category-id")
    if (skuId && fromCategoryId) moveSku(skuId, fromCategoryId, UNLISTED_CATEGORY_ID)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex w-full flex-col overflow-hidden rounded-xl border bg-card transition-colors ${
        dragOver ? "border-primary/40 bg-primary/5" : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-muted"
        aria-expanded={expanded}
      >
        <p className="text-sm leading-5 font-semibold text-foreground">
          {category.skus.length} Item{category.skus.length === 1 ? "" : "s"} are in not in any list
        </p>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "" : "-rotate-90"}`} />
      </button>

      {expanded &&
        (category.skus.length > 0 ? (
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 p-3 pt-0">
            {category.skus.map((sku) => (
              <StackCard
                key={sku.id}
                sku={sku}
                selected={selectedSkuIds.has(sku.id)}
                onToggleSelected={() => toggleSkuSelected(sku.id)}
                onOpenDetail={() => openSkuDetail(sku.id)}
              />
            ))}
          </div>
        ) : (
          <div
            className={`mx-3 mb-3 flex items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm ${
              dragOver ? "border-primary text-primary" : "border-border text-muted-foreground"
            }`}
          >
            Drag a SKU here to unpin it from its category
          </div>
        ))}
    </div>
  )
}
