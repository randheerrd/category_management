import { useEffect, useState } from "react"
import { ChevronDown, X } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCatalogue } from "@/lib/catalogue-context"

const selectTriggerClasses =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

interface MoveToDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skuIds: string[]
}

/** Bulk "Move to" dialog for the selection bar — pick one or more destination
 *  categories, review them as removable chips, then commit with Done. */
export function MoveToDialog({ open, onOpenChange, skuIds }: MoveToDialogProps) {
  const { categories, bulkMoveToCategories } = useCatalogue()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) setSelectedIds([])
  }, [open])

  const selectedCategories = categories.filter((c) => selectedIds.includes(c.id))

  const toggleCategory = (categoryId: string) => {
    setSelectedIds((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]))
  }

  const handleDone = () => {
    if (selectedIds.length === 0) return
    bulkMoveToCategories(skuIds, selectedIds)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[8px] sm:max-w-[420px]" showCloseButton>
        <DialogHeader>
          <DialogTitle>Move to</DialogTitle>
          <DialogDescription>
            Choose one or more categories to move {skuIds.length} SKU{skuIds.length === 1 ? "" : "s"} into.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Category</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button type="button" className={selectTriggerClasses}>
                    <span className={selectedIds.length ? "" : "text-muted-foreground"}>Select...</span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="max-h-64">
                {categories.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={selectedIds.includes(c.id)}
                    onCheckedChange={() => toggleCategory(c.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {c.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </label>

          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedCategories.map((c) => (
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

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDone} disabled={selectedIds.length === 0}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
