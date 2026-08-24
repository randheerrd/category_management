import { useEffect, useState } from "react"
import { ChevronDown, X } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CategorySku, StockStatus } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

const selectTriggerClasses =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const stockOptions: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]

interface BulkEditDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skuIds: string[]
}

/** Bulk "Edit Detail" drawer for the selection bar — same field layout as the single-SKU
 *  detail drawer, but blank instead of pre-filled with any one SKU's values (the selection
 *  can span SKUs with different prices/grammage). Only the fields the user actually
 *  fills in get applied to every selected SKU; the rest are left untouched per SKU. */
export function BulkEditDrawer({ open, onOpenChange, skuIds }: BulkEditDrawerProps) {
  const { bulkUpdateSkus } = useCatalogue()

  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [weightGrams, setWeightGrams] = useState("")
  const [stock, setStock] = useState<StockStatus | "">("")

  useEffect(() => {
    if (!open) return
    setMrp("")
    setPrice("")
    setWeightGrams("")
    setStock("")
  }, [open])

  const hasChanges = mrp !== "" || price !== "" || weightGrams !== "" || stock !== ""

  const handleSave = () => {
    if (!hasChanges) return
    const patch: Partial<CategorySku> = {}
    if (mrp !== "" && !Number.isNaN(Number(mrp))) patch.mrp = Number(mrp)
    if (price !== "" && !Number.isNaN(Number(price))) patch.price = Number(price)
    if (weightGrams !== "" && !Number.isNaN(Number(weightGrams))) patch.weightGrams = Number(weightGrams)
    if (stock !== "") patch.stock = stock
    bulkUpdateSkus(skuIds, patch)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="justify-between">
          <SheetTitle>
            Edit {skuIds.length} SKU{skuIds.length === 1 ? "" : "s"}
          </SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground">
            Only fields you fill in are applied — everything left blank stays as-is on each SKU.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">MRP (₹)</span>
              <Input value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" placeholder="No change" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Selling Price (₹)</span>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="No change"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Grammage</span>
              <Input
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                inputMode="numeric"
                placeholder="No change"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Status</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button type="button" className={selectTriggerClasses}>
                      <span className={stock ? "" : "text-muted-foreground"}>{stock || "No change"}</span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  }
                />
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup value={stock} onValueChange={(value) => setStock(value as StockStatus)}>
                    {stockOptions.map((option) => (
                      <DropdownMenuRadioItem key={option} value={option}>
                        {option}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </label>
          </div>
        </div>

        <SheetFooter>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
