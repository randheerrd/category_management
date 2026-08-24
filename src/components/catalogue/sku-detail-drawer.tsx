import { useEffect, useState } from "react"
import { ChevronDown, Trash2, X } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UNLISTED_CATEGORY_ID, type StockStatus } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"
import { channelLogos } from "@/lib/channel-logos"
import { ConfirmDialog } from "@/components/catalogue/confirm-dialog"

/** Shared look for the two "select" triggers below — matches the old native <select>'s box. */
const selectTriggerClasses =
  "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const stockOptions: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]

/** Right-side drawer for viewing and editing a single SKU. */
export function SkuDetailDrawer() {
  const {
    categories,
    selectedSkuId,
    closeSkuDetail,
    updateSku,
    deleteSku,
    pinSkuToCategory,
    unpinSkuFromCategory,
  } = useCatalogue()

  const memberCategories = categories.filter((c) => c.skus.some((s) => s.id === selectedSkuId))
  const sku = memberCategories[0]?.skus.find((s) => s.id === selectedSkuId)

  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [weightGrams, setWeightGrams] = useState("")
  const [stock, setStock] = useState<StockStatus>("In Stock")
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (!sku) return
    setMrp(String(sku.mrp))
    setPrice(String(sku.price))
    setWeightGrams(String(sku.weightGrams))
    setStock(sku.stock)
  }, [sku])

  if (memberCategories.length === 0 || !sku) return null

  const totalFilled = sku.darkStoreAvailability.reduce((sum, c) => sum + c.filled, 0)
  const totalStores = sku.darkStoreAvailability.reduce((sum, c) => sum + c.total, 0)

  const memberCategoryIds = new Set(memberCategories.map((c) => c.id))
  const togglePin = (categoryId: string, pinned: boolean) => {
    if (pinned) unpinSkuFromCategory(sku.id, categoryId)
    else pinSkuToCategory(sku.id, categoryId)
  }

  const handleSave = () => {
    updateSku(sku.id, {
      mrp: Number(mrp) || sku.mrp,
      price: Number(price) || sku.price,
      weightGrams: Number(weightGrams) || sku.weightGrams,
      stock,
    })
    closeSkuDetail()
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
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button type="button" className={selectTriggerClasses}>
                      <span>{stock}</span>
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

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Pinned in</p>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button type="button" className={selectTriggerClasses}>
                    <span className={memberCategories.length ? "" : "text-muted-foreground"}>
                      {memberCategories.length > 0
                        ? `${memberCategories.length} categor${memberCategories.length === 1 ? "y" : "ies"}`
                        : "Category"}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                }
              />
              <DropdownMenuContent align="start">
                {categories.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={memberCategoryIds.has(c.id)}
                    onCheckedChange={() => togglePin(c.id, memberCategoryIds.has(c.id))}
                    // Unchecking a SKU's only remaining category isn't a delete — it falls
                    // back to Unlisted — so nothing here needs to be un-selectable.
                    onSelect={(e) => e.preventDefault()}
                  >
                    {c.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex flex-wrap items-center gap-2">
              {memberCategories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-emerald-600/10 bg-emerald-600/5 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
                >
                  {c.title}
                  {c.id !== UNLISTED_CATEGORY_ID && (
                    <button
                      type="button"
                      onClick={() => unpinSkuFromCategory(sku.id, c.id)}
                      aria-label={`Unpin from ${c.title}`}
                      className="text-emerald-800/60 hover:text-emerald-800"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">
              Dark Store Availability ({totalFilled}/{totalStores})
            </p>
            <div className="flex flex-col gap-4">
              {sku.darkStoreAvailability.map((channel) => (
                <div key={channel.name} className="flex items-center gap-2">
                  <img
                    src={channelLogos[channel.name]}
                    alt=""
                    className="size-5 shrink-0 rounded-sm object-cover"
                  />
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
            onClick={() => setConfirmDeleteOpen(true)}
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

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={`Delete "${sku.name}"?`}
        description="This can't be undone."
        confirmLabel="Delete SKU"
        onConfirm={() => {
          deleteSku(sku.id)
          closeSkuDetail()
        }}
      />
    </Sheet>
  )
}
