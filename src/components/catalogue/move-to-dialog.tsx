import { useEffect, useState } from "react"
import { ArrowLeft, Check, ChevronDown, Plus, Search, X } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CategoryStatus } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

const selectTriggerClasses =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const statusOptions: CategoryStatus[] = ["Active", "Planning", "Discontinued"]

type Step = "pick" | "create"

interface MoveToDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skuIds: string[]
}

/** Bulk "Move to" dialog for the selection bar — search/pick one or more destination
 *  categories (with an inline "create new category" escape hatch), review as removable
 *  chips, then commit with Done. */
export function MoveToDialog({ open, onOpenChange, skuIds }: MoveToDialogProps) {
  const { categories, bulkMoveToCategories, createCategory } = useCatalogue()
  const [step, setStep] = useState<Step>("pick")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [pendingSelectTitle, setPendingSelectTitle] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newStatus, setNewStatus] = useState<CategoryStatus>("Planning")

  useEffect(() => {
    if (!open) return
    setStep("pick")
    setSelectedIds([])
    setQuery("")
    setPendingSelectTitle(null)
  }, [open])

  // Once the just-created category shows up in context, auto-select it and hop back —
  // createCategory doesn't hand back an id, so match on the title we just submitted.
  useEffect(() => {
    if (!pendingSelectTitle) return
    const created = categories.find((c) => c.title === pendingSelectTitle)
    if (!created) return
    setSelectedIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]))
    setPendingSelectTitle(null)
  }, [categories, pendingSelectTitle])

  const selectedCategories = categories.filter((c) => selectedIds.includes(c.id))

  const trimmedQuery = query.trim()
  const filteredCategories = categories.filter((c) => c.title.toLowerCase().includes(trimmedQuery.toLowerCase()))
  const exactMatch = categories.some((c) => c.title.toLowerCase() === trimmedQuery.toLowerCase())

  const toggleCategory = (categoryId: string) => {
    setSelectedIds((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]))
  }

  const startCreate = () => {
    setNewTitle(trimmedQuery)
    setNewDescription("")
    setNewStatus("Planning")
    setCategoryPopoverOpen(false)
    setStep("create")
  }

  const handleCreateAndGoBack = () => {
    const title = newTitle.trim()
    if (!title) return
    setPendingSelectTitle(title)
    createCategory({ title, description: newDescription.trim(), status: newStatus })
    setQuery("")
    setStep("pick")
  }

  const handleDone = () => {
    if (selectedIds.length === 0) return
    bulkMoveToCategories(skuIds, selectedIds)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[8px] sm:max-w-[420px]" showCloseButton={step === "pick"}>
        {step === "pick" ? (
          <>
            <DialogHeader>
              <DialogTitle>Move to</DialogTitle>
              <DialogDescription>
                Choose one or more categories to move {skuIds.length} SKU{skuIds.length === 1 ? "" : "s"} into.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Category</span>
                <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                  <PopoverTrigger
                    render={
                      <button type="button" className={selectTriggerClasses}>
                        <span className={selectedIds.length ? "" : "text-muted-foreground"}>
                          {selectedIds.length > 0
                            ? `${selectedIds.length} categor${selectedIds.length === 1 ? "y" : "ies"}`
                            : "Select..."}
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    }
                  />
                  <PopoverContent align="start" className="w-[352px] max-w-[calc(100vw-3rem)] p-2">
                    <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5">
                      <Search className="size-3.5 shrink-0 text-muted-foreground" />
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
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
                                selectedIds.includes(c.id)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input"
                              }`}
                            >
                              {selectedIds.includes(c.id) && <Check className="size-3" />}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-foreground">{c.title}</span>
                          </button>
                        ))
                      )}
                    </div>

                    {trimmedQuery && !exactMatch && (
                      <button
                        type="button"
                        onClick={startCreate}
                        className="-mx-2 -mb-2 flex items-center gap-1.5 border-t border-border px-3.5 pt-2 pb-2 text-left text-sm font-medium text-primary hover:underline"
                      >
                        <Plus className="size-3.5" />
                        Create "{trimmedQuery}"
                      </button>
                    )}
                  </PopoverContent>
                </Popover>
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
          </>
        ) : (
          <>
            <DialogHeader className="flex-row items-center gap-2 space-y-0">
              <button
                type="button"
                onClick={() => setStep("pick")}
                aria-label="Back"
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
              <DialogTitle>New category</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Name</span>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Category name" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Description</span>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Short description"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Status</span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CategoryStatus)}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("pick")}>
                Go back
              </Button>
              <Button onClick={handleCreateAndGoBack} disabled={!newTitle.trim()}>
                Create
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
