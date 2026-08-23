import { FolderInput, FolderPlus, Folder, X } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCatalogue } from "@/lib/catalogue-context"

/** Floating bulk-action bar shown above the table once one or more SKUs are selected. */
export function SelectionActionBar() {
  const { selectedSkuIds, clearSelection, bulkMoveToCategory, bulkRemoveFromCategory, categories } = useCatalogue()
  const count = selectedSkuIds.size

  if (count === 0) return null

  const selectedIds = Array.from(selectedSkuIds)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
      <div className="pointer-events-auto flex h-11 items-center gap-3 rounded-full bg-slate-950 px-4 text-sm font-medium text-white shadow-[0px_8px_24px_-4px_rgba(0,0,0,0.35)]">
        <span className="whitespace-nowrap">{count} Selected</span>
        <span className="h-4 w-px bg-white/20" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" className="flex items-center gap-1.5 whitespace-nowrap hover:text-white/80">
                <FolderInput className="size-4" />
                Move to
              </button>
            }
          />
          <DropdownMenuContent align="center" side="top">
            {categories.map((category) => (
              <DropdownMenuItem key={category.id} onClick={() => bulkMoveToCategory(selectedIds, category.id)}>
                {category.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" className="flex items-center gap-1.5 whitespace-nowrap hover:text-white/80">
                <FolderPlus className="size-4" />
                Add to Category
              </button>
            }
          />
          <DropdownMenuContent align="center" side="top">
            {categories.map((category) => (
              <DropdownMenuItem key={category.id} onClick={() => bulkMoveToCategory(selectedIds, category.id)}>
                {category.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={() => bulkRemoveFromCategory(selectedIds)}
          className="flex items-center gap-1.5 whitespace-nowrap hover:text-white/80"
        >
          <Folder className="size-4" />
          Remove From category
        </button>

        <span className="h-4 w-px bg-white/20" />

        <button type="button" onClick={clearSelection} className="flex items-center gap-1.5 whitespace-nowrap hover:text-white/80">
          <X className="size-4" />
          Clear
        </button>
      </div>
    </div>
  )
}
