import { Search, LayoutGrid, Table as TableIcon, X, PanelLeft } from "lucide-react"

import { FiltersDrawer } from "@/components/catalogue/filters-drawer"
import { Checkbox } from "@/components/ui/checkbox"
import { useCatalogue } from "@/lib/catalogue-context"

/** Search input, filters button, and grid/table view switch above the board. */
export function BoardToolbar() {
  const {
    search,
    setSearch,
    view,
    setView,
    groupByCategory,
    setGroupByCategory,
    showAnalyticsPanel,
    toggleAnalyticsPanel,
  } = useCatalogue()

  return (
    <div className="flex h-12 w-full shrink-0 items-center justify-between border-b border-border px-4 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleAnalyticsPanel}
          aria-pressed={showAnalyticsPanel}
          aria-label="Toggle catalogue health panel"
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted ${
            showAnalyticsPanel ? "bg-muted" : ""
          }`}
        >
          <PanelLeft className="size-4" />
        </button>

        <div id="tour-search" className="flex h-8 w-[200px] items-center gap-1 rounded-lg border border-input bg-background pr-3 pl-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {view === "table" && (
          <label className="flex items-center gap-1.5 text-sm text-foreground">
            <Checkbox checked={groupByCategory} onCheckedChange={(checked) => setGroupByCategory(checked === true)} />
            Group by Category
          </label>
        )}

        <div id="tour-filters">
          <FiltersDrawer />
        </div>

        <div className="flex h-8 items-stretch overflow-hidden rounded-lg border border-border bg-secondary">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex min-w-8 items-center justify-center border-r border-border px-3 ${
              view === "grid" ? "bg-background" : "bg-muted"
            }`}
          >
            <LayoutGrid className="size-4 text-foreground" />
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`flex min-w-8 items-center justify-center px-3 ${
              view === "table" ? "bg-background" : "bg-muted"
            }`}
          >
            <TableIcon className="size-4 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
