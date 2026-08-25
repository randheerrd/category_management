import { useEffect, useState } from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StatusCombobox } from "@/components/catalogue/status-combobox"
import type { CategoryStatus } from "@/lib/catalogue-data"
import { categoryStatusOptions } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

/** Centered "New category" form. */
export function AddCategoryDialog() {
  const { categories, addCategoryOpen, closeAddCategory, createCategory } = useCatalogue()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<CategoryStatus | "">("")

  useEffect(() => {
    if (!addCategoryOpen) return
    setTitle("")
    setDescription("")
    setStatus("")
  }, [addCategoryOpen])

  const canSubmit = title.trim().length > 0

  const handleDone = () => {
    if (!canSubmit) return
    createCategory({ title: title.trim(), description: description.trim(), status: status || "Planning" })
  }

  return (
    <Dialog open={addCategoryOpen} onOpenChange={(open) => !open && closeAddCategory()}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton>
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Name</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Category name" />
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

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Status</span>
            <StatusCombobox
              value={status}
              onChange={(next) => setStatus(next)}
              options={categoryStatusOptions(categories)}
              searchPlaceholder="Search or create status"
            />
          </label>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2">
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
