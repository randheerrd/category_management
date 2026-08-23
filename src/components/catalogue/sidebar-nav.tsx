import { useState } from "react"
import {
  SquareTerminal,
  BriefcaseBusiness,
  Package,
  Eye,
  BadgePercent,
  Grid2x2,
  ChartColumnBig,
  NotebookText,
  type LucideIcon,
} from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import layslogo from "@/assets/layslogo.png"
import avatarFooter from "@/assets/avatar-footer.png"

const primaryNav: { icon: LucideIcon; label: string }[] = [
  { icon: SquareTerminal, label: "Overview" },
  { icon: BriefcaseBusiness, label: "Brands" },
  { icon: Package, label: "Catalogue" },
  { icon: Eye, label: "Visibility" },
]
const secondaryNav: { icon: LucideIcon; label: string }[] = [
  { icon: BadgePercent, label: "Promotions" },
  { icon: Grid2x2, label: "Assortment" },
  { icon: ChartColumnBig, label: "Analytics" },
  { icon: NotebookText, label: "Reports" },
]

/** Far-left collapsed icon rail. */
export function SidebarNav() {
  const [active, setActive] = useState("Catalogue")

  const renderItem = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
    <Tooltip key={label}>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={() => setActive(label)}
            className={`flex size-8 items-center justify-center rounded-sm ${
              active === label ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="size-4" />
          </button>
        }
      />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )

  return (
    <div id="tour-sidebar" className="flex h-full w-12 shrink-0 flex-col items-center bg-sidebar">
      <div className="flex w-full flex-col items-center gap-1 p-2">
        <img src={layslogo} alt="Lay's" className="size-8 rounded-lg object-cover" />
      </div>

      <div className="flex w-full flex-col items-center gap-1 p-2">{primaryNav.map(renderItem)}</div>

      <div className="flex w-full flex-col items-center gap-1 p-2">{secondaryNav.map(renderItem)}</div>

      <div className="flex-1" />

      <div className="flex w-full flex-col items-center p-2">
        <img src={avatarFooter} alt="User" className="size-8 rounded-lg object-cover" />
      </div>
    </div>
  )
}
