import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

import {
  initialCategories,
  demoCategories,
  makeSku,
  createSku,
  skuMatchesFilters,
  computeDarkStoreAvailability,
  UNLISTED_CATEGORY_ID,
  type ActivityEntry,
  type ActivityType,
  type Category,
  type CategorySku,
  type CategoryStatus,
  type CoverageLevel,
  type NewProductInput,
  type StockStatus,
} from "@/lib/catalogue-data"
import { darkStoreLocations } from "@/lib/dark-store-locations"
import { products } from "@/lib/products"
import type { CsvRow } from "@/lib/csv"
import { toast } from "@/lib/toast"

export type BoardView = "grid" | "table"

interface CatalogueContextValue {
  categories: Category[]
  search: string
  setSearch: (value: string) => void
  statusFilter: Set<CategoryStatus>
  toggleStatusFilter: (status: CategoryStatus) => void
  setStatusFilterAll: (next: Set<CategoryStatus>) => void
  clearFilters: () => void
  categoryFilterIds: Set<string>
  setCategoryFilterIds: (ids: Set<string>) => void
  productNameFilter: Set<string>
  setProductNameFilterAll: (next: Set<string>) => void
  stockStatusFilter: Set<StockStatus>
  toggleStockStatusFilter: (status: StockStatus) => void
  setStockStatusFilterAll: (next: Set<StockStatus>) => void
  platformFilter: Set<string>
  setPlatformFilterAll: (next: Set<string>) => void
  darkStoreFilter: Set<string>
  setDarkStoreFilterAll: (next: Set<string>) => void
  coverageFilter: CoverageLevel
  setCoverageFilter: (level: CoverageLevel) => void
  priceMin: number | null
  setPriceMin: (value: number | null) => void
  priceMax: number | null
  setPriceMax: (value: number | null) => void
  grammageFilter: Set<number>
  setGrammageFilterAll: (next: Set<number>) => void
  activeFilterCount: number
  totalSkuCount: number
  countMatchingSkus: (filters: {
    categoryFilterIds: Set<string>
    statusFilter: Set<CategoryStatus>
    productNameFilter: Set<string>
    stockStatusFilter: Set<StockStatus>
    platformFilter: Set<string>
    darkStoreFilter: Set<string>
    coverageFilter: CoverageLevel
    priceMin: number | null
    priceMax: number | null
    grammageFilter: Set<number>
  }) => number
  view: BoardView
  setView: (view: BoardView) => void
  collapsedIds: Set<string>
  toggleCollapsed: (id: string) => void
  collapseAll: () => void
  expandAll: () => void
  allCollapsed: boolean
  addSku: (categoryId: string) => void
  addCategory: () => void
  moveSku: (skuId: string, fromCategoryId: string, toCategoryId: string) => void
  visibleCategories: Category[]
  date: Date
  groupByCategory: boolean
  setGroupByCategory: (value: boolean) => void
  selectedSkuIds: Set<string>
  toggleSkuSelected: (skuId: string) => void
  setSelectedSkuIds: (ids: Set<string>) => void
  clearSelection: () => void
  bulkMoveToCategory: (skuIds: string[], toCategoryId: string) => void
  bulkMoveToCategories: (skuIds: string[], toCategoryIds: string[]) => void
  bulkRemoveFromCategory: (skuIds: string[]) => void
  /** Adds a SKU into an additional category without touching its existing pins. */
  pinSkuToCategory: (skuId: string, categoryId: string) => void
  /** Removes a SKU from one specific category; falls back to Unlisted if that was its last pin. */
  unpinSkuFromCategory: (skuId: string, categoryId: string) => void
  createCategoryAndMove: (skuIds: string[], input: { title: string; description: string; status: CategoryStatus }) => void
  showAnalyticsPanel: boolean
  toggleAnalyticsPanel: () => void
  selectedSkuId: string | null
  openSkuDetail: (skuId: string) => void
  closeSkuDetail: () => void
  updateSku: (skuId: string, patch: Partial<CategorySku>) => void
  bulkUpdateSkus: (skuIds: string[], patch: Partial<CategorySku>) => void
  bulkAddCategoriesToSkus: (skuIds: string[], categoryIds: string[]) => void
  bulkAddPlatformsToSkus: (skuIds: string[], platforms: string[]) => void
  bulkAddStoresToSkus: (skuIds: string[], storeIds: string[]) => void
  deleteSku: (skuId: string) => void
  addProductOpen: boolean
  addProductCategoryId: string | null
  openAddProduct: (categoryId?: string) => void
  closeAddProduct: () => void
  createProduct: (input: NewProductInput, categoryIds: string[]) => void
  addCategoryOpen: boolean
  openAddCategory: () => void
  closeAddCategory: () => void
  createCategory: (input: { title: string; description: string; status: CategoryStatus }) => void
  manageCategoryId: string | null
  openManageCategory: (categoryId: string) => void
  closeManageCategory: () => void
  updateCategory: (categoryId: string, patch: Partial<Pick<Category, "title" | "description" | "status">>) => void
  deleteCategory: (categoryId: string) => void
  uploadCsvOpen: boolean
  openUploadCsv: () => void
  closeUploadCsv: () => void
  importCsvRows: (rows: CsvRow[]) => { skusImported: number; categoriesCreated: number; categoriesUpdated: number }
  loadDemoCatalogue: () => void
  /** Newest-first feed behind the health panel's "Recent Activity" — every create/move/delete logs one entry. */
  activity: ActivityEntry[]
}

