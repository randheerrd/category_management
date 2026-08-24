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

/** Row-array validation shared by both formats — CSV hands it string[] split from each
 *  text line, XLSX hands it string[] read straight off each sheet row. Whichever format
 *  got us here, from this point on a "row" is just 8 positional string fields. */
function parseCatalogueRows(dataRows: string[][], rowNumberOffset: number): CsvParseResult {
  const rows: CsvRow[] = []
  const errors: CsvRowError[] = []

  dataRows.forEach((fields, index) => {
    const rowNumber = index + rowNumberOffset
    const [category, name, priceRaw, mrpRaw, weightRaw, platform, stockRaw, statusRaw] = fields

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

/** True when a row of cells is the header row — same column names as HEADERS, regardless
 *  of case. Used to skip it whether it came from a CSV line or an XLSX sheet row. */
function looksLikeHeaderRow(fields: string[]): boolean {
  const expectedHeader = HEADERS.map((h) => h.toLowerCase())
  return expectedHeader.every((h, i) => (fields[i] ?? "").trim().toLowerCase() === h)
}

/** Parses a CSV file's text into catalogue rows, collecting per-row validation errors rather than throwing. */
export function parseCatalogueCsv(text: string): CsvParseResult {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "The file is empty." }] }
  }

  const allFields = lines.map(splitCsvLine)
  const hasHeader = looksLikeHeaderRow(allFields[0])
  const dataRows = hasHeader ? allFields.slice(1) : allFields

  return parseCatalogueRows(dataRows, hasHeader ? 2 : 1)
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
  const hasHeader = looksLikeHeaderRow(allFields[0])
  const dataRows = hasHeader ? allFields.slice(1) : allFields

  return parseCatalogueRows(dataRows, hasHeader ? 2 : 1)
}
