import { useState } from "react"

import { CatalogueOnboardingPage } from "@/pages/catalogue-onboarding-page"
import { CatalogueHealthPage } from "@/pages/catalogue-health-page"
import { UploadCsvDialog } from "@/components/catalogue/upload-csv-dialog"
import { CatalogueProvider } from "@/lib/catalogue-context"
import { TooltipProvider } from "@/components/ui/tooltip"

/**
 * Switches between the empty-state onboarding screen and the populated board.
 * Both live inside one CatalogueProvider so a CSV imported during onboarding
 * is still on the board once the user continues past it.
 */
function AppShell() {
  const [onboarded, setOnboarded] = useState(false)
  const continueToBoard = () => setOnboarded(true)

  return (
    <>
      {onboarded ? <CatalogueHealthPage /> : <CatalogueOnboardingPage onContinue={continueToBoard} />}
      <UploadCsvDialog onImported={continueToBoard} />
    </>
  )
}

function App() {
  return (
    <TooltipProvider>
      <CatalogueProvider>
        <AppShell />
      </CatalogueProvider>
    </TooltipProvider>
  )
}

export default App
