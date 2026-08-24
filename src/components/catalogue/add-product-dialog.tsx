import { useEffect, useRef, useState, type DragEvent } from "react"
import { Upload, X } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { StockStatus } from "@/lib/catalogue-data"
import { channelNames } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

const stockOptions: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]
const platformOptions = channelNames

interface AddProductDialogProps {
  /** Called once a product is actually created (not on Cancel) — e.g. to leave onboarding for the board. */
  onCreated?: () => void
}

/** Centered "Add a product" form — creates a SKU and pins it into one or more categories. */
export function AddProductDialog({ onCreated }: AddProductDialogProps = {}) {
  const { categories, addProductOpen, addProductCategoryId, closeAddProduct, createProduct } = useCatalogue()

  const [name, setName] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [weightGrams, setWeightGrams] = useState("")
  const [stock, setStock] = useState<StockStatus>("In Stock")
  const [platform, setPlatform] = useState("")
  const [pinTarget, setPinTarget] = useState("")
  const [pinnedCategoryIds, setPinnedCategoryIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!addProductOpen) return
    setName("")
    setImage(null)
    setMrp("")
    setPrice("")
    setWeightGrams("")
    setStock("In Stock")
    setPlatform("")
    setPinTarget("")
    setPinnedCategoryIds(addProductCategoryId ? [addProductCategoryId] : [])
  }, [addProductOpen, addProductCategoryId])

  const pinnedCategories = categories.filter((c) => pinnedCategoryIds.includes(c.id))
  const availableCategories = categories.filter((c) => !pinnedCategoryIds.includes(c.id))

  const handleFile = (file: File | undefined) => {
    if (!file || !/^image\/(jpeg|png)$/.test(file.type)) return
    setImage(URL.createObjectURL(file))
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const handlePinHere = () => {
    if (!pinTarget) return
    setPinnedCategoryIds((prev) => [...prev, pinTarget])
    setPinTarget("")
  }

  const canSubmit = name.trim().length > 0 && pinnedCategoryIds.length > 0

  const handleDone = () => {
    if (!canSubmit) return
    createProduct(
      {
        name: name.trim(),
        image: image ?? undefined,
        mrp: Number(mrp) || 0,
        price: Number(price) || 0,
        weightGrams: Number(weightGrams) || 0,
        stock,
        platform: platform || platformOptions[0],
      },
      pinnedCategoryIds
    )
    onCreated?.()
  }

  return (
    <Dialog open={addProductOpen} onOpenChange={(open) => !open && closeAddProduct()}>
      <DialogContent className="sm:max-w-[420px]" showCloseButton>
        <DialogHeader className="border-b border-border pb-3 -mx-4 -mt-4 px-4 pt-4">
          <DialogTitle>Add a product</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
          </label>

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
            className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-center hover:bg-muted/50"
          >
            {image ? (
              <img src={image} alt="" className="h-24 w-full rounded-md object-cover" />
            ) : (
              <>
                <Upload className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Click to upload/drag your file here</p>
                <p className="text-xs text-muted-foreground">JPEG/PNG supported</p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Pin to Category</p>
            <div className="flex items-center gap-2">
              <select
                value={pinTarget}
                onChange={(e) => setPinTarget(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Category</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={handlePinHere} disabled={!pinTarget} className="shrink-0">
                Pin Here
              </Button>
            </div>
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
                      onClick={() => setPinnedCategoryIds((prev) => prev.filter((id) => id !== c.id))}
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

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Platform</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select...</option>
              {platformOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="-mx-4 -mb-4 flex items-center justify-end gap-2 rounded-b-xl border-t border-border bg-muted/50 p-4">
          <Button variant="outline" onClick={closeAddProduct}>
            Cancel
          </Button>
          <Button onClick={handleDone} disabled={!canSubmit}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
