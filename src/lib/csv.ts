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

const stockValues: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"]
const statusValues: CategoryStatus[] = ["Active", "Planning", "Discontinued"]

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

/** Parses a CSV file's text into catalogue rows, collecting per-row validation errors rather than throwing. */
export function parseCatalogueCsv(text: string): CsvParseResult {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0)
  const rows: CsvRow[] = []
  const errors: CsvRowError[] = []

  if (lines.length === 0) {
    return { rows, errors: [{ row: 0, message: "The file is empty." }] }
  }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
  const expectedHeader = HEADERS.map((h) => h.toLowerCase())
  const looksLikeHeader = expectedHeader.every((h, i) => header[i] === h)
  const dataLines = looksLikeHeader ? lines.slice(1) : lines

  dataLines.forEach((line, index) => {
    const rowNumber = index + (looksLikeHeader ? 2 : 1)
    const fields = splitCsvLine(line)
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

    const stock = stockValues.includes(stockRaw as StockStatus) ? (stockRaw as StockStatus) : "In Stock"
    const status = statusValues.includes(statusRaw as CategoryStatus) ? (statusRaw as CategoryStatus) : "Active"

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
