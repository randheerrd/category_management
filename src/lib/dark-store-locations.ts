import { channelNames } from "@/lib/catalogue-data"

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

// Limited to Delhi NCR only, per request — every channel runs stores here.
const citiesByChannel: Record<string, string[]> = {
  "Amazon Now": ["Delhi NCR"],
  Blinkit: ["Delhi NCR"],
  BigBasket: ["Delhi NCR"],
  Instamart: ["Delhi NCR"],
  Zepto: ["Delhi NCR"],
}

const areasByCity: Record<string, string[]> = {
  "Delhi NCR": ["Connaught Place", "Gurugram", "Noida", "Dwarka", "Rohini", "Saket"],
}

/** Two stores per city per channel, cycling through that city's named areas — offset by
 *  the channel's own index so different channels land on different areas. */
export const darkStoreLocations: DarkStoreLocation[] = channelNames.flatMap((channel, channelIndex) =>
  (citiesByChannel[channel] ?? []).flatMap((city) => {
    const areas = areasByCity[city] ?? [city]
    return [0, 1].map((i) => {
      const area = areas[(channelIndex * 2 + i) % areas.length]
      return {
        id: `${channel}-${city}-${area}`.replace(/\s+/g, "-").toLowerCase(),
        name: `${area} · ${channel}`,
        city,
        channel,
      }
    })
  })
)

export const darkStoreCities = [...new Set(darkStoreLocations.map((l) => l.city))]
