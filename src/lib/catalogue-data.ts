import { products, findProductImageByName, type Product } from "@/lib/products"
import { darkStoreLocations } from "@/lib/dark-store-locations"

/** Freeform — the 3 built-ins below are still the only ones with special meaning
 *  (see computeSkuHealthCounts), but a user can type and create any other value. */
export type StockStatus = string
export const BUILT_IN_STOCK_STATUSES: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]

export interface DarkStoreAvailability {
  name: string
  filled: number
  total: number
}

export interface CategorySku {
  id: string
  name: string
  image: string
  description: string
  price: number
  weightGrams: number
  stores: number
  mrp: number
  /** Every quick-commerce channel this SKU is actually listed on — can be more than one. */
  platforms: string[]
  darkStores: string
  stock: StockStatus
  darkStoreAvailability: DarkStoreAvailability[]
  /** Which physical dark stores (see dark-store-locations.ts) actually stock this SKU —
   *  the source of truth darkStoreAvailability/stores/darkStores are all derived from. */
  stockedStoreIds: string[]
}

/** A healthy demo catalogue should mostly read as healthy — most SKUs are fully stocked
 *  everywhere, with a small realistic minority left partial/near-empty so the health
 *  panel's issues list still has real things to catch. Same shape as before (a random
 *  subset of the real dark store list), just biased toward full instead of uniform.
 *
 *  Only draws from stores on the SKU's own channels — a store belongs to exactly one
 *  platform, so a SKU listed only on Instamart can't be "stocked" at a Blinkit store. */
function randomStockedStoreIds(platforms: string[]): string[] {
  const eligible = darkStoreLocations.filter((store) => platforms.includes(store.channel))
  if (Math.random() < 0.95) return eligible.map((store) => store.id)
  const fillRate = Math.random()
  return eligible.filter(() => Math.random() < fillRate).map((store) => store.id)
}

/** Per-channel filled/total, derived from which physical stores are actually stocked —
 *  single source of truth so the card badge, table column, and detail drawer always agree. */
export function computeDarkStoreAvailability(stockedStoreIds: string[]): DarkStoreAvailability[] {
  const stocked = new Set(stockedStoreIds)
  const byChannel = new Map<string, { filled: number; total: number }>()
  for (const store of darkStoreLocations) {
    const entry = byChannel.get(store.channel) ?? { filled: 0, total: 0 }
    entry.total += 1
    if (stocked.has(store.id)) entry.filled += 1
    byChannel.set(store.channel, entry)
  }
  return [...byChannel.entries()].map(([name, { filled, total }]) => ({ name, filled, total }))
}

/** Derived from a SKU's own dark-store breakdown — no separate "coverage" field is stored. */
export type CoverageLevel = "any" | "none" | "partial" | "full"

/** Only counts the channels a SKU is actually assigned to via `platforms` — a SKU
 *  listed on just Blinkit shouldn't need stores on Zepto/Instamart/etc. to read as
 *  "full" coverage. Un-assigned channels don't count against it either way. */
export function skuCoverageLevel(sku: CategorySku): Exclude<CoverageLevel, "any"> {
  const assigned = new Set(sku.platforms)
  const relevant = sku.darkStoreAvailability.filter((c) => assigned.has(c.name))
  const filled = relevant.reduce((sum, c) => sum + c.filled, 0)
  const total = relevant.reduce((sum, c) => sum + c.total, 0)
  if (total === 0 || filled === 0) return "none"
  if (filled === total) return "full"
  return "partial"
}

