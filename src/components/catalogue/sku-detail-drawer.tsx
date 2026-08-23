import { useEffect, useState } from "react"
import { Trash2, X } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { StockStatus } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"
import channelIcon from "@/assets/channel-icon.svg"

const stockOptions: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]

/** Right-side drawer for viewing and editing a single SKU. */
export function SkuDetailDrawer() {
  const { categories, selectedSkuId, closeSkuDetail, updateSku, deleteSku, bulkMoveToCategory, bulkRemoveFromCategory } =
    useCatalogue()

  const category = categories.find((c) => c.skus.some((s) => s.id === selectedSkuId))
  const sku = category?.skus.find((s) => s.id === selectedSkuId)

  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [weightGrams, setWeightGrams] = useState("")
  const [stock, setStock] = useState<StockStatus>("In Stock")
  const [pinTarget, setPinTarget] = useState("")

  useEffect(() => {
    if (!sku) return
    setMrp(String(sku.mrp))
    setPrice(String(sku.price))
    setWeightGrams(String(sku.weightGrams))
    setStock(sku.stock)
    setPinTarget("")
  }, [sku])

  if (!category || !sku) return null

  const totalFilled = sku.darkStoreAvailability.reduce((sum, c) => sum + c.filled, 0)
  const totalStores = sku.darkStoreAvailability.reduce((sum, c) => sum + c.total, 0)

  const otherCategories = categories.filter((c) => c.id !== category.id)

  const handleSave = () => {
    updateSku(sku.id, {
      mrp: Number(mrp) || sku.mrp,
      price: Number(price) || sku.price,
      weightGrams: Number(weightGrams) || sku.weightGrams,
      stock,
    })
    closeSkuDetail()
  }

  const handlePinHere = () => {
    if (!pinTarget) return
    bulkMoveToCategory([sku.id], pinTarget)
    setPinTarget("")
  }

  return (
    <Sheet open={Boolean(selectedSkuId)} onOpenChange={(open) => !open && closeSkuDetail()}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="justify-between">
          <SheetTitle>{sku.name}</SheetTitle>
          <button
            type="button"
            onClick={closeSkuDetail}
            aria-label="Close"
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          <img src={sku.image} alt={sku.name} className="aspect-[2.4] w-full rounded-lg object-cover" />

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">MRP (₹)</span>
              <Input value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Selling Price (₹)</span>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Grammage</span>
              <Input value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} inputMode="numeric" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Status</span>
              <select
                value={stock}
                onChange={(e) => setStock(e.target.value as StockStatus)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {stockOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Pinned in</p>
            <div className="flex items-center gap-2">
              <select
                value={pinTarget}
                onChange={(e) => setPinTarget(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Category</option>
                {otherCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={handlePinHere} disabled={!pinTarget} className="shrink-0">
                Pin Here
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* This data model pins a SKU to a single category, so there's only ever one tag here. */}
              <span className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-emerald-600/10 bg-emerald-600/5 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
                {category.title}
                <button
                  type="button"
                  onClick={() => {
                    bulkRemoveFromCategory([sku.id])
                    closeSkuDetail()
                  }}
                  aria-label={`Unpin from ${category.title}`}
                  className="text-emerald-800/60 hover:text-emerald-800"
                >
                  <X className="size-3" />
                </button>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">
              Dark Store Availability ({totalFilled}/{totalStores})
            </p>
            <div className="flex flex-col gap-4">
              {sku.darkStoreAvailability.map((channel) => (
                <div key={channel.name} className="flex items-center gap-2">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-black p-[3px]">
                    <img src={channelIcon} alt="" className="size-full" />
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <p className="w-[90px] shrink-0 text-sm leading-5 text-foreground">{channel.name}</p>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(2,6,23,0.2)]">
                      <div
                        className="h-full rounded-full bg-green-600"
                        style={{ width: `${(channel.filled / channel.total) * 100}%` }}
                      />
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs leading-4 font-semibold text-secondary-foreground">
                      {channel.filled}/{channel.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            size="icon"
            onClick={() => deleteSku(sku.id)}
            aria-label="Delete SKU"
            className="border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={closeSkuDetail}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
