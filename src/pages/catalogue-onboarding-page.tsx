import { SidebarNav } from "@/components/catalogue/sidebar-nav"
import { CatalogueEmptyState } from "@/components/catalogue/catalogue-empty-state"
import { useCatalogue } from "@/lib/catalogue-context"

interface CatalogueOnboardingPageProps {
  onContinue: () => void
}

/** First screen a new user sees for the Catalogue module — no products yet. */
export function CatalogueOnboardingPage({ onContinue }: CatalogueOnboardingPageProps) {
  const { loadDemoCatalogue } = useCatalogue()

  const handleAddManually = () => {
    loadDemoCatalogue()
    onContinue()
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <SidebarNav />
      <CatalogueEmptyState onAddManually={handleAddManually} />
    </div>
  )
}