export interface SkuFilters {
  productNameFilter: Set<string>
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
  if (filters.productNameFilter.size > 0 && !filters.productNameFilter.has(sku.name)) return false
  if (filters.stockStatusFilter.size > 0 && !filters.stockStatusFilter.has(sku.stock)) return false
  if (filters.platformFilter.size > 0 && !sku.platforms.some((p) => filters.platformFilter.has(p))) return false
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

/** Freeform — "Planning" and "Discontinued" are still the only ones with special
 *  meaning (draft/excluded in the health math below); any other value behaves like
 *  "Active". A user can type and create custom statuses beyond the 3 built-ins. */
export type CategoryStatus = string
export const BUILT_IN_CATEGORY_STATUSES: CategoryStatus[] = ["Active", "Planning", "Discontinued"]

/** Options for a status picker: built-ins first (stable order), then any custom
 *  values already in use on a category — so a status someone typed once stays
 *  pickable later without a separate "remembered options" store. */
export function categoryStatusOptions(categories: Category[]): CategoryStatus[] {
  const extra = categories.map((c) => c.status).filter((s) => !BUILT_IN_CATEGORY_STATUSES.includes(s))
  return [...BUILT_IN_CATEGORY_STATUSES, ...new Set(extra)]
}

/** Same idea as categoryStatusOptions, but for SKU stock values. */
export function stockStatusOptions(categories: Category[]): StockStatus[] {
  const extra = categories.flatMap((c) => c.skus.map((s) => s.stock)).filter((s) => !BUILT_IN_STOCK_STATUSES.includes(s))
  return [...BUILT_IN_STOCK_STATUSES, ...new Set(extra)]
}

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
  | "edit"

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
export function makeSku(product: Product): CategorySku {
  skuSeq += 1
  const platforms = [platformCycle[(skuSeq - 1) % platformCycle.length]]
  const stockedStoreIds = randomStockedStoreIds(platforms)
  const darkStoreAvailability = computeDarkStoreAvailability(stockedStoreIds)
  const filled = stockedStoreIds.length
  // Coverage total only counts stores on the SKU's own channel(s) — the same scoping
  // skuCoverageLevel uses — not every dark store across every channel.
  const eligibleTotal = darkStoreLocations.filter((store) => platforms.includes(store.channel)).length
  const total = darkStoreLocations.length
  // Fully-covered SKUs are genuinely in stock — stock and coverage aren't drawn
  // independently, otherwise a random Low/Out-of-Stock pick would keep diluting the
  // "live" bucket even for SKUs that are actually fully stocked everywhere.
  const stock: StockStatus = filled === eligibleTotal ? "In Stock" : stockCycle[(skuSeq - 1) % stockCycle.length]
  return {
    id: `sku-${skuSeq}`,
    name: product.name,
    image: product.image,
    description: product.description,
    price: product.price,
    weightGrams: product.weightGrams,
    // "Stores" everywhere else in the UI (card badge, table column) is derived from this
    // same stocked-store list, so they always agree with the detail drawer.
    stores: filled,
    mrp: product.price + Math.max(1, Math.round(product.price * 0.1)),
    platforms,
    darkStores: `${filled}/${total}`,
    stock,
    darkStoreAvailability,
    stockedStoreIds,
  }
}

export interface NewProductInput {
  name: string
  image?: string
  description?: string
  mrp: number
  price: number
  weightGrams: number
  stock: StockStatus
  platforms: string[]
  /** Explicit store picks from the "New Product" drawer; falls back to a random spread
   *  (e.g. for CSV rows, which don't carry per-store detail) when omitted. */
  stockedStoreIds?: string[]
}

/**
 * Builds a SKU from the "Add a product" form or a CSV row. When no image was uploaded,
 * matches the name against the real flavour catalogue (e.g. CSV row "Lay's Classic Salted"
 * gets that flavour's actual packshot) instead of an arbitrary photo.
 */
export function createSku(input: NewProductInput): CategorySku {
  skuSeq += 1
  const platforms = input.platforms.length > 0 ? input.platforms : [platformCycle[0]]
  const stockedStoreIds = input.stockedStoreIds ?? randomStockedStoreIds(platforms)
  const darkStoreAvailability = computeDarkStoreAvailability(stockedStoreIds)
  const filled = stockedStoreIds.length
  const total = darkStoreLocations.length
  return {
    id: `sku-${skuSeq}`,
    name: input.name,
    image: input.image ?? findProductImageByName(input.name) ?? products[skuSeq % products.length].image,
    description: input.description ?? "",
    price: input.price,
    weightGrams: input.weightGrams,
    stores: filled,
    mrp: input.mrp,
    platforms,
    darkStores: `${filled}/${total}`,
    stock: input.stock,
    darkStoreAvailability,
    stockedStoreIds,
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
const nextSkus = (count: number) =>
  Array.from({ length: count }, () => makeSku(products[productCursor++ % products.length]))

/** Sample catalogue loaded by onboarding's "Add Manually" button — a realistic, fully
 *  populated board so a new user can explore the product before bringing in their own data. */
export const demoCategories: Category[] = [
  { id: "cat-1", title: "Classic Potato Chips", description: "Everyday flagship flavours across every pack size.", itemCount: 10, status: "Active", skus: nextSkus(10) },
  { id: "cat-2", title: "Wavy Cut Range", description: "Ridged-cut chips for a heartier bite.", itemCount: 5, status: "Active", skus: nextSkus(5) },
  { id: "cat-3", title: "Gourmet Selection", description: "Premium adult-skewing flavours in smaller batches.", itemCount: 8, status: "Active", skus: nextSkus(8) },
  { id: "cat-4", title: "Maxx Extreme Flavours", description: "Bold, youth-targeted spicy range.", itemCount: 8, status: "Active", skus: nextSkus(8) },
  { id: "cat-5", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 6, status: "Active", skus: nextSkus(6) },
  { id: "cat-6", title: "Party Packs & Family Sharing", description: "200g+ sharing packs for gatherings.", itemCount: 7, status: "Active", skus: nextSkus(7) },
  { id: "cat-7", title: "Quick-Commerce Exclusives", description: "SKUs tuned for 10-minute delivery baskets.", itemCount: 10, status: "Active", skus: nextSkus(10) },
  { id: "cat-8", title: "Modern Trade / Supermarket", description: "Assortment stocked in large-format retail.", itemCount: 9, status: "Active", skus: nextSkus(9) },
  { id: "cat-9", title: "E-commerce Bulk Packs", description: "Multi-pack cartons sold online.", itemCount: 6, status: "Active", skus: nextSkus(6) },
  { id: "cat-10", title: "Airport & Travel Retail", description: "Premium single-serve packs for travel outlets.", itemCount: 5, status: "Active", skus: nextSkus(5) },
  { id: "cat-11", title: "Regional Flavours — South India", description: "Flavours indexed for southern markets.", itemCount: 6, status: "Active", skus: nextSkus(6) },
  { id: "cat-12", title: "Regional Flavours — North India", description: "Flavours indexed for northern markets.", itemCount: 6, status: "Active", skus: nextSkus(6) },
  { id: "cat-13", title: "Seasonal / Limited Edition", description: "Upcoming seasonal drops, not yet live.", itemCount: 3, status: "Planning", skus: nextSkus(3) },
  { id: "cat-14", title: "Diwali Limited Edition", description: "Festive packaging drop for Diwali.", itemCount: 2, status: "Planning", skus: nextSkus(2) },
  { id: "cat-15", title: "Discontinued / Legacy SKUs", description: "Phased-out flavours kept for historical reference.", itemCount: 0, status: "Discontinued", skus: [] },
  // Always-present catch-all — seeded with the tail of the catalogue that isn't pinned
  // anywhere else yet, so the feature has real content from the start.
  { id: UNLISTED_CATEGORY_ID, title: "Unlisted", description: "SKUs not currently pinned to any category.", itemCount: 9, status: "Active", skus: nextSkus(9) },
]

// A handful of flagship SKUs realistically sell through more than one merchandising
// list at once (e.g. a bestseller is both a "Classic" and a "Quick-Commerce Exclusive").
// Pin a couple of real examples into a second category the same way pinSkuToCategory
// does at runtime, so the "also pinned elsewhere" indicator has something to show for
// out of the box instead of only appearing after a user manually cross-pins something.
function crossPin(fromCategoryId: string, skuIndex: number, toCategoryId: string) {
  const source = demoCategories.find((c) => c.id === fromCategoryId)
  const destination = demoCategories.find((c) => c.id === toCategoryId)
  const sku = source?.skus[skuIndex]
  if (!sku || !destination || destination.skus.some((s) => s.id === sku.id)) return
  destination.skus.push(sku)
  destination.itemCount += 1
}
crossPin("cat-1", 0, "cat-7") // a flagship Classic Potato Chips SKU — also a Quick-Commerce Exclusive
crossPin("cat-3", 0, "cat-10") // a Gourmet Selection SKU — also stocked at Airport & Travel Retail

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
    } else if (category.status !== "Discontinued" && category.skus.length < category.itemCount) {
      issues.push({
        id: `cat-issue-${category.id}`,
        type: "category",
        label: category.title,
        helper: `${category.skus.length}/${category.itemCount} SKUs pinned`,
        categoryId: category.id,
      })
    }

    // A category can be flagged as Unlisted on top of its Planning/understaffed check
    // above — being unpinned from every real category is its own distinct problem.
    if (category.id === UNLISTED_CATEGORY_ID && category.skus.length > 0) {
      issues.push({
        id: "cat-issue-unlisted",
        type: "category",
        label: category.title,
        helper: `${category.skus.length} SKU${category.skus.length === 1 ? "" : "s"} not pinned to any category`,
        categoryId: category.id,
      })
    }

    // Independent checks, not if/else — a SKU can be both out of stock AND
    // under-covered, and both problems should show up, not just the first one found.
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
      }
      if (skuCoverageLevel(sku) !== "full") {
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

/** Every pinned SKU in a non-Discontinued category falls into exactly one bucket — the
 *  single source of truth behind the score, the breakdown rows, and the "N need
 *  attention" banner, so those three numbers can never disagree with each other.
 *  Discontinued-category SKUs are excluded: they're retired on purpose, not a problem. */
export function computeSkuHealthCounts(categories: Category[]) {
  let live = 0
  let attention = 0
  let draft = 0

  for (const category of categories) {
    if (category.status === "Discontinued") continue
    for (const sku of category.skus) {
      if (category.status === "Planning") draft += 1
      else if (sku.stock === "In Stock" && skuCoverageLevel(sku) === "full") live += 1
      else attention += 1
    }
  }

  return { live, attention, draft, total: live + attention + draft }
}

export function computeStatusBreakdown(categories: Category[]) {
  const { live, attention, draft, total } = computeSkuHealthCounts(categories)
  const pct = (count: number) => (total === 0 ? "0%" : `${Math.round((count / total) * 100)}%`)

  return [
    { label: `${live} SKUs Live`, helper: "Ready across all channels", value: pct(live) },
    { label: `${attention} Need attention`, helper: "Missing coverage or details", value: pct(attention) },
    { label: `${draft} in draft`, helper: "Not Yet Published", value: pct(draft) },
  ]
}

/** Sums filled/total across every visible SKU's darkStoreAvailability, per channel.
 *  Discontinued categories are excluded — same rule computeSkuHealthCounts uses, so
 *  a catalogue with several fully-stocked-but-retired SKUs doesn't show coverage
 *  numbers stronger than the health score they're already excluded from.
 *
 *  Only counts a channel for a SKU that's actually listed on it (same platform-scoping
 *  as skuCoverageLevel) — a SKU sold only on Instamart shouldn't drag Blinkit's coverage
 *  number up or down just because it happens to have a dark-store availability entry for it. */
export function computeChannelCoverage(categories: Category[]) {
  const totals = new Map<string, { filled: number; total: number }>()
  for (const name of channelNames) totals.set(name, { filled: 0, total: 0 })

  for (const category of categories) {
    if (category.status === "Discontinued") continue
    for (const sku of category.skus) {
      const assigned = new Set(sku.platforms)
      for (const store of sku.darkStoreAvailability) {
        if (!assigned.has(store.name)) continue
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

/** The score IS the "SKUs Live" percentage from computeSkuHealthCounts — not a separate
 *  blended formula. That's what keeps the ring, the "N need attention" banner, and the
 *  breakdown row all telling the same story instead of three unrelated numbers. */
export function computeHealthScore(categories: Category[]): number {
  const { live, total } = computeSkuHealthCounts(categories)
  return total === 0 ? 100 : Math.round((live / total) * 100)
}
