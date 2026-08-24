import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Check, ChevronDown, Plus, Search, X } from "lucide-react"

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
import { channelNames, stockStatusOptions, type CategorySku, type StockStatus } from "@/lib/catalogue-data"
import { StatusCombobox } from "@/components/catalogue/status-combobox"
import { CategoryStatusTag } from "@/components/catalogue/category-status-tag"
import { useCatalogue } from "@/lib/catalogue-context"
import { darkStoreLocations } from "@/lib/dark-store-locations"

const selectTriggerClasses =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

interface BulkEditDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skuIds: string[]
}

/** Full "Edit Details" drawer for the selection bar — same field set as the single-SKU
 *  detail drawer. Text/number/status fields are blank ("No change") since the selection
 *  can span SKUs with different values and only what's filled in gets applied; category,
 *  platform, and dark-store picks are additive — they get pinned onto every selected SKU
 *  alongside whatever it already has, not replacing it. */
export function BulkEditDrawer({ open, onOpenChange, skuIds }: BulkEditDrawerProps) {
  const {
    categories,
    createCategory,
    bulkUpdateSkus,
    bulkAddCategoriesToSkus,
    bulkAddPlatformsToSkus,
    bulkAddStoresToSkus,
  } = useCatalogue()

  const [image, setImage] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [weightGrams, setWeightGrams] = useState("")
  const [stock, setStock] = useState<StockStatus | "">("")

  const [categoriesToAdd, setCategoriesToAdd] = useState<string[]>([])
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState("")
  const [pendingAddTitle, setPendingAddTitle] = useState<string | null>(null)

  const [platformsToAdd, setPlatformsToAdd] = useState<string[]>([])

  const [storesToAdd, setStoresToAdd] = useState<string[]>([])
  const [storePopoverOpen, setStorePopoverOpen] = useState(false)
  const [storeQuery, setStoreQuery] = useState("")
  const [showAllStoreChips, setShowAllStoreChips] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setImage(null)
    setName("")
    setDescription("")
    setMrp("")
    setPrice("")
    setWeightGrams("")
    setStock("")
    setCategoriesToAdd([])
    setCategoryQuery("")
    setPendingAddTitle(null)
    setPlatformsToAdd([])
    setStoresToAdd([])
    setStoreQuery("")
    setShowAllStoreChips(false)
  }, [open])

  // Once the just-created category shows up in context, add it to the pick list —
  // createCategory doesn't hand back an id, so match on the title we just submitted.
  useEffect(() => {
    if (!pendingAddTitle) return
    const created = categories.find((c) => c.title === pendingAddTitle)
    if (!created) return
    setCategoriesToAdd((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]))
    setPendingAddTitle(null)
  }, [categories, pendingAddTitle])

  const handleFile = (file: File | undefined) => {
    if (!file || !/^image\/(jpeg|png)$/.test(file.type)) return
    setImage(URL.createObjectURL(file))
  }

  const pickedCategories = categories.filter((c) => categoriesToAdd.includes(c.id))
  const pickedCategoryIdSet = new Set(categoriesToAdd)
  const toggleCategory = (categoryId: string) => {
    setCategoriesToAdd((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }
  const trimmedCategoryQuery = categoryQuery.trim()
  const filteredCategories = categories.filter((c) =>
    c.title.toLowerCase().includes(trimmedCategoryQuery.toLowerCase())
  )
  const exactCategoryMatch = categories.some((c) => c.title.toLowerCase() === trimmedCategoryQuery.toLowerCase())
  const createAndAdd = () => {
    if (!trimmedCategoryQuery) return
    setPendingAddTitle(trimmedCategoryQuery)
    createCategory({ title: trimmedCategoryQuery, description: "", status: "Active" })
    setCategoryQuery("")
    setCategoryPopoverOpen(false)
  }

  const platformSet = new Set(platformsToAdd)
  const togglePlatform = (platform: string) => {
    setPlatformsToAdd((prev) => (prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]))
  }

  const storeIdSet = new Set(storesToAdd)
  const pickedStores = darkStoreLocations.filter((store) => storeIdSet.has(store.id))
  const toggleStore = (storeId: string) => {
    setStoresToAdd((prev) => (prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]))
  }
  const trimmedStoreQuery = storeQuery.trim().toLowerCase()
  const filteredStores = darkStoreLocations.filter(
    (store) => store.name.toLowerCase().includes(trimmedStoreQuery) || store.city.toLowerCase().includes(trimmedStoreQuery)
  )
  const storeCitiesInOrder = [...new Set(filteredStores.map((s) => s.city))]

  const hasChanges =
    image !== null ||
    name !== "" ||
    description !== "" ||
    mrp !== "" ||
    price !== "" ||
    weightGrams !== "" ||
    stock !== "" ||
    categoriesToAdd.length > 0 ||
    platformsToAdd.length > 0 ||
    storesToAdd.length > 0

  const handleSave = () => {
    if (!hasChanges) return
    const patch: Partial<CategorySku> = {}
    if (image !== null) patch.image = image
    if (name.trim() !== "") patch.name = name.trim()
    if (description.trim() !== "") patch.description = description.trim()
    if (mrp !== "" && !Number.isNaN(Number(mrp))) patch.mrp = Number(mrp)
    if (price !== "" && !Number.isNaN(Number(price))) patch.price = Number(price)
    if (weightGrams !== "" && !Number.isNaN(Number(weightGrams))) patch.weightGrams = Number(weightGrams)
    if (stock !== "") patch.stock = stock
    if (Object.keys(patch).length > 0) bulkUpdateSkus(skuIds, patch)
    if (categoriesToAdd.length > 0) bulkAddCategoriesToSkus(skuIds, categoriesToAdd)
    if (platformsToAdd.length > 0) bulkAddPlatformsToSkus(skuIds, platformsToAdd)
    if (storesToAdd.length > 0) bulkAddStoresToSkus(skuIds, storesToAdd)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="justify-between">
          <SheetTitle>Edit Details</SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        <div className="flex shrink-0 items-start gap-2 border-b border-amber-600/20 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Editing will replace the existing data with the new details from Scratch. Please review the changes
            carefully before proceeding.
          </span>
        </div>

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
            className="mx-auto flex size-24 cursor-pointer flex-col items-center justify-center gap-2 self-center"
          >
            {image ? (
              <img src={image} alt="" className="size-24 rounded-lg border border-border object-cover" />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border hover:bg-muted/50">
                <Plus className="size-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="-mt-3 flex flex-col items-center gap-0.5 text-center">
            <p className="text-sm font-medium text-foreground">Upload Image</p>
            <p className="text-xs text-muted-foreground">JPEG/PNG (Max size: 2mb) — applied to all selected</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="No change" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Description</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="No change"
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
                    <span className={categoriesToAdd.length ? "" : "text-muted-foreground"}>
                      {categoriesToAdd.length > 0
                        ? `${categoriesToAdd.length} categor${categoriesToAdd.length === 1 ? "y" : "ies"}`
                        : "Select..."}
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
                        onClick={() => toggleCategory(c.id)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span
                          className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                            pickedCategoryIdSet.has(c.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          }`}
                        >
                          {pickedCategoryIdSet.has(c.id) && <Check className="size-3" />}
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
                    onClick={createAndAdd}
                    className="-mx-2 -mb-2 flex items-center gap-1.5 border-t border-border px-3.5 pt-2 pb-2 text-left text-sm font-medium text-primary hover:underline"
                  >
                    <Plus className="size-3.5" />
                    Create "{trimmedCategoryQuery}"
                  </button>
                )}
              </PopoverContent>
            </Popover>
            {pickedCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {pickedCategories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-emerald-600/10 bg-emerald-600/5 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    {c.title}
                    <button
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      aria-label={`Remove ${c.title}`}
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
              <span className="text-sm text-muted-foreground">Grammage (gram)</span>
              <Input
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                inputMode="numeric"
                placeholder="No change"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusCombobox
                value={stock}
                onChange={(next) => setStock(next as StockStatus)}
                options={stockStatusOptions(categories)}
                placeholder="No change"
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
                    <span className={platformsToAdd.length ? "" : "text-muted-foreground"}>
                      {platformsToAdd.length > 0
                        ? `${platformsToAdd.length} Platform${platformsToAdd.length === 1 ? "" : "s"}`
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
            {platformsToAdd.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {platformsToAdd.map((platform) => (
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
                    <span className={pickedStores.length ? "" : "text-muted-foreground"}>
                      {pickedStores.length > 0 ? `${pickedStores.length} Stores` : "Select..."}
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
                            const checked = storeIdSet.has(store.id)
                            return (
                              <button
                                key={store.id}
                                type="button"
                                onClick={() => toggleStore(store.id)}
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
            {pickedStores.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {(showAllStoreChips ? pickedStores : pickedStores.slice(0, 3)).map((store) => (
                  <span
                    key={store.id}
                    className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-emerald-600/10 bg-emerald-600/5 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    {store.name}
                    <button
                      type="button"
                      onClick={() => toggleStore(store.id)}
                      aria-label={`Remove ${store.name}`}
                      className="text-emerald-800/60 hover:text-emerald-800"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {pickedStores.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllStoreChips((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    {showAllStoreChips ? "Less" : `${pickedStores.length - 3} More`}
                    <ChevronDown className={`size-3 transition-transform ${showAllStoreChips ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <SheetFooter>
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              Done
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
