import { CategoryCard } from "@/components/catalogue/category-card"
import { SkuTable } from "@/components/catalogue/sku-table"
import { useCatalogue } from "@/lib/catalogue-context"

/** Pinned-categories banner + the board of category cards (grid) or the flat SKU table. */
export function CatalogueBoard() {
  const { visibleCategories, categories, setView, allCollapsed, collapseAll, expandAll, view } = useCatalogue()

  return (
    <div className="flex flex-col items-start gap-[60px] p-[26px] rounded-lg">
      <div className="flex w-full items-center justify-center gap-1 rounded-md border-[0.5px] border-indigo-600/10 bg-indigo-600/5 px-3 py-3 text-center text-sm leading-5 text-indigo-800">
        <p>
          You&rsquo;ve pinned {categories.length} categories on the board, try{" "}
          <button
            type="button"
            onClick={() => setView("table")}
            className="font-medium underline decoration-from-font underline-offset-auto"
          >
            table view
          </button>{" "}
          for scanning and bulk edits, or{" "}
          <button
            type="button"
            onClick={allCollapsed ? expandAll : collapseAll}
            className="font-medium underline decoration-from-font underline-offset-auto"
          >
            {allCollapsed ? "expand all" : "collapse all"}
          </button>{" "}
          clusters to fit more on screen.
        </p>
      </div>

      {view === "grid" ? (
        visibleCategories.length === 0 ? (
          <p className="w-full py-12 text-center text-sm text-muted-foreground">
            No categories match your search or filters.
          </p>
        ) : (
          <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
            {visibleCategories.map((category, index) => (
              <CategoryCard key={category.id} {...category} anchorId={index === 0 ? "tour-first-card" : undefined} />
            ))}
          </div>
        )
      ) : (
        <SkuTable />
      )}
    </div>
  )
}
