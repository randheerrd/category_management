import * as XLSX from "xlsx"

import type { CategoryStatus, StockStatus } from "@/lib/catalogue-data"

export interface CsvRow {
  category: string
  name: string
  price: number
  mrp: number
  weightGrams: number
  platform: string
  stock: StockStatus
  status: CategoryStatus
}

export interface CsvRowError {
  row: number
  message: string
}

export interface CsvParseResult {
  rows: CsvRow[]
  errors: CsvRowError[]
}

const HEADERS = ["Category", "SKU Name", "Price", "MRP", "Weight (g)", "Platform", "Stock", "Status"] as const

export const CSV_TEMPLATE = [
  HEADERS.join(","),
  "Baked / Better-for-you,Lay's Classic Salted,20,22,140,Amazon,In Stock,Active",
  "Baked / Better-for-you,India's Magic Masala,20,22,140,Blinkit,In Stock,Active",
  "Gourmet,Gourmet Thai Sweet Chilli,99,109,113,Amazon,Low Stock,Planning",
].join("\n")

/** Splits one CSV line into fields, honoring double-quoted values that may contain commas. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      fields.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

type FieldKey = "category" | "name" | "price" | "mrp" | "weightGrams" | "platform" | "stock" | "status"

const FIELD_ORDER: FieldKey[] = ["category", "name", "price", "mrp", "weightGrams", "platform", "stock", "status"]

/** A column's header text only has to fuzzy-match one of these (case/spacing/punctuation
 *  stripped) to be recognized — so "Weight (g)", "weight", and "Grammage" all map to the
 *  same field, and columns from a differently-shaped export (extra "Dark Stores" column,
 *  reordered fields, "Platforms" plural, ...) still land correctly instead of shifting
 *  every field over by one and failing validation on garbage. */
const FIELD_ALIASES: Record<FieldKey, string[]> = {
  category: ["category", "categoryname", "categories", "cat"],
  name: ["skuname", "sku", "productname", "product", "itemname", "item", "name", "title"],
  price: ["price", "sellingprice", "sp", "saleprice"],
  mrp: ["mrp", "maxretailprice", "listprice"],
  weightGrams: ["weightg", "weight", "weightgrams", "grammage", "grammageg", "wtg", "packsize", "packsizeg"],
  platform: ["platform", "platforms", "channel", "channels"],
  stock: ["stock", "stockstatus", "inventorystatus", "availability"],
  status: ["status", "categorystatus", "catstatus"],
}

const DEFAULT_COLUMN_MAP: Record<FieldKey, number> = {
  category: 0,
  name: 1,
  price: 2,
  mrp: 3,
  weightGrams: 4,
  platform: 5,
  stock: 6,
  status: 7,
}

/** Row-array validation shared by both formats — CSV hands it string[] split from each
 *  text line, XLSX hands it string[] read straight off each sheet row. `columnMap` says
 *  which index each field actually lives at (from header detection below, or the
 *  template's plain left-to-right order when there's no header to read). */
function parseCatalogueRows(
  dataRows: string[][],
  rowNumberOffset: number,
  columnMap: Partial<Record<FieldKey, number>>
): CsvParseResult {
  const rows: CsvRow[] = []
  const errors: CsvRowError[] = []
  const get = (fields: string[], key: FieldKey) => {
    const index = columnMap[key]
    return index === undefined ? undefined : fields[index]
  }

  dataRows.forEach((fields, index) => {
    const rowNumber = index + rowNumberOffset
    const category = get(fields, "category")
    const name = get(fields, "name")
    const priceRaw = get(fields, "price")
    const mrpRaw = get(fields, "mrp")
    const weightRaw = get(fields, "weightGrams")
    const platform = get(fields, "platform")
    const stockRaw = get(fields, "stock")
    const statusRaw = get(fields, "status")

    if (!category?.trim()) {
      errors.push({ row: rowNumber, message: "Missing category." })
      return
    }
    if (!name?.trim()) {
      errors.push({ row: rowNumber, message: "Missing SKU name." })
      return
    }
    const price = Number(priceRaw)
    if (!priceRaw || Number.isNaN(price) || price < 0) {
      errors.push({ row: rowNumber, message: `Invalid price "${priceRaw ?? ""}".` })
      return
    }
    const weightGrams = Number(weightRaw)
    if (!weightRaw || Number.isNaN(weightGrams) || weightGrams <= 0) {
      errors.push({ row: rowNumber, message: `Invalid weight "${weightRaw ?? ""}".` })
      return
    }
    const mrp = Number(mrpRaw)

    // Status/stock are freeform now — whatever the row says is a valid custom value,
    // we just need a fallback for a blank cell.
    const stock = stockRaw?.trim() || "In Stock"
    const status = statusRaw?.trim() || "Active"

    rows.push({
      category: category.trim(),
      name: name.trim(),
      price,
      mrp: Number.isNaN(mrp) || mrp <= 0 ? Math.round(price * 1.1) : mrp,
      weightGrams,
      platform: platform?.trim() || "Amazon",
      stock,
      status,
    })
  })

  return { rows, errors }
}

