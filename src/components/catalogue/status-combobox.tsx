import { useEffect, useState } from "react"
import { Check, ChevronDown, Plus, Search } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const selectTriggerClasses =
  "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

interface StatusComboboxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
}

/** Notion-style status picker — search the existing options, or type one that doesn't
 *  exist yet and create it on the spot. Same search/create popover as "Move to"'s
 *  category picker, reused here for category Status and SKU Stock. */
export function StatusCombobox({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search or create...",
}: StatusComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const trimmedQuery = query.trim()
  const filtered = options.filter((option) => option.toLowerCase().includes(trimmedQuery.toLowerCase()))
  const exactMatch = options.some((option) => option.toLowerCase() === trimmedQuery.toLowerCase())

  const select = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button type="button" className={selectTriggerClasses}>
            <span className={value ? "" : "text-muted-foreground"}>{value || placeholder}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) max-w-[calc(100vw-3rem)] p-2">
        <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex max-h-52 flex-col overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matches.</p>
          ) : (
            filtered.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => select(option)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {value === option && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">{option}</span>
              </button>
            ))
          )}
        </div>

        {trimmedQuery && !exactMatch && (
          <button
            type="button"
            onClick={() => select(trimmedQuery)}
            className="-mx-2 -mb-2 flex items-center gap-1.5 border-t border-border px-3.5 pt-2 pb-2 text-left text-sm font-medium text-primary hover:underline"
          >
            <Plus className="size-3.5" />
            Create "{trimmedQuery}"
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
