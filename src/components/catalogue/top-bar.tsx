import { ListChecks, ChevronRight, ChevronDown, FolderPlus, PackagePlus, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCatalogue } from "@/lib/catalogue-context"

/** Breadcrumb + create action. */
export function TopBar() {
  const { openAddCategory, openAddProduct, openUploadCsv } = useCatalogue()

  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <ListChecks className="size-4 text-muted-foreground" />
          <span className="text-sm leading-5 text-muted-foreground">Home</span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
        <span className="text-sm leading-5 text-foreground">Catalogue</span>
      </div>

      <div className="flex items-center gap-2">
        <div id="tour-create">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="min-w-16">
                  Add
                  <ChevronDown className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => openAddCategory()} className="gap-2 py-2">
                <FolderPlus className="size-4" />
                New category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAddProduct()} className="gap-2 py-2">
                <PackagePlus className="size-4" />
                New product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openUploadCsv()} className="gap-2 py-2">
                <UploadCloud className="size-4" />
                Upload CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
