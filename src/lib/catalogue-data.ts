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

/** Per-SKU dark-store breakdown — same uniform dummy shape used across every pinned SKU. */
const darkStoreAvailabilityTemplate: DarkStoreAvailability[] = [
  { name: "Amazon Now", filled: 12, total: 12 },
  { name: "Blinkit", filled: 10, total: 10 },
  { name: "BigBasket", filled: 8, total: 10 },
  { name: "Instamart", filled: 8, total: 10 },
  { name: "Zepto", filled: 3, total: 6 },
]

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
  platformFilter: string | null
  darkStoreFilter: string | null
  coverageFilter: CoverageLevel
  priceMin: number | null
  grammageFilter: number | null
}

/** SKU-level half of the Filters drawer — category/status live on the category, so those are checked separately. */
export function skuMatchesFilters(sku: CategorySku, filters: SkuFilters): boolean {
  if (filters.stockStatusFilter.size > 0 && !filters.stockStatusFilter.has(sku.stock)) return false
  if (filters.platformFilter && sku.platform !== filters.platformFilter) return false
  if (
    filters.darkStoreFilter &&
    !sku.darkStoreAvailability.some((store) => store.name === filters.darkStoreFilter && store.filled > 0)
  ) {
    return false
  }
  if (filters.coverageFilter !== "any" && skuCoverageLevel(sku) !== filters.coverageFilter) return false
  if (filters.priceMin != null && sku.price < filters.priceMin) return false
  if (filters.grammageFilter != null && sku.weightGrams !== filters.grammageFilter) return false
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

export const channelCoverage = [
  { name: "Amazon Now", value: 52 },
  { name: "Blinkit", value: 52 },
  { name: "BigBasket", value: 52 },
  { name: "Instamart", value: 52 },
  { name: "Zepto", value: 52 },
]

const platformCycle = channelCoverage.map((channel) => channel.name)
const stockCycle: StockStatus[] = ["In Stock", "In Stock", "Low Stock", "Out of Stock"]

let skuSeq = 0
export function makeSku(product: Product, stores: number = 4): CategorySku {
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
    darkStoreAvailability: darkStoreAvailabilityTemplate,
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
export function createSku(input: NewProductInput, stores: number = 4): CategorySku {
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
    darkStoreAvailability: darkStoreAvailabilityTemplate,
  }
}

/** Cycles through the real flavour range so each pinned SKU gets a distinct product photo. */
let productCursor = 0
const nextSkus = (count: number, stores = 4) =>
  Array.from({ length: count }, () => makeSku(products[productCursor++ % products.length], stores))

export const initialCategories: Category[] = [
  { id: "cat-1", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 4, status: "Active", skus: nextSkus(4) },
  { id: "cat-2", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 4, status: "Active", skus: nextSkus(3) },
  { id: "cat-3", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 4, status: "Active", skus: nextSkus(3) },
  { id: "cat-4", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 4, status: "Active", skus: nextSkus(2) },
  { id: "cat-5", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 4, status: "Active", skus: nextSkus(3) },
  { id: "cat-6", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 4, status: "Active", skus: nextSkus(3) },
  { id: "cat-7", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 2, status: "Active", skus: nextSkus(2) },
  { id: "cat-8", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 4, status: "Discontinued", skus: [] },
  { id: "cat-9", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 2, status: "Active", skus: nextSkus(2) },
  { id: "cat-10", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 2, status: "Active", skus: nextSkus(2) },
  { id: "cat-11", title: "Baked / Better-for-you", description: "Lower-oil line for health-led buyers.", itemCount: 2, status: "Active", skus: nextSkus(2) },
]

export const statusRows = [
  { label: "45 SKUs Live", helper: "Ready across all channel", value: "52%" },
  { label: "3 Need attention", helper: "Missing coverage or details", value: "7%" },
  { label: "2 in draft", helper: "Not Yet Published", value: "2%" },
]
