import { useEffect, useRef, useState, type DragEvent } from "react"
import { Check, ChevronDown, Plus, Search, Upload, X } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { StockStatus } from "@/lib/catalogue-data"
import { channelNames } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"
import { darkStoreLocations } from "@/lib/dark-store-locations"

const stockOptions: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]

const selectTriggerClasses =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

interface AddProductDialogProps {
  /** Called once a product is actually created (not on Cancel) — e.g. to leave onboarding for the board. */
  onCreated?: () => void
}

/** Right-side "New Product" drawer — creates a SKU and pins it into one or more categories. */
export function AddProductDialog({ onCreated }: AddProductDialogProps = {}) {
  const { categories, addProductOpen, addProductCategoryId, closeAddProduct, createProduct, createCategory } =
    useCatalogue()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [weightGrams, setWeightGrams] = useState("")
  const [stock, setStock] = useState<StockStatus>("In Stock")
  const [pinnedCategoryIds, setPinnedCategoryIds] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [stockedStoreIds, setStockedStoreIds] = useState<string[]>([])

  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState("")
  const [pendingPinTitle, setPendingPinTitle] = useState<string | null>(null)
  const [storePopoverOpen, setStorePopoverOpen] = useState(false)
  const [storeQuery, setStoreQuery] = useState("")
  const [showAllStoreChips, setShowAllStoreChips] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!addProductOpen) return
    setName("")
    setDescription("")
    setImage(null)
    setMrp("")
    setPrice("")
    setWeightGrams("")
    setStock("In Stock")
    setPinnedCategoryIds(addProductCategoryId ? [addProductCategoryId] : [])
    setPlatforms([])
    setStockedStoreIds([])
    setCategoryQuery("")
    setStoreQuery("")
    setShowAllStoreChips(false)
  }, [addProductOpen, addProductCategoryId])

  // Once the just-created category shows up in context, pin it in — createCategory
  // doesn't hand back an id, so match on the title we just submitted.
  useEffect(() => {
    if (!pendingPinTitle) return
    const created = categories.find((c) => c.title === pendingPinTitle)
    if (!created) return
    setPinnedCategoryIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]))
    setPendingPinTitle(null)
  }, [categories, pendingPinTitle])

  const pinnedCategories = categories.filter((c) => pinnedCategoryIds.includes(c.id))
  const pinnedCategoryIdSet = new Set(pinnedCategoryIds)
  const togglePin = (categoryId: string) => {
    setPinnedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
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

  const platformSet = new Set(platforms)
  const togglePlatform = (platform: string) => {
    if (platformSet.has(platform)) {
      setPlatforms((prev) => prev.filter((p) => p !== platform))
      // Dropping a platform drops any store picks that only made sense under it.
      setStockedStoreIds((prev) =>
        prev.filter((id) => darkStoreLocations.find((s) => s.id === id)?.channel !== platform)
      )
    } else {
      setPlatforms((prev) => [...prev, platform])
    }
  }

  // Dark Stores only makes sense once at least one platform is picked — a store belongs
  // to exactly one channel, so the option list is scoped to the chosen platforms too.
  const availableStores = darkStoreLocations.filter((store) => platformSet.has(store.channel))
  const stockedStoreIdSet = new Set(stockedStoreIds)
  const stockedLocations = availableStores.filter((store) => stockedStoreIdSet.has(store.id))
  const toggleStockedStore = (storeId: string) => {
    setStockedStoreIds((prev) => (prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]))
  }
  const trimmedStoreQuery = storeQuery.trim().toLowerCase()
  const filteredStores = availableStores.filter(
    (store) => store.name.toLowerCase().includes(trimmedStoreQuery) || store.city.toLowerCase().includes(trimmedStoreQuery)
  )
  const storeCitiesInOrder = [...new Set(filteredStores.map((s) => s.city))]

  const handleFile = (file: File | undefined) => {
    if (!file || !/^image\/(jpeg|png)$/.test(file.type)) return
    setImage(URL.createObjectURL(file))
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const canSubmit = name.trim().length > 0 && pinnedCategoryIds.length > 0

  const handleDone = () => {
    if (!canSubmit) return
    createProduct(
      {
        name: name.trim(),
        image: image ?? undefined,
        description: description.trim(),
        mrp: Number(mrp) || 0,
        price: Number(price) || 0,
        weightGrams: Number(weightGrams) || 0,
        stock,
        platforms,
        stockedStoreIds,
      },
      pinnedCategoryIds
    )
    onCreated?.()
  }

  return (
    <Sheet open={addProductOpen} onOpenChange={(open) => !open && closeAddProduct()}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="justify-between">
          <SheetTitle>New Product</SheetTitle>
          <button
            type="button"
            onClick={closeAddProduct}
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
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="mx-auto flex size-24 cursor-pointer flex-col items-center justify-center gap-2 self-center"
          >
            {image ? (
              <img src={image} alt="" className="size-24 rounded-lg border border-border object-cover" />
            ) : (
              <>
                <div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border hover:bg-muted/50">
                  <Upload className="size-4 text-muted-foreground" />
                </div>
              </>
            )}
          </div>
          {!image && (
            <div className="-mt-3 flex flex-col items-center gap-0.5 text-center">
              <p className="text-sm font-medium text-foreground">Upload Image</p>
              <p className="text-xs text-muted-foreground">JPEG/PNG (Max size: 2mb)</p>
            </div>
          )}

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
                    <span className={pinnedCategoryIds.length ? "" : "text-muted-foreground"}>
                      {pinnedCategoryIds.length > 0
                        ? `${pinnedCategoryIds.length} categor${pinnedCategoryIds.length === 1 ? "y" : "ies"}`
                        : "Select..."}
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
                        onClick={() => togglePin(c.id)}
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
            {pinnedCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {pinnedCategories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-emerald-600/10 bg-emerald-600/5 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    {c.title}
                    <button
                      type="button"
                      onClick={() => togglePin(c.id)}
                      aria-label={`Unpin from ${c.title}`}
                      className="text-emerald-800/60 hover:text-emerald-800"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
              <span className="text-sm text-muted-foreground">Grammage (gram)</span>
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
                    <span className={platforms.length ? "" : "text-muted-foreground"}>
                      {platforms.length > 0 ? `${platforms.length} Platform${platforms.length === 1 ? "" : "s"}` : "Select..."}
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

          {/* Only appears once a platform is picked — a store belongs to exactly one
              channel, so there's nothing valid to offer here before that. */}
          {platforms.length > 0 && (
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
          )}
        </div>

        <SheetFooter>
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={closeAddProduct}>
              Cancel
            </Button>
            <Button onClick={handleDone} disabled={!canSubmit}>
              Done
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
