// Deterministic tag color per category name — no per-category color is stored anywhere,
// so this hashes the name to pick a consistent swatch across renders. Shared by the SKU
// table's category badges and the Filters drawer's category checklist dots.

export const categoryTagClasses = [
  "border-emerald-600/10 bg-emerald-600/5 text-emerald-800",
  "border-blue-600/10 bg-blue-600/5 text-blue-800",
  "border-amber-600/10 bg-amber-600/5 text-amber-800",
  "border-rose-600/10 bg-rose-600/5 text-rose-800",
  "border-violet-600/10 bg-violet-600/5 text-violet-800",
  "border-cyan-600/10 bg-cyan-600/5 text-cyan-800",
  "border-orange-600/10 bg-orange-600/5 text-orange-800",
  "border-teal-600/10 bg-teal-600/5 text-teal-800",
]

/** Solid dot colors, index-aligned with categoryTagClasses. */
export const categoryDotClasses = [
  "bg-emerald-600",
  "bg-blue-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-violet-600",
  "bg-cyan-600",
  "bg-orange-600",
  "bg-teal-600",
]

function hashName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return hash % categoryTagClasses.length
}

export function categoryTagClass(name: string) {
  return categoryTagClasses[hashName(name)]
}

export function categoryDotClass(name: string) {
  return categoryDotClasses[hashName(name)]
}
