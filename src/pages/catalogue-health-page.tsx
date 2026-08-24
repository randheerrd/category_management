import { SidebarNav } from "@/components/catalogue/sidebar-nav"
import { TopBar } from "@/components/catalogue/top-bar"
import { CatalogueHealthPanel } from "@/components/catalogue/catalogue-health-panel"
import { BoardToolbar } from "@/components/catalogue/board-toolbar"
import { CatalogueBoard } from "@/components/catalogue/catalogue-board"
import { SelectionActionBar } from "@/components/catalogue/selection-action-bar"
import { SkuDetailDrawer } from "@/components/catalogue/sku-detail-drawer"
import { AddProductDialog } from "@/components/catalogue/add-product-dialog"
import { AddCategoryDialog } from "@/components/catalogue/add-category-dialog"
import { ManageCategoryDialog } from "@/components/catalogue/manage-category-dialog"
import { Toaster } from "@/components/ui/toaster"
import { useCatalogue } from "@/lib/catalogue-context"

/** The populated catalogue board — assumes a CatalogueProvider is mounted above it. */
export function CatalogueHealthPage() {
  const { showAnalyticsPanel } = useCatalogue()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-foreground">
      <SidebarNav />

      <div className="m-1 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-border bg-background">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <div
            className={`shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out ${
              showAnalyticsPanel ? "w-[360px]" : "w-12"
            }`}
          >
            <CatalogueHealthPanel />
          </div>
          <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
            <BoardToolbar />
            <div className="flex-1 bg-muted">
              <CatalogueBoard />
            </div>
            <SelectionActionBar />
          </div>
        </div>
      </div>

      <SkuDetailDrawer />
      <AddProductDialog />
      <AddCategoryDialog />
      <ManageCategoryDialog />
      <Toaster />
    </div>
  )
}
