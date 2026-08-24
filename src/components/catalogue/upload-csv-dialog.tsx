import { useEffect, useRef, useState, type DragEvent } from "react"
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertTriangle } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { parseCatalogueCsv, parseCatalogueXlsx, type CsvRowError } from "@/lib/csv"
import { useCatalogue } from "@/lib/catalogue-context"

type Step = "idle" | "uploading" | "success" | "error"

interface ImportSummary {
  skusImported: number
  categoriesCreated: number
  categoriesUpdated: number
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

/**
 * "Upload CSV" flow — a single dialog that walks through four states:
 * pick a file, upload progress, then either a success summary or a row-level error report.
 */
interface UploadCsvDialogProps {
  /** Called once the user dismisses a successful import (e.g. to leave onboarding for the board). */
  onImported?: () => void
}

export function UploadCsvDialog({ onImported }: UploadCsvDialogProps) {
  const { uploadCsvOpen, closeUploadCsv, importCsvRows } = useCatalogue()

  const [step, setStep] = useState<Step>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState<CsvRowError[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!uploadCsvOpen) return
    setStep("idle")
    setFile(null)
    setProgress(0)
    setDragOver(false)
    setErrors([])
    setSummary(null)
  }, [uploadCsvOpen])

  const isXlsx = (picked: File) =>
    /\.xlsx$/i.test(picked.name) ||
    picked.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  const isCsv = (picked: File) => /\.csv$/i.test(picked.name) || picked.type === "text/csv"

  const pickFile = (picked: File | undefined) => {
    if (!picked) return
    if (!isCsv(picked) && !isXlsx(picked)) return
    setFile(picked)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    pickFile(e.dataTransfer.files[0])
  }

  const startUpload = () => {
    if (!file) return
    setStep("uploading")
    setProgress(0)

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 12 + Math.random() * 10
        if (next >= 100) {
          clearInterval(timer)
          finishUpload()
          return 100
        }
        return next
      })
    }, 120)
  }

  const finishUpload = () => {
    if (!file) return
    const reader = new FileReader()
    const xlsx = isXlsx(file)

    reader.onload = () => {
      const { rows, errors: parseErrors } = xlsx
        ? parseCatalogueXlsx(reader.result as ArrayBuffer)
        : parseCatalogueCsv(String(reader.result ?? ""))

      if (parseErrors.length > 0) {
        setErrors(parseErrors)
        setStep("error")
        return
      }

      const result = importCsvRows(rows)
      setSummary(result)
      setStep("success")
    }
    reader.onerror = () => {
      setErrors([{ row: 0, message: "Could not read the file. Please try again." }])
      setStep("error")
    }
    // .xlsx is a binary (zip) format — needs to come in as bytes, not decoded as text.
    if (xlsx) reader.readAsArrayBuffer(file)
    else reader.readAsText(file)
  }

  const reset = () => {
    setStep("idle")
    setFile(null)
    setProgress(0)
    setErrors([])
  }

  return (
    <Dialog open={uploadCsvOpen} onOpenChange={(open) => !open && closeUploadCsv()}>
      <DialogContent className="rounded-[8px] sm:max-w-[520px]" showCloseButton>
        <DialogHeader>
          <DialogTitle>Upload CSV / XLSX</DialogTitle>
          <DialogDescription>Bulk-import SKUs into your catalogue from a spreadsheet.</DialogDescription>
        </DialogHeader>

        {/* Idle: pick a file */}
        {step === "idle" && (
          <div className="flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              <UploadCloud className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">.csv or .xlsx files only</p>
            </div>

            {file && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label="Remove file"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Uploading: fake progress while we read + parse the file */}
        {step === "uploading" && file && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                <Progress value={Math.min(progress, 100)} />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {Math.min(Math.round(progress), 100)}%
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground">Uploading and validating rows…</p>
          </div>
        )}

        {/* Success: summary of what was imported */}
        {step === "success" && summary && (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-foreground">Import complete</p>
              <p className="text-sm text-muted-foreground">
                {summary.skusImported} SKU{summary.skusImported === 1 ? "" : "s"} imported
                {summary.categoriesCreated > 0 &&
                  ` · ${summary.categoriesCreated} new categor${summary.categoriesCreated === 1 ? "y" : "ies"}`}
                {summary.categoriesUpdated > 0 &&
                  ` · ${summary.categoriesUpdated} existing categor${summary.categoriesUpdated === 1 ? "y" : "ies"} updated`}
              </p>
            </div>
          </div>
        )}

        {/* Error: row-level validation problems */}
        {step === "error" && (
          <div className="flex flex-col gap-3">
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>
                {errors.length} row{errors.length === 1 ? "" : "s"} failed validation
              </AlertTitle>
              <AlertDescription>Fix these and re-upload — nothing was imported.</AlertDescription>
            </Alert>
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-border p-2">
              {errors.slice(0, 8).map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {err.row > 0 && <Badge variant="secondary">Row {err.row}</Badge>}
                  <span className="text-muted-foreground">{err.message}</span>
                </div>
              ))}
              {errors.length > 8 && (
                <p className="px-1 text-xs text-muted-foreground">+{errors.length - 8} more</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-end gap-2">
          {step === "idle" && (
            <>
              <Button variant="outline" onClick={closeUploadCsv}>
                Cancel
              </Button>
              <Button onClick={startUpload} disabled={!file}>
                Upload
              </Button>
            </>
          )}
          {step === "uploading" && (
            <Button variant="outline" disabled>
              Uploading…
            </Button>
          )}
          {step === "success" && (
            <Button
              onClick={() => {
                closeUploadCsv()
                onImported?.()
              }}
            >
              Done
            </Button>
          )}
          {step === "error" && (
            <>
              <Button variant="outline" onClick={closeUploadCsv}>
                Cancel
              </Button>
              <Button onClick={reset}>Choose another file</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
