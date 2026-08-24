import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Plus, Search, Trash2, Upload, X } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { StatusCombobox } from "@/components/catalogue/status-combobox"
import { CategoryStatusTag } from "@/components/catalogue/category-status-tag"
import {
  UNLISTED_CATEGORY_ID,
  channelNames,
  computeDarkStoreAvailability,
  stockStatusOptions,
  type StockStatus,
} from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"
import { darkStoreLocations } from "@/lib/dark-store-locations"
import { ConfirmDialog } from "@/components/catalogue/confirm-dialog"

/** Shared look for the two "select" triggers below — matches the old native <select>'s box. */
const selectTriggerClasses =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

/** Right-side drawer for viewing and editing a single SKU. */
export function SkuDetailDrawer() {
  const { categories, selectedSkuId, closeSkuDetail, saveSkuDetail, deleteSku, createCategory } = useCatalogue()

  const memberCategories = categories.filter((c) => c.skus.some((s) => s.id === selectedSkuId))
  const sku = memberCategories[0]?.skus.find((s) => s.id === selectedSkuId)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [weightGrams, setWeightGrams] = useState("")
  const [stock, setStock] = useState<StockStatus>("In Stock")
  // Everything below is edited locally and only applied to the catalogue on Save —
  // no field, checkbox, or chip here writes through to context on its own.
  const [platforms, setPlatforms] = useState<string[]>([])
  const [stockedStoreIds, setStockedStoreIds] = useState<string[]>([])
  const [pinnedCategoryIds, setPinnedCategoryIds] = useState<string[]>([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState("")
  const [pendingPinTitle, setPendingPinTitle] = useState<string | null>(null)
  const [storePopoverOpen, setStorePopoverOpen] = useState(false)
  const [storeQuery, setStoreQuery] = useState("")
  const [showAllStoreChips, setShowAllStoreChips] = useState(false)

  useEffect(() => {
    if (!sku) return
    setName(sku.name)
    setDescription(sku.description)
    setImage(sku.image)
    setMrp(String(sku.mrp))
    setPrice(String(sku.price))
    setWeightGrams(String(sku.weightGrams))
    setStock(sku.stock)
    setPlatforms(sku.platforms)
    setStockedStoreIds(sku.stockedStoreIds)
    setPinnedCategoryIds(memberCategories.map((c) => c.id))
    // Re-sync only when the drawer opens on a (possibly different) SKU — not on every
    // categories update, or an in-progress edit would get clobbered by its own save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSkuId])

  const handleFile = (file: File | undefined) => {
    if (!file || !/^image\/(jpeg|png)$/.test(file.type)) return
    setImage(URL.createObjectURL(file))
  }

  // Once the just-created category shows up in context, pin it locally (still pending
  // until Save) — createCategory doesn't hand back an id, so match on the submitted title.
  useEffect(() => {
    if (!pendingPinTitle) return
    const created = categories.find((c) => c.title === pendingPinTitle)
    if (!created) return
    setPinnedCategoryIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]))
    setPendingPinTitle(null)
  }, [categories, pendingPinTitle])

  if (memberCategories.length === 0 || !sku) return null

  const stockedStoreIdSet = new Set(stockedStoreIds)
  const stockedLocations = darkStoreLocations.filter((store) => stockedStoreIdSet.has(store.id))

  const toggleStockedStore = (storeId: string) => {
    setStockedStoreIds((prev) => (stockedStoreIdSet.has(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]))
  }

  const trimmedStoreQuery = storeQuery.trim().toLowerCase()
  const filteredStores = darkStoreLocations.filter(
    (store) => store.name.toLowerCase().includes(trimmedStoreQuery) || store.city.toLowerCase().includes(trimmedStoreQuery)
  )
  const storeCitiesInOrder = [...new Set(filteredStores.map((s) => s.city))]

  const platformSet = new Set(platforms)
  const togglePlatform = (platform: string) => {
    setPlatforms((prev) => (platformSet.has(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]))
  }

  const pinnedCategoryIdSet = new Set(pinnedCategoryIds)
  const pinnedCategories = categories.filter((c) => pinnedCategoryIdSet.has(c.id))
  const togglePin = (categoryId: string, pinned: boolean) => {
    setPinnedCategoryIds((prev) => (pinned ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]))
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
    saveSkuDetail(
      sku.id,
      {
        name: name.trim() || sku.name,
        description: description.trim(),
        image: image ?? sku.image,
        mrp: Number(mrp) || sku.mrp,
        price: Number(price) || sku.price,
        weightGrams: Number(weightGrams) || sku.weightGrams,
        stock,
        platforms,
        stockedStoreIds,
        darkStoreAvailability: computeDarkStoreAvailability(stockedStoreIds),
        stores: stockedStoreIds.length,
        darkStores: `${stockedStoreIds.length}/${darkStoreLocations.length}`,
      },
      pinnedCategoryIds
    )
    closeSkuDetail()
  }

  return (
    <Sheet open={Boolean(selectedSkuId)} onOpenChange={(open) => !open && closeSkuDetail()}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="justify-between">
          <SheetTitle>{name || sku.name}</SheetTitle>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group/image relative mx-auto size-[60px] shrink-0 cursor-pointer self-center"
          >
            <img
              src={image ?? sku.image}
              alt=""
              className="size-[60px] rounded-[4px] border border-border object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[4px] bg-black/40 opacity-0 transition-opacity group-hover/image:opacity-100">
              <span className="flex size-6 items-center justify-center rounded-full bg-[rgba(241,245,249,0.8)]">
                <Upload className="size-4 text-slate-950/50" />
              </span>
            </div>
          </div>
          <div className="-mt-3 flex flex-col items-center gap-0.5 text-center">
            <p className="text-sm font-medium text-foreground">Upload Image</p>
            <p className="text-xs text-muted-foreground">JPEG/PNG (Max size: 2mb)</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Description</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              rows={3}
            />
          </label>

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
                    <span className={pinnedCategories.length ? "" : "text-muted-foreground"}>
                      {pinnedCategories.length > 0
                        ? `${pinnedCategories.length} categor${pinnedCategories.length === 1 ? "y" : "ies"}`
                        : "Category"}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                }
              />
              <PopoverContent align="start" className="w-(--anchor-width) max-w-[calc(100vw-3rem)] p-2">
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
                        onClick={() => togglePin(c.id, pinnedCategoryIdSet.has(c.id))}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span
                          className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                            pinnedCategoryIdSet.has(c.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          }`}
                        >
                          {pinnedCategoryIdSet.has(c.id) && <Check className="size-3" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-foreground">{c.title}</span>
                        <CategoryStatusTag status={c.status} />
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
              {pinnedCategories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-emerald-600/10 bg-emerald-600/5 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
                >
                  {c.title}
                  {c.id !== UNLISTED_CATEGORY_ID && (
                    <button
                      type="button"
                      onClick={() => togglePin(c.id, true)}
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
              <StatusCombobox
                value={stock}
                onChange={(next) => setStock(next as StockStatus)}
                options={stockStatusOptions(categories)}
                searchPlaceholder="Search or create status"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Platform</p>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button type="button" className={selectTriggerClasses}>
                    <span className={platforms.length ? "" : "text-muted-foreground"}>
                      {platforms.length > 0
                        ? `${platforms.length} Platform${platforms.length === 1 ? "" : "s"}`
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
            {platforms.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {platforms.map((platform) => (
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
              <PopoverContent align="start" className="w-(--anchor-width) max-w-[calc(100vw-3rem)] p-2">
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
                {stockedLocations.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllStoreChips((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    {showAllStoreChips ? "Less" : `${stockedLocations.length - 3} More`}
                    <ChevronDown className={`size-3 transition-transform ${showAllStoreChips ? "rotate-180" : ""}`} />
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
