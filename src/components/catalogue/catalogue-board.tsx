import { CategoryCard } from "@/components/catalogue/category-card"
import { UnlistedSection } from "@/components/catalogue/unlisted-section"
import { SkuTable } from "@/components/catalogue/sku-table"
import { UNLISTED_CATEGORY_ID } from "@/lib/catalogue-data"
import { useCatalogue } from "@/lib/catalogue-context"

/** The board of category cards (grid) or the flat SKU table. */
export function CatalogueBoard() {
  const { visibleCategories, view } = useCatalogue()

  if (view === "table") {
    // The table itself runs edge-to-edge — no side/top padding or card wrapper.
    return <SkuTable />
  }

  const unlistedCategory = visibleCategories.find((c) => c.id === UNLISTED_CATEGORY_ID)
  const pinnedCategories = visibleCategories.filter((c) => c.id !== UNLISTED_CATEGORY_ID)

  return (
    <div className="flex flex-col items-start gap-5 p-[26px] rounded-[8px]">
      {unlistedCategory && <UnlistedSection category={unlistedCategory} />}

      {pinnedCategories.length === 0 ? (
        !unlistedCategory && (
          <p className="w-full py-12 text-center text-sm text-muted-foreground">
            No categories match your search or filters.
          </p>
        )
      ) : (
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
          {pinnedCategories.map((category, index) => (
            <CategoryCard key={category.id} {...category} anchorId={index === 0 ? "tour-first-card" : undefined} />
          ))}
        </div>
      )}
    </div>
  )
}
