/** Same tag look used on the category card's header — reused here so status reads the
 *  same way everywhere a category shows up, not just on its own card. */
const categoryStatusTagClasses: Record<string, string> = {
  Active: "bg-emerald-600/5 border-emerald-600/10 text-emerald-800",
  Planning: "bg-indigo-600/5 border-indigo-600/10 text-indigo-800",
  Discontinued: "bg-slate-600/5 border-slate-600/10 text-slate-700",
}

/** Custom statuses (beyond the 3 built-ins) fall back to this neutral look instead of
 *  rendering unstyled. */
const fallbackStatusTagClass = "bg-stone-500/5 border-stone-500/10 text-stone-800"

export function categoryStatusTagClass(status: string) {
  return categoryStatusTagClasses[status] ?? fallbackStatusTagClass
}

/** A category's status ("Active" / "Planning" / "Discontinued" / custom), as the same
 *  pill used on the category card — dropped next to a category's name in pickers too,
 *  so it's clear at a glance which categories are actually live before you pin/move
 *  something into one. */
export function CategoryStatusTag({ status }: { status: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md border-[0.5px] px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap ${categoryStatusTagClass(status)}`}
    >
      {status}
    </span>
  )
}
