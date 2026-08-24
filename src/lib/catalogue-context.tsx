import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

import {
  initialCategories,
  demoCategories,
  makeSku,
  createSku,
  skuMatchesFilters,
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
  bulkRemoveFromCategory: (skuIds: string[]) => void
  createCategoryAndMove: (skuIds: string[], input: { title: string; description: string; status: CategoryStatus }) => void
  showAnalyticsPanel: boolean
  toggleAnalyticsPanel: () => void
  selectedSkuId: string | null
  openSkuDetail: (skuId: string) => void
  closeSkuDetail: () => void
  updateSku: (skuId: string, patch: Partial<CategorySku>) => void
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
          platform: row.platform,
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
    const query = search.trim().toLowerCase()
    return categories
      .filter((category) => {
        if (
          categoryFilterIds.size > 0 &&
          !categoryFilterIds.has(category.id) &&
          !categoryFilterIds.has(category.title)
        )
          return false
        if (statusFilter.size > 0 && !statusFilter.has(category.status)) return false
        if (!query) return true
        const matchesCategory =
          category.title.toLowerCase().includes(query) || category.description.toLowerCase().includes(query)
        const matchesSku = category.skus.some((sku) => sku.name.toLowerCase().includes(query))
        return matchesCategory || matchesSku
      })
      .map((category) => ({
        ...category,
        skus: category.skus.filter((sku) =>
          skuMatchesFilters(sku, {
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
    bulkRemoveFromCategory,
    createCategoryAndMove,
    showAnalyticsPanel,
    toggleAnalyticsPanel,
    selectedSkuId,
    openSkuDetail,
    closeSkuDetail,
    updateSku,
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
