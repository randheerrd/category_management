import { useEffect, useState } from "react"
import { Check, ChevronDown, Plus, Search, Trash2, X } from "lucide-react"

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UNLISTED_CATEGORY_ID, channelNames, computeDarkStoreAvailability, type StockStatus } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"
import { darkStoreLocations } from "@/lib/dark-store-locations"
import { ConfirmDialog } from "@/components/catalogue/confirm-dialog"

/** Shared look for the two "select" triggers below — matches the old native <select>'s box. */
const selectTriggerClasses =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

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
    createCategory,
  } = useCatalogue()

  const memberCategories = categories.filter((c) => c.skus.some((s) => s.id === selectedSkuId))
  const sku = memberCategories[0]?.skus.find((s) => s.id === selectedSkuId)

  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [weightGrams, setWeightGrams] = useState("")
  const [stock, setStock] = useState<StockStatus>("In Stock")
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState("")
  const [pendingPinTitle, setPendingPinTitle] = useState<string | null>(null)
  const [storePopoverOpen, setStorePopoverOpen] = useState(false)
  const [storeQuery, setStoreQuery] = useState("")
  const [showAllStoreChips, setShowAllStoreChips] = useState(false)

  useEffect(() => {
    if (!sku) return
    setMrp(String(sku.mrp))
    setPrice(String(sku.price))
    setWeightGrams(String(sku.weightGrams))
    setStock(sku.stock)
  }, [sku])

  // Once the just-created category shows up in context, pin the SKU into it —
  // createCategory doesn't hand back an id, so match on the title we just submitted.
  useEffect(() => {
    if (!pendingPinTitle || !sku) return
    const created = categories.find((c) => c.title === pendingPinTitle)
    if (!created) return
    pinSkuToCategory(sku.id, created.id)
    setPendingPinTitle(null)
  }, [categories, pendingPinTitle, sku, pinSkuToCategory])

  if (memberCategories.length === 0 || !sku) return null

  const stockedStoreIdSet = new Set(sku.stockedStoreIds)
  const stockedLocations = darkStoreLocations.filter((store) => stockedStoreIdSet.has(store.id))

  const toggleStockedStore = (storeId: string) => {
    const nextIds = stockedStoreIdSet.has(storeId)
      ? sku.stockedStoreIds.filter((id) => id !== storeId)
      : [...sku.stockedStoreIds, storeId]
    updateSku(sku.id, {
      stockedStoreIds: nextIds,
      darkStoreAvailability: computeDarkStoreAvailability(nextIds),
      stores: nextIds.length,
      darkStores: `${nextIds.length}/${darkStoreLocations.length}`,
    })
  }

  const trimmedStoreQuery = storeQuery.trim().toLowerCase()
  const filteredStores = darkStoreLocations.filter(
    (store) => store.name.toLowerCase().includes(trimmedStoreQuery) || store.city.toLowerCase().includes(trimmedStoreQuery)
  )
  const storeCitiesInOrder = [...new Set(filteredStores.map((s) => s.city))]

  const platformSet = new Set(sku.platforms)
  const togglePlatform = (platform: string) => {
    const next = platformSet.has(platform)
      ? sku.platforms.filter((p) => p !== platform)
      : [...sku.platforms, platform]
    updateSku(sku.id, { platforms: next })
  }

  const memberCategoryIds = new Set(memberCategories.map((c) => c.id))
  const togglePin = (categoryId: string, pinned: boolean) => {
    if (pinned) unpinSkuFromCategory(sku.id, categoryId)
    else pinSkuToCategory(sku.id, categoryId)
  }

  const trimmedCategoryQuery = categoryQuery.trim()
  const filteredCategories = categories.filter((c) =>
    c.title.toLowerCase().includes(trimmedCategoryQuery.toLowerCase())
  )
  const exactCategoryMatch = categories.some((c) => c.title.toLowerCase() === trimmedCategoryQuery.toLowerCase())

  const createAndPin = () => {
    if (!trimmedCategoryQuery) return
    setPendingPinTitle(trimmedCategoryQuery)
    createCategory({ title: trimmedCategoryQuery, description: "", status: "Active" })
    setCategoryQuery("")
    setCategoryPopoverOpen(false)
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

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Pin to category</p>
            <Popover
              open={categoryPopoverOpen}
              onOpenChange={(next) => {
                setCategoryPopoverOpen(next)
                if (!next) setCategoryQuery("")
              }}
            >
              <PopoverTrigger
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
              <PopoverContent align="start" className="w-[352px] max-w-[calc(100vw-3rem)] p-2">
                <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5">
                  <Search className="size-3.5 shrink-0 text-muted-foreground" />
                  <input
                    autoFocus
                    value={categoryQuery}
                    onChange={(e) => setCategoryQuery(e.target.value)}
                    placeholder="Search category"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                <div className="flex max-h-52 flex-col overflow-y-auto">
                  {filteredCategories.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">No categories match.</p>
                  ) : (
                    filteredCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        // Unchecking a SKU's only remaining category isn't a delete — it falls
                        // back to Unlisted — so nothing here needs to be un-selectable.
                        onClick={() => togglePin(c.id, memberCategoryIds.has(c.id))}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span
                          className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                            memberCategoryIds.has(c.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          }`}
                        >
                          {memberCategoryIds.has(c.id) && <Check className="size-3" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-foreground">{c.title}</span>
                      </button>
                    ))
                  )}
                </div>

                {trimmedCategoryQuery && !exactCategoryMatch && (
                  <button
                    type="button"
                    onClick={createAndPin}
                    className="-mx-2 -mb-2 flex items-center gap-1.5 border-t border-border px-3.5 pt-2 pb-2 text-left text-sm font-medium text-primary hover:underline"
                  >
                    <Plus className="size-3.5" />
                    Create "{trimmedCategoryQuery}"
                  </button>
                )}
              </PopoverContent>
            </Popover>
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
            <p className="text-sm text-muted-foreground">Platform</p>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button type="button" className={selectTriggerClasses}>
                    <span className={sku.platforms.length ? "" : "text-muted-foreground"}>
                      {sku.platforms.length > 0
                        ? `${sku.platforms.length} Platform${sku.platforms.length === 1 ? "" : "s"}`
                        : "Select..."}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                }
              />
              <DropdownMenuContent align="start">
                {channelNames.map((platform) => (
                  <DropdownMenuCheckboxItem
                    key={platform}
                    checked={platformSet.has(platform)}
                    onCheckedChange={() => togglePlatform(platform)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {platform}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {sku.platforms.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {sku.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-emerald-600/10 bg-emerald-600/5 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    {platform}
                    <button
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      aria-label={`Remove ${platform}`}
                      className="text-emerald-800/60 hover:text-emerald-800"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Dark Stores</p>
            <Popover
              open={storePopoverOpen}
              onOpenChange={(next) => {
                setStorePopoverOpen(next)
                if (!next) setStoreQuery("")
              }}
            >
              <PopoverTrigger
                render={
                  <button type="button" className={selectTriggerClasses}>
                    <span className={stockedLocations.length ? "" : "text-muted-foreground"}>
                      {stockedLocations.length > 0 ? `${stockedLocations.length} Stores` : "Select..."}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                }
              />
              <PopoverContent align="start" className="w-[352px] max-w-[calc(100vw-3rem)] p-2">
                <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5">
                  <Search className="size-3.5 shrink-0 text-muted-foreground" />
                  <input
                    autoFocus
                    value={storeQuery}
                    onChange={(e) => setStoreQuery(e.target.value)}
                    placeholder="Search city or store"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                <div className="flex max-h-72 flex-col overflow-y-auto">
                  {storeCitiesInOrder.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">No stores match.</p>
                  ) : (
                    storeCitiesInOrder.map((city) => (
                      <div key={city} className="flex flex-col">
                        <p className="px-2 pt-2 pb-1 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                          {city}
                        </p>
                        {filteredStores
                          .filter((store) => store.city === city)
                          .map((store) => {
                            const checked = stockedStoreIdSet.has(store.id)
                            return (
                              <button
                                key={store.id}
                                type="button"
                                onClick={() => toggleStockedStore(store.id)}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                              >
                                <span
                                  className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                                    checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                                  }`}
                                >
                                  {checked && <Check className="size-3" />}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-foreground">{store.name}</span>
                              </button>
                            )
                          })}
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {stockedLocations.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {(showAllStoreChips ? stockedLocations : stockedLocations.slice(0, 3)).map((store) => (
                  <span
                    key={store.id}
                    className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-emerald-600/10 bg-emerald-600/5 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    {store.name}
                    <button
                      type="button"
                      onClick={() => toggleStockedStore(store.id)}
                      aria-label={`Remove ${store.name}`}
                      className="text-emerald-800/60 hover:text-emerald-800"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {!showAllStoreChips && stockedLocations.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllStoreChips(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    {stockedLocations.length - 3} More
                    <ChevronDown className="size-3" />
                  </button>
                )}
              </div>
            )}
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
