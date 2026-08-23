import { useState, type DragEvent } from "react"
import { ChevronDown, Plus } from "lucide-react"

import type { Category } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

const statusTagClasses: Record<Category["status"], string> = {
  Active: "bg-emerald-600/5 border-emerald-600/10 text-emerald-800",
  Planning: "bg-indigo-600/5 border-indigo-600/10 text-indigo-800",
  Discontinued: "bg-slate-600/5 border-slate-600/10 text-slate-700",
}

/** A single pinned category cluster on the catalogue board. */
export function CategoryCard({
  id,
  title,
  description,
  itemCount,
  status,
  skus,
  anchorId,
}: Category & { anchorId?: string }) {
  const { collapsedIds, toggleCollapsed, openAddProduct, moveSku, openSkuDetail } = useCatalogue()
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
      <div className="group/header flex flex-col items-start gap-2 p-1">
        <button
          type="button"
          onClick={() => toggleCollapsed(id)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div className="flex w-full flex-col items-start gap-0.5">
            <p className="w-full text-sm leading-5 font-semibold text-foreground">{title}</p>
            <p className="w-full text-xs leading-4 text-muted-foreground">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover/header:opacity-100">
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
              className="flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Add SKU"
            >
              <Plus className="size-3.5" />
            </span>
            <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          </div>
        </button>
        <div className="flex items-start gap-2">
          <span className="flex min-w-6 items-center justify-center rounded-md border-[0.5px] border-stone-500/10 bg-stone-500/5 px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap text-stone-800">
            {itemCount} Items
          </span>
          <span
            className={`flex min-w-6 items-center justify-center rounded-md border-[0.5px] px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap ${statusTagClasses[status]}`}
          >
            {status}
          </span>
        </div>
      </div>

      {!collapsed &&
        (skus.length > 0 ? (
          <div className="flex w-full flex-col items-start gap-2 p-1">
            {skus.map((sku) => (
              <div
                key={sku.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/sku-id", sku.id)
                  e.dataTransfer.setData("text/category-id", id)
                }}
                onClick={() => openSkuDetail(sku.id)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-100 bg-[rgba(241,245,249,0.4)] px-3 py-2 active:cursor-grabbing"
              >
                <img src={sku.image} alt="" className="size-8 shrink-0 rounded-[3.667px] object-cover" />
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 whitespace-nowrap">
                  <p className="text-sm leading-5 font-medium text-foreground">{sku.name}</p>
                  <p className="text-xs leading-4 text-muted-foreground">
                    ₹ {sku.price}・{sku.weightGrams}g・{sku.stores} Stores
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`flex w-full flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm ${
              dragOver ? "border-primary text-primary" : "border-border text-muted-foreground"
            }`}
          >
            Drag a SKU here, or use +Add above to add New SKU
          </div>
        ))}
    </div>
  )
}
