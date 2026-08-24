import { useEffect, useState } from "react"
import { ChevronDown, Trash2 } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CategoryStatus } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

const statusOptions: CategoryStatus[] = ["Active", "Planning", "Discontinued"]

/** Edit-or-delete drawer for an existing category, opened from clicking a category card's header. */
export function ManageCategoryDialog() {
  const { categories, manageCategoryId, closeManageCategory, updateCategory, deleteCategory } = useCatalogue()
  const category = categories.find((c) => c.id === manageCategoryId)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<CategoryStatus>("Active")

  useEffect(() => {
    if (!category) return
    setTitle(category.title)
    setDescription(category.description)
    setStatus(category.status)
  }, [category])

  if (!category) return null

  const canSubmit = title.trim().length > 0

  const handleSave = () => {
    if (!canSubmit) return
    updateCategory(category.id, { title: title.trim(), description: description.trim(), status })
  }

  return (
    <Dialog open={Boolean(manageCategoryId)} onOpenChange={(open) => !open && closeManageCategory()}>
      <DialogContent className="sm:max-w-[420px]" showCloseButton>
        <DialogHeader className="-mx-4 -mt-4 border-b border-border px-4 pt-4 pb-3">
          <DialogTitle>Manage category</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Name</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Category name" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Description</span>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">SKU Count</span>
              <Input value={String(category.skus.length)} disabled />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Status</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span>{status}</span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  }
                />
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup value={status} onValueChange={(value) => setStatus(value as CategoryStatus)}>
                    {statusOptions.map((option) => (
                      <DropdownMenuRadioItem key={option} value={option}>
                        {option}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </label>
          </div>

          <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
            Deleting a category never deletes its SKUs — they fall back to Unsorted.
          </p>
        </div>

        <div className="-mx-4 -mb-4 flex items-center justify-between gap-2 border-t border-border p-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => deleteCategory(category.id)}
            aria-label="Delete category"
            className="border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={closeManageCategory}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSubmit}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
