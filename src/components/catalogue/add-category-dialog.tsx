import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

const selectTriggerClasses =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

/** Centered "New category" form. */
export function AddCategoryDialog() {
  const { addCategoryOpen, closeAddCategory, createCategory } = useCatalogue()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<CategoryStatus | "">("")
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  useEffect(() => {
    if (!addCategoryOpen) return
    setTitle("")
    setDescription("")
    setStatus("")
    setStatusMenuOpen(false)
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

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">SKU Count</span>
              <Input value="0" disabled />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Status</span>
              <DropdownMenu open={statusMenuOpen} onOpenChange={setStatusMenuOpen}>
                <DropdownMenuTrigger
                  render={
                    <button type="button" className={selectTriggerClasses}>
                      <span className={status ? "" : "text-muted-foreground"}>{status || "Select..."}</span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  }
                />
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup
                    value={status}
                    onValueChange={(value) => {
                      setStatus(value as CategoryStatus)
                      setStatusMenuOpen(false)
                    }}
                  >
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
