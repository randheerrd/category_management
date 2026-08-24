/** A single physical dark store, for the Filters drawer's "Dark Store" picker.
 *  The per-SKU coverage data (darkStoreAvailability) only tracks filled/total per
 *  channel, not per physical location, so picking specific stores here filters by
 *  their parent channel(s) — this list exists to make browsing/searching realistic,
 *  not to add per-location inventory. */
export interface DarkStoreLocation {
  id: string
  name: string
  city: string
  channel: string
}

/** Delhi NCR, broken out by sub-city — coverage is intentionally uneven (Faridabad and
 *  Meerut only have one channel each) rather than every channel appearing everywhere. */
const rawLocations: { city: string; channel: string; area: string }[] = [
  { city: "Gurugram", channel: "Blinkit", area: "DLF Phase 3" },
  { city: "Gurugram", channel: "Zepto", area: "Sector 29" },
  { city: "Gurugram", channel: "Instamart", area: "Sohna Road" },
  { city: "Gurugram", channel: "Amazon Now", area: "Cyber City" },
  { city: "Gurugram", channel: "BigBasket", area: "Sector 14" },

  { city: "Noida", channel: "Blinkit", area: "Sector 62" },
  { city: "Noida", channel: "Zepto", area: "Sector 18" },
  { city: "Noida", channel: "Instamart", area: "Sector 137" },
  { city: "Noida", channel: "Amazon Now", area: "Sector 18" },
  { city: "Noida", channel: "BigBasket", area: "Sector 50" },

  { city: "Delhi", channel: "Blinkit", area: "Lajpat Nagar" },
  { city: "Delhi", channel: "Blinkit", area: "Connaught Place" },
  { city: "Delhi", channel: "Zepto", area: "Karol Bagh" },
  { city: "Delhi", channel: "Instamart", area: "Dwarka" },
  { city: "Delhi", channel: "Amazon Now", area: "Rohini" },
  { city: "Delhi", channel: "BigBasket", area: "Saket" },

  { city: "Faridabad", channel: "Blinkit", area: "Sector 15" },

  { city: "Meerut", channel: "Zepto", area: "Meerut Cantt" },
]

export const darkStoreLocations: DarkStoreLocation[] = rawLocations.map(({ city, channel, area }) => ({
  id: `${channel}-${city}-${area}`.replace(/\s+/g, "-").toLowerCase(),
  name: `${channel} — ${area}`,
  city,
  channel,
}))

export const darkStoreCities = [...new Set(darkStoreLocations.map((l) => l.city))]