function normalizeHeaderCell(cell: string): string {
  return cell.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/** Scans a possible header row and maps each recognizable column to its field, by name,
 *  regardless of order — so a reordered or differently-worded header still works, and any
 *  column that doesn't match a known field (an extra "Dark Stores" column, a "Notes"
 *  column, ...) is just left out of the map and ignored rather than breaking alignment.
 *  Returns null when the required fields (category/name/price/weight) aren't found,
 *  meaning this isn't a header row at all — the file has no header and its columns
 *  should be read in the template's plain left-to-right order instead. */
function detectHeaderMapping(headerRow: string[]): Partial<Record<FieldKey, number>> | null {
  const normalized = headerRow.map(normalizeHeaderCell)
  const claimed = new Set<number>()
  const mapping: Partial<Record<FieldKey, number>> = {}

  for (const field of FIELD_ORDER) {
    const aliases = FIELD_ALIASES[field]
    const index = normalized.findIndex((cell, i) => !claimed.has(i) && aliases.includes(cell))
    if (index !== -1) {
      mapping[field] = index
      claimed.add(index)
    }
  }

  const required: FieldKey[] = ["category", "name", "price", "weightGrams"]
  return required.every((field) => mapping[field] !== undefined) ? mapping : null
}

/** Parses a CSV file's text into catalogue rows, collecting per-row validation errors rather than throwing. */
export function parseCatalogueCsv(text: string): CsvParseResult {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "The file is empty." }] }
  }

  const allFields = lines.map(splitCsvLine)
  const headerMap = detectHeaderMapping(allFields[0])
  const dataRows = headerMap ? allFields.slice(1) : allFields

  return parseCatalogueRows(dataRows, headerMap ? 2 : 1, headerMap ?? DEFAULT_COLUMN_MAP)
}

/** Parses an uploaded .xlsx workbook's first sheet the same way parseCatalogueCsv parses
 *  a .csv file — same columns (see HEADERS), same per-row validation, so the "Upload CSV"
 *  flow doesn't need to know or care which format the user actually picked. */
export function parseCatalogueXlsx(data: ArrayBuffer): CsvParseResult {
  let sheetRows: unknown[][]
  try {
    const workbook = XLSX.read(data, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined
    if (!sheet) return { rows: [], errors: [{ row: 0, message: "The file has no sheets." }] }
    sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false })
  } catch {
    return { rows: [], errors: [{ row: 0, message: "Could not read this file as an Excel workbook." }] }
  }

  if (sheetRows.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "The file is empty." }] }
  }

  // Cells come back typed (numbers as numbers, etc.) — stringify so the same positional
  // validation logic that handles raw CSV text fields works unchanged here too.
  const allFields = sheetRows.map((row) => row.map((cell) => (cell === null || cell === undefined ? "" : String(cell))))
  const headerMap = detectHeaderMapping(allFields[0])
  const dataRows = headerMap ? allFields.slice(1) : allFields

  return parseCatalogueRows(dataRows, headerMap ? 2 : 1, headerMap ?? DEFAULT_COLUMN_MAP)
}
