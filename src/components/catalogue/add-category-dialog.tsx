import { useEffect, useState } from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CategoryStatus } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

const statusOptions: CategoryStatus[] = ["Active", "Planning", "Discontinued"]

/** Centered "New category" form. */
export function AddCategoryDialog() {
  const { addCategoryOpen, closeAddCategory, createCategory } = useCatalogue()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<CategoryStatus>("Planning")

  useEffect(() => {
    if (!addCategoryOpen) return
    setTitle("")
    setDescription("")
    setStatus("Planning")
  }, [addCategoryOpen])

  const canSubmit = title.trim().length > 0

  const handleDone = () => {
    if (!canSubmit) return
    createCategory({ title: title.trim(), description: description.trim(), status })
  }

  return (
    <Dialog open={addCategoryOpen} onOpenChange={(open) => !open && closeAddCategory()}>
      <DialogContent className="sm:max-w-[420px]" showCloseButton>
        <DialogHeader className="-mx-4 -mt-4 border-b border-border px-4 pt-4 pb-3">
          <DialogTitle>New category</DialogTitle>
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
              <Input value="0" disabled />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CategoryStatus)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="-mx-4 -mb-4 flex items-center justify-end gap-2 rounded-b-xl border-t border-border bg-muted/50 p-4">
          <Button variant="outline" onClick={closeAddCategory}>
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
