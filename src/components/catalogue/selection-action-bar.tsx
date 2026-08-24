import { useState } from "react"
import { FolderInput, Folder, SquarePen, X } from "lucide-react"

import { MoveToDialog } from "@/components/catalogue/move-to-dialog"
import { BulkEditDrawer } from "@/components/catalogue/bulk-edit-drawer"
import { UNLISTED_CATEGORY_ID } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

/** Floating bulk-action bar shown above the table once one or more SKUs are selected. */
export function SelectionActionBar() {
  const { selectedSkuIds, clearSelection, bulkRemoveFromCategory, categories } = useCatalogue()
  const [moveToOpen, setMoveToOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const count = selectedSkuIds.size

  if (count === 0) return null

  const selectedIds = Array.from(selectedSkuIds)

  // "Remove from category" moves SKUs to Unlisted — meaningless when the whole
  // selection is already sitting there, so the action just isn't offered then.
  const selectionOwnerIds = selectedIds.map((id) => categories.find((c) => c.skus.some((s) => s.id === id))?.id)
  const allAlreadyUnlisted = selectionOwnerIds.every((id) => id === UNLISTED_CATEGORY_ID)

  return (
    <div className="pointer-events-none sticky bottom-6 z-20 flex w-full justify-center">
      <div className="pointer-events-auto flex h-11 items-center gap-3 rounded-full bg-slate-950 px-4 text-sm font-medium text-white shadow-[0px_8px_24px_-4px_rgba(0,0,0,0.35)]">
        <span className="whitespace-nowrap">{count} Selected</span>
        <span className="h-4 w-px bg-white/20" />

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 whitespace-nowrap hover:text-white/80"
        >
          <SquarePen className="size-4" />
          Edit Detail
        </button>

        <button
          type="button"
          onClick={() => setMoveToOpen(true)}
          className="flex items-center gap-1.5 whitespace-nowrap hover:text-white/80"
        >
          <FolderInput className="size-4" />
          Move to
        </button>

        {!allAlreadyUnlisted && (
          <button
            type="button"
            onClick={() => bulkRemoveFromCategory(selectedIds)}
            className="flex items-center gap-1.5 whitespace-nowrap hover:text-white/80"
          >
            <Folder className="size-4" />
            Remove From category
          </button>
        )}

        <span className="h-4 w-px bg-white/20" />

        <button type="button" onClick={clearSelection} className="flex items-center gap-1.5 whitespace-nowrap hover:text-white/80">
          <X className="size-4" />
          Clear
        </button>
      </div>

      <MoveToDialog open={moveToOpen} onOpenChange={setMoveToOpen} skuIds={selectedIds} />
      <BulkEditDrawer open={editOpen} onOpenChange={setEditOpen} skuIds={selectedIds} />
    </div>
  )
}
