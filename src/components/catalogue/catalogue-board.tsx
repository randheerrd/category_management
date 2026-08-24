import { CategoryCard } from "@/components/catalogue/category-card"
import { SkuTable } from "@/components/catalogue/sku-table"
import { useCatalogue } from "@/lib/catalogue-context"

/** The board of category cards (grid) or the flat SKU table. */
export function CatalogueBoard() {
  const { visibleCategories, view } = useCatalogue()

  if (view === "table") {
    // The table itself runs edge-to-edge — no side/top padding or card wrapper.
    return <SkuTable />
  }

  return (
    <div className="flex flex-col items-start gap-5 p-[26px] rounded-[8px]">
      {visibleCategories.length === 0 ? (
        <p className="w-full py-12 text-center text-sm text-muted-foreground">
          No categories match your search or filters.
        </p>
      ) : (
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
          {visibleCategories.map((category, index) => (
            <CategoryCard key={category.id} {...category} anchorId={index === 0 ? "tour-first-card" : undefined} />
          ))}
        </div>
      )}
    </div>
  )
}
