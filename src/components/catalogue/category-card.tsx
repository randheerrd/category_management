import { useRef, useState, type DragEvent } from "react"
import { ChevronDown, Plus, GripVertical, Pin } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CategoryStatusTag } from "@/components/catalogue/category-status-tag"
import type { Category, CategorySku } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

interface SkuRowProps {
  sku: CategorySku
  categoryId: string
  selected: boolean
  onToggleSelected: () => void
  onOpenDetail: () => void
  /** Titles of the other categories this same SKU is also pinned to, if any. */
  otherCategoryTitles: string[]
  highlighted: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
}

/**
 * One SKU row on a category card. The whole row is a drag source (anywhere except the
 * checkbox) — dragging still coexists with click-to-open-detail since a real drag
 * suppresses the click, and with the checkbox click since that has its own stopPropagation
 * plus an explicit draggable={false} to opt its subtree out of the row's drag.
 */
function SkuRow({
  sku,
  categoryId,
  selected,
  onToggleSelected,
  onOpenDetail,
  otherCategoryTitles,
  highlighted,
  onHoverStart,
  onHoverEnd,
}: SkuRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/sku-id", sku.id)
    e.dataTransfer.setData("text/category-id", categoryId)
    e.dataTransfer.effectAllowed = "move"

    // Don't hand the browser the live row node — it's a flex-1 child inside a
    // responsive grid, and some environments snapshot the whole ancestor layout
    // instead of just the row when the drag-image element is still in flow. A
    // detached, explicitly-sized clone always yields a small, row-only ghost.
    const source = rowRef.current
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
      ref={rowRef}
      draggable
      onDragStart={handleDragStart}
      onClick={onOpenDetail}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className={`group/sku flex w-full cursor-grab items-center gap-1.5 rounded-lg border px-2 py-2 select-none transition-colors active:cursor-grabbing ${
        highlighted
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : selected
            ? "border-primary/30 bg-primary/5"
            : "border-slate-100 bg-[rgba(241,245,249,0.4)] hover:border-slate-200 hover:bg-[rgba(241,245,249,0.9)]"
      }`}
    >
      <img src={sku.image} alt="" draggable={false} className="size-8 shrink-0 rounded-[3.667px] object-cover" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 whitespace-nowrap">
        <span className="flex items-center gap-0.5">
          <p className="truncate text-sm leading-5 font-medium text-foreground">{sku.name}</p>
          {otherCategoryTitles.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="flex h-4 shrink-0 items-center gap-1 rounded-full border-[0.5px] border-stone-500/10 bg-stone-500/5 py-0 pr-2 pl-1 text-xs leading-4 font-medium whitespace-nowrap text-stone-800">
                    <Pin className="size-3" fill="currentColor" />
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
      <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/sku:opacity-100">
        <GripVertical className="size-3.5 text-muted-foreground/50" />
      </span>
      <span
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        // Checkbox's invisible hit-target extends well past its visible box (bigger tap
        // target) — without clipping it here, that hover/click area bleeds into the grip
        // icon and name text next to it, so hovering those shows a pointer cursor as if
        // they were part of the checkbox. size-4 + overflow-hidden masks it back down to
        // just the checkbox's own bounds. cursor-pointer overrides the row's cursor-grab
        // (this row is draggable) so the checkbox's own hotspot reads as clickable, same
        // as the table view's checkbox, instead of inheriting the row's "grab" hand.
        className="flex size-4 shrink-0 cursor-pointer items-center overflow-hidden"
      >
        <Checkbox checked={selected} onCheckedChange={onToggleSelected} />
      </span>
    </div>
  )
}

/** A single pinned category cluster on the catalogue board. */
export function CategoryCard({
  id,
  title,
  description,
  status,
  skus,
  anchorId,
}: Category & { anchorId?: string }) {
  const {
    categories,
    collapsedIds,
    toggleCollapsed,
    openAddProduct,
    openManageCategory,
    moveSku,
    openSkuDetail,
    selectedSkuIds,
    toggleSkuSelected,
    hoveredSkuId,
    setHoveredSkuId,
    clearHoveredSkuId,
  } = useCatalogue()
  const collapsed = collapsedIds.has(id)
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
    if (skuId && fromCategoryId) moveSku(skuId, fromCategoryId, id)
  }

  return (
    <div
      id={anchorId}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex w-full flex-col gap-4 rounded-xl border bg-card p-3 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] transition-colors ${
        dragOver ? "border-primary/40 bg-primary/5" : "border-[rgba(241,245,249,0.4)]"
      }`}
    >
      <div className="group/header flex flex-col p-1">
        <div
          role="button"
          tabIndex={0}
          onClick={() => openManageCategory(id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openManageCategory(id)
          }}
          className="-m-1 flex w-full cursor-pointer flex-col items-start gap-2 rounded-lg p-1 text-left transition-colors hover:bg-muted"
        >
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex w-full flex-col items-start gap-0.5">
              <p className="w-full text-sm leading-5 font-semibold text-foreground">{title}</p>
              <p className="w-full text-xs leading-4 text-muted-foreground">{description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        openAddProduct(id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation()
                          openAddProduct(id)
                        }
                      }}
                      className="flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      <Plus className="size-3.5" />
                    </span>
                  }
                />
                <TooltipContent side="top">Add SKU</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCollapsed(id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation()
                          toggleCollapsed(id)
                        }
                      }}
                      className="flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      <ChevronDown className={`size-3.5 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
                    </span>
                  }
                />
                <TooltipContent side="top">{collapsed ? "Expand" : "Collapse"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex min-w-6 items-center justify-center rounded-md border-[0.5px] border-stone-500/10 bg-stone-500/5 px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap text-stone-800">
              {skus.length} Item{skus.length === 1 ? "" : "s"}
            </span>
            <CategoryStatusTag status={status} />
          </div>
        </div>
      </div>

      {!collapsed &&
        (skus.length > 0 ? (
          <div className="flex w-full flex-col items-start gap-2 p-1">
            {skus.map((sku) => (
              <SkuRow
                key={sku.id}
                sku={sku}
                categoryId={id}
                selected={selectedSkuIds.has(sku.id)}
                onToggleSelected={() => toggleSkuSelected(sku.id)}
                onOpenDetail={() => openSkuDetail(sku.id)}
                otherCategoryTitles={categories
                  .filter((c) => c.id !== id && c.skus.some((s) => s.id === sku.id))
                  .map((c) => c.title)}
                highlighted={hoveredSkuId === sku.id}
                onHoverStart={() => setHoveredSkuId(sku.id)}
                onHoverEnd={() => clearHoveredSkuId(sku.id)}
              />
            ))}
          </div>
        ) : (
          <div
            className={`flex w-full items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm ${
              dragOver ? "border-primary text-primary" : "border-border text-muted-foreground"
            }`}
          >
            Drag a SKU here, or use +Add above to add New SKU
          </div>
        ))}
    </div>
  )
}