const CatalogueContext = createContext<CatalogueContextValue | null>(null)

let activitySeq = 0

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<Set<CategoryStatus>>(new Set())
  const [categoryFilterIds, setCategoryFilterIds] = useState<Set<string>>(new Set())
  const [productNameFilter, setProductNameFilter] = useState<Set<string>>(new Set())
  const [stockStatusFilter, setStockStatusFilter] = useState<Set<StockStatus>>(new Set())
  const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set())
  const [darkStoreFilter, setDarkStoreFilter] = useState<Set<string>>(new Set())
  const [coverageFilter, setCoverageFilter] = useState<CoverageLevel>("any")
  const [priceMin, setPriceMin] = useState<number | null>(null)
  const [priceMax, setPriceMax] = useState<number | null>(null)
  const [grammageFilter, setGrammageFilter] = useState<Set<number>>(new Set())
  const [view, setViewState] = useState<BoardView>("grid")
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  // Read-only "last synced" timestamp — not a date to browse by (no per-date history exists to filter).
  const [date] = useState<Date>(new Date(2026, 7, 12))
  const [groupByCategory, setGroupByCategory] = useState(true)
  const [selectedSkuIds, setSelectedSkuIds] = useState<Set<string>>(new Set())
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(true)
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null)
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [addProductCategoryId, setAddProductCategoryId] = useState<string | null>(null)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [manageCategoryId, setManageCategoryId] = useState<string | null>(null)
  const [uploadCsvOpen, setUploadCsvOpen] = useState(false)
  const [activity, setActivity] = useState<ActivityEntry[]>([])

  const logActivity = (message: string, type: ActivityType) => {
    activitySeq += 1
    setActivity((prev) => [{ id: `activity-${activitySeq}`, type, message, timestamp: Date.now() }, ...prev])
  }

  const openUploadCsv = () => setUploadCsvOpen(true)
  const closeUploadCsv = () => setUploadCsvOpen(false)

  // Onboarding's "Add Manually" — swaps the empty board for the sample catalogue so a
  // new user has something real to explore instead of a blank Add-a-product form.
  const loadDemoCatalogue = () => {
    setCategories(demoCategories)
    const dayMs = 24 * 60 * 60 * 1000
    setActivity([
      { id: "activity-demo-1", type: "move", message: "Move Chile Limon 52g to Spicy", timestamp: Date.now() - 1 * dayMs },
      { id: "activity-demo-2", type: "add", message: "SKU added Protein Chips", timestamp: Date.now() - 2 * dayMs },
      { id: "activity-demo-3", type: "category-create", message: "Category created Beverages", timestamp: Date.now() - 5 * dayMs },
      { id: "activity-demo-4", type: "import", message: "Imported 24 SKUs from CSV", timestamp: Date.now() - 6 * dayMs },
      { id: "activity-demo-5", type: "move", message: "Move Magic Masala 90g to Bestsellers", timestamp: Date.now() - 7 * dayMs },
      { id: "activity-demo-6", type: "delete", message: "SKU deleted India's Magic Masala 28g", timestamp: Date.now() - 8 * dayMs },
      { id: "activity-demo-7", type: "add", message: "SKU added Sour Cream & Onion 52g", timestamp: Date.now() - 9 * dayMs },
      { id: "activity-demo-8", type: "category-create", message: "Category created Party Packs", timestamp: Date.now() - 10 * dayMs },
      { id: "activity-demo-9", type: "remove", message: "Removed 3 SKUs from category", timestamp: Date.now() - 11 * dayMs },
      { id: "activity-demo-10", type: "move", message: "Move Classic Salted 90g to Bestsellers", timestamp: Date.now() - 12 * dayMs },
      { id: "activity-demo-11", type: "add", message: "SKU added Tangy Tomato 28g", timestamp: Date.now() - 13 * dayMs },
      { id: "activity-demo-12", type: "category-delete", message: "Category deleted Seasonal", timestamp: Date.now() - 14 * dayMs },
      { id: "activity-demo-13", type: "import", message: "Imported 12 SKUs from CSV", timestamp: Date.now() - 15 * dayMs },
      { id: "activity-demo-14", type: "move", message: "Move American Style Cream & Onion 52g to Spicy", timestamp: Date.now() - 16 * dayMs },
      { id: "activity-demo-15", type: "add", message: "SKU added Chile Limon 28g", timestamp: Date.now() - 17 * dayMs },
      { id: "activity-demo-16", type: "delete", message: "SKU deleted Magic Masala 14g", timestamp: Date.now() - 18 * dayMs },
      { id: "activity-demo-17", type: "category-create", message: "Category created Health Snacks", timestamp: Date.now() - 19 * dayMs },
      { id: "activity-demo-18", type: "move", message: "Move Protein Chips to Health Snacks", timestamp: Date.now() - 20 * dayMs },
      { id: "activity-demo-19", type: "remove", message: "Removed 2 SKUs from category", timestamp: Date.now() - 21 * dayMs },
      { id: "activity-demo-20", type: "add", message: "SKU added Spanish Tomato Tango 52g", timestamp: Date.now() - 22 * dayMs },
    ])
  }

  // Groups parsed CSV rows by category title, creating any category that doesn't already
  // exist (case-insensitive match) and pinning a new SKU per row into it.
  const importCsvRows = (rows: CsvRow[]) => {
    const createdTitles = new Set<string>()
    const updatedTitles = new Set<string>()

    setCategories((prev) => {
      const next = [...prev]

      for (const row of rows) {
        const key = row.category.toLowerCase()
        const sku = createSku({
          name: row.name,
          mrp: row.mrp,
          price: row.price,
          weightGrams: row.weightGrams,
          stock: row.stock,
          platforms: [row.platform],
        })

        const existingIndex = next.findIndex((c) => c.title.toLowerCase() === key)
        if (existingIndex >= 0) {
          const existing = next[existingIndex]
          next[existingIndex] = { ...existing, itemCount: existing.itemCount + 1, skus: [...existing.skus, sku] }
          if (!createdTitles.has(key)) updatedTitles.add(key)
        } else {
          next.push({
            id: `cat-${Date.now()}-${next.length}`,
            title: row.category,
            description: "Imported from CSV.",
            itemCount: 1,
            status: row.status,
            skus: [sku],
          })
          createdTitles.add(key)
        }
      }

      return next
    })

    toast(`Imported ${rows.length} SKU${rows.length === 1 ? "" : "s"}`, {
      description: `${createdTitles.size} categor${createdTitles.size === 1 ? "y" : "ies"} created, ${updatedTitles.size} updated.`,
    })
    logActivity(`Imported ${rows.length} SKU${rows.length === 1 ? "" : "s"} from CSV`, "import")

    return { skusImported: rows.length, categoriesCreated: createdTitles.size, categoriesUpdated: updatedTitles.size }
  }

  const openAddCategory = () => setAddCategoryOpen(true)
  const closeAddCategory = () => setAddCategoryOpen(false)

  const createCategory = (input: { title: string; description: string; status: CategoryStatus }) => {
    setCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        title: input.title,
        description: input.description,
        itemCount: 0,
        status: input.status,
        skus: [],
      },
    ])
    setAddCategoryOpen(false)
    toast(`Created "${input.title}"`)
    logActivity(`Category created ${input.title}`, "category-create")
  }

  const openManageCategory = (categoryId: string) => setManageCategoryId(categoryId)
  const closeManageCategory = () => setManageCategoryId(null)

  const updateCategory = (categoryId: string, patch: Partial<Pick<Category, "title" | "description" | "status">>) => {
    const existing = categories.find((c) => c.id === categoryId)
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)))
    setManageCategoryId(null)
    if (existing) toast(`Saved "${patch.title ?? existing.title}"`)
  }

  // The deleted category's SKUs aren't discarded — they land in the always-present
  // "Unlisted" category (matched by its fixed id, not title, so renaming it is safe).
  // Unlisted itself can't be deleted — there'd be nowhere left for its SKUs to fall back to.
  const deleteCategory = (categoryId: string) => {
    if (categoryId === UNLISTED_CATEGORY_ID) {
      toast.error("Can't delete Unlisted", { description: "It's where orphaned SKUs land." })
      return
    }

    const target = categories.find((c) => c.id === categoryId)
    if (!target) return

    setCategories((prev) => {
      const withoutTarget = prev.filter((c) => c.id !== categoryId)
      if (target.skus.length === 0) return withoutTarget

      const unlisted = withoutTarget.find((c) => c.id === UNLISTED_CATEGORY_ID)
      if (unlisted) {
        return withoutTarget.map((c) =>
          c.id === UNLISTED_CATEGORY_ID
            ? { ...c, itemCount: c.itemCount + target.skus.length, skus: [...c.skus, ...target.skus] }
            : c
        )
      }
      // Defensive fallback — Unlisted is always seeded, but re-create it if it's ever missing.
      return [
        ...withoutTarget,
        {
          id: UNLISTED_CATEGORY_ID,
          title: "Unlisted",
          description: "SKUs not currently pinned to any category.",
          itemCount: target.skus.length,
          status: "Active",
          skus: target.skus,
        },
      ]
    })
    setManageCategoryId(null)
    toast.error(`Deleted "${target.title}"`, {
      description: target.skus.length > 0 ? `${target.skus.length} SKU(s) moved to Unlisted.` : undefined,
    })
    logActivity(`Category deleted ${target.title}`, "category-delete")
  }

  const openAddProduct = (categoryId?: string) => {
    setAddProductCategoryId(categoryId ?? null)
    setAddProductOpen(true)
  }
  const closeAddProduct = () => setAddProductOpen(false)

  // A new SKU can be pinned into several categories at once — unlike moveSku/bulkMoveToCategory,
  // which re-pin an existing SKU to exactly one, this pushes the same SKU into every category chosen.
  const createProduct = (input: NewProductInput, categoryIds: string[]) => {
    const sku = createSku(input)
    setCategories((prev) =>
      prev.map((c) => (categoryIds.includes(c.id) ? { ...c, itemCount: c.itemCount + 1, skus: [...c.skus, sku] } : c))
    )
    setAddProductOpen(false)
    toast(`Added "${sku.name}"`, {
      description: `Pinned to ${categoryIds.length} categor${categoryIds.length === 1 ? "y" : "ies"}.`,
    })
    logActivity(`SKU added ${sku.name}`, "add")
  }

  const clearSelection = () => setSelectedSkuIds(new Set())

  const openSkuDetail = (skuId: string) => setSelectedSkuId(skuId)
  const closeSkuDetail = () => setSelectedSkuId(null)

  const updateSku = (skuId: string, patch: Partial<CategorySku>) => {
    const sku = categories.flatMap((c) => c.skus).find((s) => s.id === skuId)
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        skus: c.skus.map((s) => (s.id === skuId ? { ...s, ...patch } : s)),
      }))
    )
    if (sku) toast(`Saved "${sku.name}"`)
  }

  // Bulk "Edit Detail" from the selection bar — applies the same patch (only the fields
  // the user actually filled in) to every selected SKU at once, across whatever
  // categories they happen to live in.
  const bulkUpdateSkus = (skuIds: string[], patch: Partial<CategorySku>) => {
    const idSet = new Set(skuIds)
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        skus: c.skus.map((s) => (idSet.has(s.id) ? { ...s, ...patch } : s)),
      }))
    )
    clearSelection()
    toast(`Updated ${skuIds.length} SKU${skuIds.length === 1 ? "" : "s"}`)
    logActivity(`Bulk edited ${skuIds.length} SKU${skuIds.length === 1 ? "" : "s"}`, "edit")
  }

  // Pins every selected SKU into every given category, additively — keeps whatever
  // categories each SKU was already in (unlike "Move to", which re-pins exclusively).
  const bulkAddCategoriesToSkus = (skuIds: string[], categoryIds: string[]) => {
    if (categoryIds.length === 0) return
    const destIdSet = new Set(categoryIds)
    setCategories((prev) => {
      const skusById = new Map(prev.flatMap((c) => c.skus).map((s) => [s.id, s]))
      return prev.map((c) => {
        if (!destIdSet.has(c.id)) return c
        const alreadyIn = new Set(c.skus.map((s) => s.id))
        const toAdd = skuIds.filter((id) => !alreadyIn.has(id) && skusById.has(id)).map((id) => skusById.get(id)!)
        if (toAdd.length === 0) return c
        return { ...c, itemCount: c.itemCount + toAdd.length, skus: [...c.skus, ...toAdd] }
      })
    })
    toast(`Pinned ${skuIds.length} SKU${skuIds.length === 1 ? "" : "s"}`, {
      description: `Into ${categoryIds.length} categor${categoryIds.length === 1 ? "y" : "ies"}`,
    })
  }

  // Unions each selected SKU's own platform/darkStore lists with the given additions —
  // per-SKU, since every SKU can already carry a different set.
  const bulkAddPlatformsToSkus = (skuIds: string[], platforms: string[]) => {
    if (platforms.length === 0) return
    const idSet = new Set(skuIds)
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        skus: c.skus.map((s) =>
          idSet.has(s.id) ? { ...s, platforms: [...new Set([...s.platforms, ...platforms])] } : s
        ),
      }))
    )
    toast(`Updated ${skuIds.length} SKU${skuIds.length === 1 ? "" : "s"}`, { description: "Platforms added" })
  }

  const bulkAddStoresToSkus = (skuIds: string[], storeIds: string[]) => {
    if (storeIds.length === 0) return
    const idSet = new Set(skuIds)
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        skus: c.skus.map((s) => {
          if (!idSet.has(s.id)) return s
          const nextIds = [...new Set([...s.stockedStoreIds, ...storeIds])]
          return {
            ...s,
            stockedStoreIds: nextIds,
            darkStoreAvailability: computeDarkStoreAvailability(nextIds),
            stores: nextIds.length,
            darkStores: `${nextIds.length}/${darkStoreLocations.length}`,
          }
        }),
      }))
    )
    toast(`Updated ${skuIds.length} SKU${skuIds.length === 1 ? "" : "s"}`, { description: "Dark stores added" })
  }

  const deleteSku = (skuId: string) => {
    const sku = categories.flatMap((c) => c.skus).find((s) => s.id === skuId)
    setCategories((prev) =>
      prev.map((c) => {
        const kept = c.skus.filter((s) => s.id !== skuId)
        if (kept.length === c.skus.length) return c
        return { ...c, itemCount: Math.max(0, c.itemCount - 1), skus: kept }
      })
    )
    setSelectedSkuId((current) => (current === skuId ? null : current))
    if (sku) {
      toast.error(`Deleted "${sku.name}"`)
      logActivity(`SKU deleted ${sku.name}`, "delete")
    }
  }

  const setView = (next: BoardView) => {
    setViewState(next)
    // The analytics rail is hidden by default on the table screen to give the grid room to breathe.
    setShowAnalyticsPanel(next === "grid")
    clearSelection()
  }

  const toggleAnalyticsPanel = () => setShowAnalyticsPanel((prev) => !prev)

  const toggleSkuSelected = (skuId: string) => {
    setSelectedSkuIds((prev) => {
      const next = new Set(prev)
      if (next.has(skuId)) next.delete(skuId)
      else next.add(skuId)
      return next
    })
  }

  const toggleStatusFilter = (status: CategoryStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const clearFilters = () => {
    setStatusFilter(new Set())
    setCategoryFilterIds(new Set())
    setProductNameFilter(new Set())
    setStockStatusFilter(new Set())
    setPlatformFilter(new Set())
    setDarkStoreFilter(new Set())
    setCoverageFilter("any")
    setPriceMin(null)
    setPriceMax(null)
    setGrammageFilter(new Set())
  }

  const toggleStockStatusFilter = (status: StockStatus) => {
    setStockStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const collapseAll = () => setCollapsedIds(new Set(categories.map((c) => c.id)))
  const expandAll = () => setCollapsedIds(new Set())
  const allCollapsed = categories.length > 0 && collapsedIds.size === categories.length

  const addSku = (categoryId: string) => {
    const sku = makeSku(products[Math.floor(Math.random() * products.length)])
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, itemCount: c.itemCount + 1, skus: [...c.skus, sku] } : c))
    )
    toast(`Added "${sku.name}"`)
    logActivity(`SKU added ${sku.name}`, "add")
  }

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        title: "New category",
        description: "Untitled cluster — add SKUs to get started.",
        itemCount: 0,
        status: "Planning",
        skus: [],
      },
    ])
    toast('Created "New category"')
    logActivity("Category created New category", "category-create")
  }

  const moveSku = (skuId: string, fromCategoryId: string, toCategoryId: string) => {
    if (fromCategoryId === toCategoryId) return
    const source = categories.find((c) => c.id === fromCategoryId)
    const sku = source?.skus.find((s) => s.id === skuId)
    const destination = categories.find((c) => c.id === toCategoryId)
    if (!sku) return
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === fromCategoryId) {
          return { ...c, itemCount: Math.max(0, c.itemCount - 1), skus: c.skus.filter((s) => s.id !== skuId) }
        }
        if (c.id === toCategoryId) {
          return { ...c, itemCount: c.itemCount + 1, skus: [...c.skus, sku] }
        }
        return c
      })
    )
    toast(`Moved "${sku.name}"`, { description: destination ? `To ${destination.title}` : undefined })
    logActivity(destination ? `Move ${sku.name} to ${destination.title}` : `Move ${sku.name}`, "move")
  }

  // "Move to" and "Add to Category" both resolve here — SKUs belong to a single
  // category in this data model, so both actions re-pin the SKU to the target.
  const bulkMoveToCategory = (skuIds: string[], toCategoryId: string) => {
    const destination = categories.find((c) => c.id === toCategoryId)
    const movedSku = categories.flatMap((c) => c.skus).find((s) => s.id === skuIds[0])
    setCategories((prev) => {
      const idSet = new Set(skuIds)
      const moved: Category["skus"] = []
      const withoutMoved = prev.map((c) => {
        const kept = c.skus.filter((s) => !idSet.has(s.id))
        moved.push(...c.skus.filter((s) => idSet.has(s.id)))
        return kept.length === c.skus.length ? c : { ...c, itemCount: Math.max(0, c.itemCount - (c.skus.length - kept.length)), skus: kept }
      })
      return withoutMoved.map((c) =>
        c.id === toCategoryId ? { ...c, itemCount: c.itemCount + moved.length, skus: [...c.skus, ...moved] } : c
      )
    })
    clearSelection()
    toast(`Moved ${skuIds.length} SKU${skuIds.length === 1 ? "" : "s"}`, {
      description: destination ? `To ${destination.title}` : undefined,
    })
    if (!destination) return
    logActivity(
      skuIds.length === 1 && movedSku
        ? `Move ${movedSku.name} to ${destination.title}`
        : `Move ${skuIds.length} SKUs to ${destination.title}`,
      "move"
    )
  }

  // Multi-target version of bulkMoveToCategory — the selection bar's "Move to" dialog lets
  // a user pick several destination categories at once, so this re-pins each selected SKU
  // into every chosen category (same object reference, like createProduct does), replacing
  // whatever categories it was in before.
  const bulkMoveToCategories = (skuIds: string[], toCategoryIds: string[]) => {
    if (toCategoryIds.length === 0) return
    const destinations = categories.filter((c) => toCategoryIds.includes(c.id))
    const movedSku = categories.flatMap((c) => c.skus).find((s) => s.id === skuIds[0])
    const destIdSet = new Set(toCategoryIds)
    setCategories((prev) => {
      const idSet = new Set(skuIds)
      const moved: Category["skus"] = []
      const withoutMoved = prev.map((c) => {
        const kept = c.skus.filter((s) => !idSet.has(s.id))
        moved.push(...c.skus.filter((s) => idSet.has(s.id)))
        return kept.length === c.skus.length ? c : { ...c, itemCount: Math.max(0, c.itemCount - (c.skus.length - kept.length)), skus: kept }
      })
      return withoutMoved.map((c) =>
        destIdSet.has(c.id) ? { ...c, itemCount: c.itemCount + moved.length, skus: [...c.skus, ...moved] } : c
      )
    })
    clearSelection()
    const destinationLabel = destinations.map((d) => d.title).join(", ")
    toast(`Moved ${skuIds.length} SKU${skuIds.length === 1 ? "" : "s"}`, { description: `To ${destinationLabel}` })
    logActivity(
      skuIds.length === 1 && movedSku
        ? `Move ${movedSku.name} to ${destinationLabel}`
        : `Move ${skuIds.length} SKUs to ${destinationLabel}`,
      "move"
    )
  }

  // "Remove from category" doesn't orphan SKUs into the void — it moves them to the
  // always-present Unlisted category, same destination a deleted category falls back to.
  const bulkRemoveFromCategory = (skuIds: string[]) => {
    setCategories((prev) => {
      const idSet = new Set(skuIds)
      const moved: Category["skus"] = []
      const withoutMoved = prev.map((c) => {
        const kept = c.skus.filter((s) => !idSet.has(s.id))
        moved.push(...c.skus.filter((s) => idSet.has(s.id)))
        return kept.length === c.skus.length ? c : { ...c, itemCount: Math.max(0, c.itemCount - (c.skus.length - kept.length)), skus: kept }
      })
      return withoutMoved.map((c) =>
        c.id === UNLISTED_CATEGORY_ID ? { ...c, itemCount: c.itemCount + moved.length, skus: [...c.skus, ...moved] } : c
      )
    })
    clearSelection()
    toast.error(`Removed ${skuIds.length} SKU${skuIds.length === 1 ? "" : "s"} from category`, {
      description: "Moved to Unlisted.",
    })
    logActivity(`Removed ${skuIds.length} SKU${skuIds.length === 1 ? "" : "s"} from category`, "remove")
  }

  // Pins into one additional category, keeping the SKU's other memberships intact — used by
  // the detail drawer's multi-select "Pinned in" so a SKU can live in several categories at once.
  const pinSkuToCategory = (skuId: string, categoryId: string) => {
    const sku = categories.flatMap((c) => c.skus).find((s) => s.id === skuId)
    const destination = categories.find((c) => c.id === categoryId)
    if (!sku || !destination) return
    if (destination.skus.some((s) => s.id === skuId)) return
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, itemCount: c.itemCount + 1, skus: [...c.skus, sku] } : c))
    )
    toast(`Pinned "${sku.name}"`, { description: `To ${destination.title}` })
    logActivity(`Move ${sku.name} to ${destination.title}`, "move")
  }

  // Removes a SKU from just one of its categories. If that was its only pin, it falls back
  // to Unlisted — same "never orphan a SKU" rule bulkRemoveFromCategory follows.
  const unpinSkuFromCategory = (skuId: string, categoryId: string) => {
    const sku = categories.flatMap((c) => c.skus).find((s) => s.id === skuId)
    const source = categories.find((c) => c.id === categoryId)
    if (!sku || !source) return
    const remainingMemberships = categories.filter((c) => c.id !== categoryId && c.skus.some((s) => s.id === skuId))
    setCategories((prev) => {
      const withoutSku = prev.map((c) =>
        c.id === categoryId
          ? { ...c, itemCount: Math.max(0, c.itemCount - 1), skus: c.skus.filter((s) => s.id !== skuId) }
          : c
      )
      if (remainingMemberships.length > 0) return withoutSku
      // Last pin removed — fall back to Unlisted, same as bulkRemoveFromCategory.
      return withoutSku.map((c) =>
        c.id === UNLISTED_CATEGORY_ID ? { ...c, itemCount: c.itemCount + 1, skus: [...c.skus, sku] } : c
      )
    })
    toast.error(`Unpinned "${sku.name}"`, { description: `From ${source.title}` })
    logActivity(`Removed ${sku.name} from category`, "remove")
  }

  // "Move to" in the bulk selection bar can target a brand-new category — creates it and
  // moves the selection into it in one atomic update instead of two separate actions.
  const createCategoryAndMove = (
    skuIds: string[],
    input: { title: string; description: string; status: CategoryStatus }
  ) => {
    setCategories((prev) => {
      const idSet = new Set(skuIds)
      const moved: Category["skus"] = []
      const withoutMoved = prev.map((c) => {
        const kept = c.skus.filter((s) => !idSet.has(s.id))
        moved.push(...c.skus.filter((s) => idSet.has(s.id)))
        return kept.length === c.skus.length ? c : { ...c, itemCount: Math.max(0, c.itemCount - (c.skus.length - kept.length)), skus: kept }
      })
      return [
        ...withoutMoved,
        {
          id: `cat-${Date.now()}`,
          title: input.title,
          description: input.description,
          itemCount: moved.length,
          status: input.status,
          skus: moved,
        },
      ]
    })
    clearSelection()
    toast(`Created "${input.title}"`, { description: `${skuIds.length} SKU(s) moved here.` })
  }

  const visibleCategories = useMemo(() => {
    // Strip apostrophes so "lays classic salt" matches "Lay's Classic Salted", and split
    // into words so each has to appear somewhere (not all contiguously) — free word order,
    // partial words, and punctuation the user wouldn't bother typing all still match.
    const normalize = (s: string) => s.toLowerCase().replace(/['’]/g, "")
    const queryTokens = normalize(search).split(/\s+/).filter(Boolean)
    return categories
      .filter((category) => {
        if (
          categoryFilterIds.size > 0 &&
          !categoryFilterIds.has(category.id) &&
          !categoryFilterIds.has(category.title)
        )
          return false
        if (statusFilter.size > 0 && !statusFilter.has(category.status)) return false
        if (queryTokens.length === 0) return true
        // Open search — matches on name, category (title/description), price, item
        // count, grammage, and status (Active/Planning/Discontinued/stock), not just
        // the SKU name.
        const categoryHaystack = normalize(
          `${category.title} ${category.description} ${category.status} ${category.itemCount}`
        )
        const matchesCategory = queryTokens.every((token) => categoryHaystack.includes(token))
        const matchesSku = category.skus.some((sku) => {
          const skuHaystack = normalize(
            `${sku.name} ${sku.platforms.join(" ")} ${sku.stock} ${sku.price} ${sku.mrp} ${sku.weightGrams}`
          )
          return queryTokens.every((token) => skuHaystack.includes(token))
        })
        return matchesCategory || matchesSku
      })
      .map((category) => ({
        ...category,
        skus: category.skus.filter((sku) =>
          skuMatchesFilters(sku, {
            productNameFilter,
            stockStatusFilter,
            platformFilter,
            darkStoreFilter,
            coverageFilter,
            priceMin,
            priceMax,
            grammageFilter,
          })
        ),
      }))
  }, [
    categories,
    search,
    statusFilter,
    categoryFilterIds,
    productNameFilter,
    stockStatusFilter,
    platformFilter,
    darkStoreFilter,
    coverageFilter,
    priceMin,
    priceMax,
    grammageFilter,
  ])

  const activeFilterCount =
    statusFilter.size +
    categoryFilterIds.size +
    productNameFilter.size +
    stockStatusFilter.size +
    platformFilter.size +
    darkStoreFilter.size +
    (coverageFilter !== "any" ? 1 : 0) +
    (priceMin != null ? 1 : 0) +
    (priceMax != null ? 1 : 0) +
    grammageFilter.size

  const totalSkuCount = useMemo(() => categories.reduce((sum, c) => sum + c.skus.length, 0), [categories])

  // Lets the Filters drawer preview a live match count against a draft (not-yet-applied) filter combination.
  const countMatchingSkus = (filters: {
    categoryFilterIds: Set<string>
    statusFilter: Set<CategoryStatus>
    productNameFilter: Set<string>
    stockStatusFilter: Set<StockStatus>
    platformFilter: Set<string>
    darkStoreFilter: Set<string>
    coverageFilter: CoverageLevel
    priceMin: number | null
    priceMax: number | null
    grammageFilter: Set<number>
  }) => {
    let count = 0
    for (const category of categories) {
      if (
        filters.categoryFilterIds.size > 0 &&
        !filters.categoryFilterIds.has(category.id) &&
        !filters.categoryFilterIds.has(category.title)
      )
        continue
      if (filters.statusFilter.size > 0 && !filters.statusFilter.has(category.status)) continue
      for (const sku of category.skus) {
        if (skuMatchesFilters(sku, filters)) count += 1
      }
    }
    return count
  }

  const value: CatalogueContextValue = {
    categories,
    search,
    setSearch,
    statusFilter,
    toggleStatusFilter,
    setStatusFilterAll: setStatusFilter,
    clearFilters,
    categoryFilterIds,
    setCategoryFilterIds,
    productNameFilter,
    setProductNameFilterAll: setProductNameFilter,
    stockStatusFilter,
    toggleStockStatusFilter,
    setStockStatusFilterAll: setStockStatusFilter,
    platformFilter,
    setPlatformFilterAll: setPlatformFilter,
    darkStoreFilter,
    setDarkStoreFilterAll: setDarkStoreFilter,
    coverageFilter,
    setCoverageFilter,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    grammageFilter,
    setGrammageFilterAll: setGrammageFilter,
    activeFilterCount,
    totalSkuCount,
    countMatchingSkus,
    view,
    setView,
    collapsedIds,
    toggleCollapsed,
    collapseAll,
    expandAll,
    allCollapsed,
    addSku,
    addCategory,
    moveSku,
    visibleCategories,
    date,
    groupByCategory,
    setGroupByCategory,
    selectedSkuIds,
    toggleSkuSelected,
    setSelectedSkuIds,
    clearSelection,
    bulkMoveToCategory,
    bulkMoveToCategories,
    bulkRemoveFromCategory,
    pinSkuToCategory,
    unpinSkuFromCategory,
    createCategoryAndMove,
    showAnalyticsPanel,
    toggleAnalyticsPanel,
    selectedSkuId,
    openSkuDetail,
    closeSkuDetail,
    updateSku,
    bulkUpdateSkus,
    bulkAddCategoriesToSkus,
    bulkAddPlatformsToSkus,
    bulkAddStoresToSkus,
    deleteSku,
    addProductOpen,
    addProductCategoryId,
    openAddProduct,
    closeAddProduct,
    createProduct,
    addCategoryOpen,
    openAddCategory,
    closeAddCategory,
    createCategory,
    manageCategoryId,
    openManageCategory,
    closeManageCategory,
    updateCategory,
    deleteCategory,
    uploadCsvOpen,
    openUploadCsv,
    closeUploadCsv,
    importCsvRows,
    loadDemoCatalogue,
    activity,
  }

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>
}

export function useCatalogue() {
  const ctx = useContext(CatalogueContext)
  if (!ctx) throw new Error("useCatalogue must be used within a CatalogueProvider")
  return ctx
}
