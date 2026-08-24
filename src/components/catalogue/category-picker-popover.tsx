import { useEffect, useState, type ReactElement } from "react"
import { Plus, Search } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCatalogue } from "@/lib/catalogue-context"
import { categoryDotClass } from "@/lib/category-colors"

interface CategoryPickerPopoverProps {
  trigger: ReactElement
  skuIds: string[]
}

/**
 * Shared "pick a category" popover for the bulk selection bar's "Move to" and
 * "Add to Category" buttons — search the existing list, or create a brand-new
 * category on the spot (using the search text as its name) when nothing matches.
 */
export function CategoryPickerPopover({ trigger, skuIds }: CategoryPickerPopoverProps) {
  const { categories, bulkMoveToCategory, createCategoryAndMove } = useCatalogue()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const trimmed = query.trim()
  const filtered = categories.filter((c) => c.title.toLowerCase().includes(trimmed.toLowerCase()))
  const exactMatch = categories.some((c) => c.title.toLowerCase() === trimmed.toLowerCase())

  const pick = (id: string) => {
    bulkMoveToCategory(skuIds, id)
    setOpen(false)
  }

  const createAndPick = () => {
    if (!trimmed) return
    createCategoryAndMove(skuIds, { title: trimmed, description: "", status: "Active" })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="center" side="top" className="w-64 p-2">
        <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or create category"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex max-h-52 flex-col overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No categories match.</p>
          ) : (
            filtered.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => pick(category.id)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className={`size-2 shrink-0 rounded-full ${categoryDotClass(category.title)}`} />
                <span className="min-w-0 flex-1 truncate text-foreground">{category.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{category.skus.length}</span>
              </button>
            ))
          )}
        </div>

        {trimmed && !exactMatch && (
          <button
            type="button"
            onClick={createAndPick}
            className="flex items-center gap-1.5 rounded-md border-t border-border px-2 pt-2 text-left text-sm font-medium text-primary hover:underline"
          >
            <Plus className="size-3.5" />
            Create "{trimmed}"
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
