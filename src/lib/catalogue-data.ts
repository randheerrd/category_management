import { products, findProductImageByName, type Product } from "@/lib/products"

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock"

export interface DarkStoreAvailability {
  name: string
  filled: number
  total: number
}

export interface CategorySku {
  id: string
  name: string
  image: string
  price: number
  weightGrams: number
  stores: number
  mrp: number
  platform: string
  darkStores: string
  stock: StockStatus
  darkStoreAvailability: DarkStoreAvailability[]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Realistic capacity range per channel — Amazon Now/Blinkit run the most dark stores,
 *  Zepto the fewest, so totals vary by channel as well as by SKU. */
const channelCapacityRange: Record<string, [number, number]> = {
  "Amazon Now": [8, 14],
  Blinkit: [8, 12],
  BigBasket: [6, 12],
  Instamart: [6, 12],
  Zepto: [3, 8],
}

/** Per-SKU dark-store breakdown — randomized per channel so coverage genuinely varies
 *  SKU to SKU instead of every product showing the same numbers. */
function randomDarkStoreAvailability(): DarkStoreAvailability[] {
  return Object.entries(channelCapacityRange).map(([name, [min, max]]) => {
    const total = randomInt(min, max)
    return { name, filled: randomInt(0, total), total }
  })
}

/** Derived from a SKU's own dark-store breakdown — no separate "coverage" field is stored. */
export type CoverageLevel = "any" | "none" | "partial" | "full"

export function skuCoverageLevel(sku: CategorySku): Exclude<CoverageLevel, "any"> {
  const filled = sku.darkStoreAvailability.reduce((sum, c) => sum + c.filled, 0)
  const total = sku.darkStoreAvailability.reduce((sum, c) => sum + c.total, 0)
  if (total === 0 || filled === 0) return "none"
  if (filled === total) return "full"
  return "partial"
}

export interface SkuFilters {
  stockStatusFilter: Set<StockStatus>
  platformFilter: Set<string>
  darkStoreFilter: Set<string>
  coverageFilter: CoverageLevel
  priceMin: number | null
  priceMax: number | null
  grammageFilter: Set<number>
}

/** SKU-level half of the Filters drawer — category/status live on the category, so those are checked separately. */
export function skuMatchesFilters(sku: CategorySku, filters: SkuFilters): boolean {
  if (filters.stockStatusFilter.size > 0 && !filters.stockStatusFilter.has(sku.stock)) return false
  if (filters.platformFilter.size > 0 && !filters.platformFilter.has(sku.platform)) return false
  if (
    filters.darkStoreFilter.size > 0 &&
    !sku.darkStoreAvailability.some((store) => filters.darkStoreFilter.has(store.name) && store.filled > 0)
  ) {
    return false
  }
  if (filters.coverageFilter !== "any" && skuCoverageLevel(sku) !== filters.coverageFilter) return false
  if (filters.priceMin != null && sku.price < filters.priceMin) return false
  if (filters.priceMax != null && sku.price > filters.priceMax) return false
  if (filters.grammageFilter.size > 0 && !filters.grammageFilter.has(sku.weightGrams)) return false
  return true
}

export type CategoryStatus = "Active" | "Planning" | "Discontinued"

export interface Category {
  id: string
  title: string
  description: string
  /** Total SKUs that belong to this category (can exceed `skus.length`). */
  itemCount: number
  status: CategoryStatus
  skus: CategorySku[]
}

/** What kind of change an activity entry logs — drives which icon it renders with. */
export type ActivityType =
  | "add"
  | "move"
  | "remove"
  | "delete"
  | "category-create"
  | "category-delete"
  | "import"

/** One line in the Catalogue Health panel's "Recent Activity" feed. */
export interface ActivityEntry {
  id: string
  type: ActivityType
  message: string
  /** epoch ms — kept as a number so it survives cheaply without a Date instance. */
  timestamp: number
}

/** The one always-present catch-all category — SKUs with no real category live here:
 *  orphaned by a deleted category, or dragged in directly. Matched by this fixed id
 *  (not by title), so renaming it never breaks the mechanism, and it can't be deleted. */
export const UNLISTED_CATEGORY_ID = "cat-unlisted"

/** The known quick-commerce channels — used to seed platform/dark-store options and to
 *  compute real per-channel coverage below. Values live on each SKU's darkStoreAvailability. */
export const channelNames = ["Amazon Now", "Blinkit", "BigBasket", "Instamart", "Zepto"]

const platformCycle = channelNames
const stockCycle: StockStatus[] = ["In Stock", "In Stock", "Low Stock", "Out of Stock"]

let skuSeq = 0
export function makeSku(product: Product, stores: number = randomInt(1, 10)): CategorySku {
  skuSeq += 1
  return {
    id: `sku-${skuSeq}`,
    name: product.name,
    image: product.image,
    price: product.price,
    weightGrams: product.weightGrams,
    stores,
    mrp: product.price + Math.max(1, Math.round(product.price * 0.1)),
    platform: platformCycle[(skuSeq - 1) % platformCycle.length],
    darkStores: `${stores}/10`,
    stock: stockCycle[(skuSeq - 1) % stockCycle.length],
    darkStoreAvailability: randomDarkStoreAvailability(),
  }
}

export interface NewProductInput {
  name: string
  image?: string
  mrp: number
  price: number
  weightGrams: number
  stock: StockStatus
  platform: string
}

/**
 * Builds a SKU from the "Add a product" form or a CSV row. When no image was uploaded,
 * matches the name against the real flavour catalogue (e.g. CSV row "Lay's Classic Salted"
 * gets that flavour's actual packshot) instead of an arbitrary photo.
 */
export function createSku(input: NewProductInput, stores: number = randomInt(1, 10)): CategorySku {
  skuSeq += 1
  return {
    id: `sku-${skuSeq}`,
    name: input.name,
    image: input.image ?? findProductImageByName(input.name) ?? products[skuSeq % products.length].image,
    price: input.price,
    weightGrams: input.weightGrams,
    stores,
    mrp: input.mrp,
    platform: input.platform,
    darkStores: `${stores}/10`,
    stock: input.stock,
    darkStoreAvailability: randomDarkStoreAvailability(),
  }
}

// Board starts genuinely empty — the only category is the always-present Unlisted
// catch-all, seeded with zero SKUs. Real content only appears once a user adds it,
// via "Upload CSV" (a real import) or "Add Manually" (loads the sample catalogue below).
export const initialCategories: Category[] = [
  { id: UNLISTED_CATEGORY_ID, title: "Unlisted", description: "SKUs not currently pinned to any category.", itemCount: 0, status: "Active", skus: [] },
]

/** Cycles through the real flavour range so each pinned SKU gets a distinct product photo. */
let productCursor = 0
const nextSkus = (count: number, stores?: number) =>
  Array.from({ length: count }, () => makeSku(products[productCursor++ % products.length], stores))

/** Sample catalogue loaded by onboarding's "Add Manually" button — a realistic, fully
 *  populated board so a new user can explore the product before bringing in their own data. */
export const demoCategories: Category[] = [
  { id: "cat-1", title: "Classic Potato Chips", description: "Everyday flagship flavours across every pack size.", itemCount: 10, status: "Active", skus: nextSkus(10) },
  { id: "cat-2", title: "Wavy Cut Range", description: "Ridged-cut chips for a heartier bite.", itemCount: 6, status: "Active", skus: nextSkus(5) },
  { id: "cat-3", title: "Gourmet Selection", description: "Premium adult-skewing flavours in smaller batches.", itemCount: 8, status: "Active", skus: nextSkus(8) },
  { id: "cat-4", title: "Maxx Extreme Flavours", description: "Bold, youth-targeted spicy range.", itemCount: 8, status: "Active", skus: nextSkus(8) },
  { id: "cat-5", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 6, status: "Active", skus: nextSkus(6) },
  { id: "cat-6", title: "Party Packs & Family Sharing", description: "200g+ sharing packs for gatherings.", itemCount: 8, status: "Active", skus: nextSkus(7) },
  { id: "cat-7", title: "Quick-Commerce Exclusives", description: "SKUs tuned for 10-minute delivery baskets.", itemCount: 10, status: "Active", skus: nextSkus(10) },
  { id: "cat-8", title: "Modern Trade / Supermarket", description: "Assortment stocked in large-format retail.", itemCount: 10, status: "Active", skus: nextSkus(9) },
  { id: "cat-9", title: "E-commerce Bulk Packs", description: "Multi-pack cartons sold online.", itemCount: 6, status: "Active", skus: nextSkus(6) },
  { id: "cat-10", title: "Airport & Travel Retail", description: "Premium single-serve packs for travel outlets.", itemCount: 5, status: "Active", skus: nextSkus(5) },
  { id: "cat-11", title: "Regional Flavours — South India", description: "Flavours indexed for southern markets.", itemCount: 6, status: "Active", skus: nextSkus(6) },
  { id: "cat-12", title: "Regional Flavours — North India", description: "Flavours indexed for northern markets.", itemCount: 6, status: "Active", skus: nextSkus(6) },
  { id: "cat-13", title: "Seasonal / Limited Edition", description: "Upcoming seasonal drops, not yet live.", itemCount: 5, status: "Planning", skus: nextSkus(3) },
  { id: "cat-14", title: "Diwali Limited Edition", description: "Festive packaging drop for Diwali.", itemCount: 4, status: "Planning", skus: nextSkus(2) },
  { id: "cat-15", title: "Discontinued / Legacy SKUs", description: "Phased-out flavours kept for historical reference.", itemCount: 4, status: "Discontinued", skus: [] },
  // Always-present catch-all — seeded with the tail of the catalogue that isn't pinned
  // anywhere else yet, so the feature has real content from the start.
  { id: UNLISTED_CATEGORY_ID, title: "Unlisted", description: "SKUs not currently pinned to any category.", itemCount: 9, status: "Active", skus: nextSkus(9) },
]

/** One thing on the board that needs a look — either a category or a specific SKU. The
 *  single source of truth behind the "N items need attention" badge, the Quick Tip, the
 *  Review Issues dialog, and Full Report's issue list, so all four always agree. */
export interface HealthIssue {
  id: string
  type: "category" | "sku"
  label: string
  helper: string
  categoryId?: string
  skuId?: string
}

export function computeCatalogueIssues(categories: Category[]): HealthIssue[] {
  const issues: HealthIssue[] = []

  for (const category of categories) {
    if (category.status === "Planning") {
      issues.push({
        id: `cat-issue-${category.id}`,
        type: "category",
        label: category.title,
        helper: "Planning stage",
        categoryId: category.id,
      })
    } else if (category.skus.length < category.itemCount) {
      issues.push({
        id: `cat-issue-${category.id}`,
        type: "category",
        label: category.title,
        helper: `${category.skus.length}/${category.itemCount} SKUs pinned`,
        categoryId: category.id,
      })
    }

    for (const sku of category.skus) {
      if (sku.stock === "Out of Stock") {
        issues.push({
          id: `sku-issue-${sku.id}-stock`,
          type: "sku",
          label: sku.name,
          helper: "Out of stock",
          categoryId: category.id,
          skuId: sku.id,
        })
      } else if (skuCoverageLevel(sku) !== "full") {
        issues.push({
          id: `sku-issue-${sku.id}-coverage`,
          type: "sku",
          label: sku.name,
          helper: skuCoverageLevel(sku) === "none" ? "No coverage" : "Partial coverage",
          categoryId: category.id,
          skuId: sku.id,
        })
      }
    }
  }

  return issues
}

/** Every pinned SKU falls into exactly one bucket (checked in this order), so the three
 *  rows always sum to the total SKU count. */
export function computeStatusBreakdown(categories: Category[]) {
  let draft = 0
  let live = 0
  let needsAttention = 0

  for (const category of categories) {
    for (const sku of category.skus) {
      if (category.status === "Planning") draft += 1
      else if (sku.stock === "In Stock" && skuCoverageLevel(sku) === "full") live += 1
      else needsAttention += 1
    }
  }

  const total = draft + live + needsAttention
  const pct = (count: number) => (total === 0 ? "0%" : `${Math.round((count / total) * 100)}%`)

  return [
    { label: `${live} SKUs Live`, helper: "Ready across all channels", value: pct(live) },
    { label: `${needsAttention} Need attention`, helper: "Missing coverage or details", value: pct(needsAttention) },
    { label: `${draft} in draft`, helper: "Not Yet Published", value: pct(draft) },
  ]
}

/** Sums filled/total across every visible SKU's darkStoreAvailability, per channel. */
export function computeChannelCoverage(categories: Category[]) {
  const totals = new Map<string, { filled: number; total: number }>()
  for (const name of channelNames) totals.set(name, { filled: 0, total: 0 })

  for (const category of categories) {
    for (const sku of category.skus) {
      for (const store of sku.darkStoreAvailability) {
        const entry = totals.get(store.name)
        if (!entry) continue
        entry.filled += store.filled
        entry.total += store.total
      }
    }
  }

  return channelNames.map((name) => {
    const entry = totals.get(name)!
    const value = entry.total === 0 ? 0 : Math.round((entry.filled / entry.total) * 100)
    return { name, value }
  })
}

/** Equal-weighted average of stock health, category readiness, and channel coverage —
 *  the one place to retune weighting if the formula needs to change later. */
export function computeHealthScore(categories: Category[]): number {
  const allSkus = categories.flatMap((c) => c.skus)
  const stockHealth =
    allSkus.length === 0
      ? 100
      : ((allSkus.filter((s) => s.stock === "In Stock").length +
          0.5 * allSkus.filter((s) => s.stock === "Low Stock").length) /
          allSkus.length) *
        100

  const readyCategories = categories.filter((c) => c.status === "Active" && c.skus.length >= c.itemCount).length
  const categoryReadiness = categories.length === 0 ? 100 : (readyCategories / categories.length) * 100

  const coverageValues = computeChannelCoverage(categories).map((c) => c.value)
  const channelCoverageScore =
    coverageValues.length === 0 ? 100 : coverageValues.reduce((sum, v) => sum + v, 0) / coverageValues.length

  return Math.round((stockHealth + categoryReadiness + channelCoverageScore) / 3)
}
