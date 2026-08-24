// Real Lay's creative packshots supplied for the catalogue — eagerly bundled so
// each SKU can reference its own product photo instead of one placeholder.
const images = import.meta.glob("../assets/products/*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>

function urlFor(filename: string): string {
  const entry = Object.entries(images).find(([path]) => path.endsWith(`/${filename}`))
  if (!entry) throw new Error(`Missing product image: ${filename}`)
  return entry[1]
}

export interface Product {
  name: string
  image: string
  price: number
  weightGrams: number
}

const product = (filename: string, name: string, price: number, weightGrams: number): Product => ({
  name,
  image: urlFor(filename),
  price,
  weightGrams,
})

/** One (weight, price) pack-size point. */
type SizePoint = [weightGrams: number, price: number]

interface FlavourSpec {
  name: string
  /** Packshot used for every size except an explicit `sizeImages` override. */
  image: string
  /** Per-flavour size × price ladder — real Indian retail sizes/pricing, denser for
   *  flagship flavours (more shelf presence) than niche ones, matching how an actual
   *  Lay's assortment fans out. */
  sizes: SizePoint[]
  /** Override the packshot for one specific weight (e.g. a dedicated small-pack photo). */
  sizeImages?: Record<number, string>
}

// Flagship classics get the widest size ladder (7 points) — these are the SKUs with the
// most shelf/channel presence in a real assortment.
const flagshipSizes: SizePoint[] = [
  [20, 10],
  [50, 20],
  [78, 30],
  [90, 35],
  [140, 50],
  [200, 70],
  [350, 120],
]

// Secondary classics — still core range, fewer size points (6).
const secondarySizes: SizePoint[] = [
  [30, 10],
  [52, 20],
  [78, 30],
  [90, 35],
  [140, 50],
  [200, 70],
]

// Gourmet — premium positioning, smaller packs, higher price-per-gram (6 points).
const gourmetSizes: SizePoint[] = [
  [52, 45],
  [78, 60],
  [90, 70],
  [113, 99],
  [150, 120],
  [200, 150],
]

// Maxx — youth-skewing spicy sub-brand, mid pricing, widest availability (8 points).
const maxxSizes: SizePoint[] = [
  [30, 10],
  [52, 20],
  [78, 30],
  [90, 35],
  [140, 50],
  [175, 60],
  [200, 70],
  [250, 80],
]

const flavours: FlavourSpec[] = [
  // Flagship classics (4 × 7 sizes = 28) — the three with a dedicated small-pack photo
  // use it for the 50g point, everything else falls back to the main packshot.
  { name: "Lay's Classic Salted", image: "lays_classic_salted.jpg", sizes: flagshipSizes },
  {
    name: "American Style Cream & Onion",
    image: "lays_american_style_cream_onion.jpg",
    sizes: flagshipSizes,
    sizeImages: { 50: "lays_american_style_cream_onion_50.jpg" },
  },
  {
    name: "India's Magic Masala",
    image: "lays_indias_magic_masala.jpg",
    sizes: flagshipSizes,
    sizeImages: { 50: "lays_indias_magic_masala_50.jpg" },
  },
  {
    name: "Spanish Tomato Tango",
    image: "lays_spanish_tomato_tango.jpg",
    sizes: flagshipSizes,
    sizeImages: { 50: "lays_spanish_tomato_tango_50.jpg" },
  },

  // Secondary classics (5 × 6 sizes = 30)
  { name: "Chile Limón", image: "lays_chile_limon.jpg", sizes: secondarySizes },
  { name: "Korean Chilli", image: "lays_korean_chilli.jpg", sizes: secondarySizes },
  { name: "West Indies Hot & Sweet Chilli", image: "lays_west_indies_hot_sweet_chilli.jpg", sizes: secondarySizes },
  { name: "Wavy Cream & Onion", image: "lays_wavy_cream_onion.jpg", sizes: secondarySizes },
  { name: "Himalayan Pink Salt Wafer", image: "lays_himalayan_pink_salt_wafer.jpg", sizes: secondarySizes },

  // Gourmet range (3 × 6 sizes = 18)
  { name: "Gourmet Lime & Cracked Pepper", image: "lays_gourmet_lime_cracked_pepper.jpg", sizes: gourmetSizes },
  { name: "Gourmet Thai Sweet Chilli", image: "lays_gourmet_thai_sweet_chilli.jpg", sizes: gourmetSizes },
  { name: "Gourmet Vintage Cheese & Paprika", image: "lays_gourmet_vintage_cheese_paprika.jpg", sizes: gourmetSizes },

  // Maxx range (3 × 8 sizes = 24)
  { name: "Maxx Macho Chilli", image: "lays_maxx_macho_chilli.jpg", sizes: maxxSizes },
  { name: "Maxx Peppery Cheddar", image: "lays_maxx_peppery_cheddar.jpg", sizes: maxxSizes },
  { name: "Maxx Sizzling Barbeque", image: "lays_maxx_sizzling_barbeque.jpg", sizes: maxxSizes },
]
// 28 + 30 + 18 + 24 = 100 SKUs across 15 real Lay's flavours.

/** The full flavour range, in the order they should be pinned onto the board. */
export const products: Product[] = flavours.flatMap((flavour) =>
  flavour.sizes.map(([weightGrams, price]) =>
    product(flavour.sizeImages?.[weightGrams] ?? flavour.image, flavour.name, price, weightGrams)
  )
)

const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

/**
 * Finds the real packshot for a SKU by name — exact match first, then the closest
 * substring match — so a name typed or imported (e.g. via CSV) gets its own real
 * photo instead of an arbitrary one. Returns `undefined` for genuinely unknown products.
 */
export function findProductImageByName(name: string): string | undefined {
  const target = normalize(name)
  if (!target) return undefined

  const exact = products.find((p) => normalize(p.name) === target)
  if (exact) return exact.image

  const partial = products.find((p) => {
    const candidate = normalize(p.name)
    return candidate.includes(target) || target.includes(candidate)
  })
  return partial?.image
}
