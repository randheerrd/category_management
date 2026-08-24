import * as XLSX from "xlsx"

import type { Category } from "@/lib/catalogue-data"

/** Flattens the board (every category × every SKU) into one row per SKU and downloads it
 *  as a real .xlsx workbook — mirrors the CSV import's column shape (see csv.ts) plus the
 *  extra fields the board actually tracks (platforms, dark-store coverage). */
export function exportCatalogueToXlsx(categories: Category[], filename = "catalogue-export.xlsx") {
  const rows = categories.flatMap((category) =>
    category.skus.map((sku) => ({
      Category: category.title,
      "SKU Name": sku.name,
      Price: sku.price,
      MRP: sku.mrp,
      "Weight (g)": sku.weightGrams,
      Platforms: sku.platforms.join(", "),
      Stock: sku.stock,
      Status: category.status,
      "Dark Stores": sku.darkStores,
    }))
  )

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Catalogue")
  XLSX.writeFile(workbook, filename)
}
