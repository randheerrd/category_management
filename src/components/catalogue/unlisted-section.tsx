import { useRef, useState, type DragEvent } from "react"
import { ChevronDown, Pin } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Category } from "@/lib/catalogue-data"
import { UNLISTED_CATEGORY_ID } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

/** One Unlisted SKU rendered as a small card in the expanded stack grid — draggable
 *  onto any category card to pin it, same drag source contract (`text/sku-id` +
 *  `text/category-id`) every category card's own drop zone already understands. */
function StackCard({
  sku,
  categoryId,
  selected,
  onToggleSelected,
  onOpenDetail,
  otherCategoryTitles,
  highlighted,
  onHoverStart,
  onHoverEnd,
}: {
  sku: Category["skus"][number]
  categoryId: string
  selected: boolean
  onToggleSelected: () => void
  onOpenDetail: () => void
  otherCategoryTitles: string[]
  highlighted: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/sku-id", sku.id)
    e.dataTransfer.setData("text/category-id", categoryId)
    e.dataTransfer.effectAllowed = "move"

    // Detached, explicitly-sized clone so the browser only ever snapshots the card
    // itself — handing it the live in-flow node risks it grabbing the whole grid.
    const source = cardRef.current
    if (source) {
      const rect = source.getBoundingClientRect()
      const clone = source.cloneNode(true) as HTMLElement
      clone.style.position = "fixed"
      clone.style.top = "-9999px"
      clone.style.left = "-9999px"
      clone.style.width = `${rect.width}px`
      clone.style.height = `${rect.height}px`
      clone.style.margin = "0"
      clone.style.pointerEvents = "none"
      document.body.appendChild(clone)
      e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top)
      requestAnimationFrame(() => clone.remove())
    }
  }

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpenDetail()
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className={`flex cursor-grab flex-col gap-2 rounded-xl border bg-card p-2.5 text-left transition-colors active:cursor-grabbing ${
        highlighted
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : selected
            ? "border-primary/30 bg-primary/5"
            : "border-border hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <img src={sku.image} alt="" draggable={false} className="size-10 shrink-0 rounded-[6px] object-cover" />
        <span
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          // Checkbox's invisible hit-target extends well past its visible box (bigger
          // tap target) — without clipping it here, that hover/click area bleeds into
          // the image next to it, so hovering the image itself shows a pointer cursor
          // as if it were part of the checkbox. size-4 + overflow-hidden masks it back
          // down to just the checkbox's own bounds. cursor-pointer overrides the card's
          // cursor-grab (it's draggable) so the checkbox reads as clickable, not "grab".
          className="flex size-4 shrink-0 cursor-pointer items-center overflow-hidden"
        >
          <Checkbox checked={selected} onCheckedChange={onToggleSelected} />
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-0.5">
          <p className="truncate text-sm leading-5 font-medium text-foreground">{sku.name}</p>
          {otherCategoryTitles.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="flex h-4 shrink-0 items-center gap-1 rounded-full border-[0.5px] border-stone-500/10 bg-stone-500/5 px-2 text-xs leading-4 font-medium whitespace-nowrap text-stone-800">
                    <Pin className="size-3" />
                    {otherCategoryTitles.length + 1}
                  </span>
                }
              />
              <TooltipContent side="bottom">Also in: {otherCategoryTitles.join(", ")}</TooltipContent>
            </Tooltip>
          )}
        </span>
        <p className="text-xs leading-4 text-muted-foreground">
          ₹ {sku.price}・{sku.weightGrams}g・{sku.stores} Store{sku.stores === 1 ? "" : "s"}
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
  const {
    categories,
    moveSku,
    openSkuDetail,
    selectedSkuIds,
    toggleSkuSelected,
    collapsedIds,
    toggleCollapsed,
    hoveredSkuId,
    setHoveredSkuId,
    clearHoveredSkuId,
  } = useCatalogue()
  // Shared with every other category card's collapse state — lets the health panel's
  // "N SKUs aren't pinned" row expand this from outside instead of only toggling locally.
  const expanded = !collapsedIds.has(category.id)
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
        onClick={() => toggleCollapsed(category.id)}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
        aria-expanded={expanded}
      >
        <p className="text-sm leading-5 font-semibold text-foreground">
          {category.skus.length} Item{category.skus.length === 1 ? "" : "s"} {category.skus.length === 1 ? "is" : "are"} not in any list
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
                categoryId={category.id}
                selected={selectedSkuIds.has(sku.id)}
                onToggleSelected={() => toggleSkuSelected(sku.id)}
                onOpenDetail={() => openSkuDetail(sku.id)}
                otherCategoryTitles={categories
                  .filter((c) => c.id !== category.id && c.skus.some((s) => s.id === sku.id))
                  .map((c) => c.title)}
                highlighted={hoveredSkuId === sku.id}
                onHoverStart={() => setHoveredSkuId(sku.id)}
                onHoverEnd={() => clearHoveredSkuId(sku.id)}
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
