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

const citiesByChannel: Record<string, string[]> = {
  "Amazon Now": ["Mumbai", "Bengaluru", "Delhi NCR", "Hyderabad"],
  Blinkit: ["Mumbai", "Delhi NCR", "Bengaluru", "Pune", "Chennai"],
  BigBasket: ["Bengaluru", "Hyderabad", "Chennai", "Mumbai"],
  Instamart: ["Hyderabad", "Bengaluru", "Delhi NCR", "Pune"],
  Zepto: ["Mumbai", "Delhi NCR", "Bengaluru"],
}

const areasByCity: Record<string, string[]> = {
  Mumbai: ["Andheri", "Bandra", "Powai", "Malad"],
  Bengaluru: ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout"],
  "Delhi NCR": ["Connaught Place", "Gurugram", "Noida", "Dwarka"],
  Hyderabad: ["Gachibowli", "Banjara Hills", "Kondapur"],
  Pune: ["Kothrud", "Viman Nagar", "Hinjewadi"],
  Chennai: ["Anna Nagar", "T Nagar", "Velachery"],
}

/** Two stores per city per channel, cycling through that city's named areas. */
export const darkStoreLocations: DarkStoreLocation[] = channelNames.flatMap((channel) =>
  (citiesByChannel[channel] ?? []).flatMap((city, cityIndex) => {
    const areas = areasByCity[city] ?? [city]
    return [0, 1].map((i) => {
      const area = areas[(cityIndex + i) % areas.length]
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
