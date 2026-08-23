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

/** The full flavour range, in the order they should be pinned onto the board. */
export const products: Product[] = [
  product("lays_classic_salted.jpg", "Lay's Classic Salted", 20, 140),
  product("lays_american_style_cream_onion.jpg", "American Style Cream & Onion", 20, 140),
  product("lays_american_style_cream_onion_50.jpg", "American Style Cream & Onion", 10, 50),
  product("lays_indias_magic_masala.jpg", "India's Magic Masala", 20, 140),
  product("lays_indias_magic_masala_50.jpg", "India's Magic Masala", 10, 50),
  product("lays_spanish_tomato_tango.jpg", "Spanish Tomato Tango", 20, 140),
  product("lays_spanish_tomato_tango_50.jpg", "Spanish Tomato Tango", 10, 50),
  product("lays_chile_limon.jpg", "Chile Limón", 20, 140),
  product("lays_korean_chilli.jpg", "Korean Chilli", 20, 140),
  product("lays_wavy_cream_onion.jpg", "Wavy Cream & Onion", 30, 90),
  product("lays_west_indies_hot_sweet_chilli.jpg", "West Indies Hot & Sweet Chilli", 20, 140),
  product("lays_himalayan_pink_salt_wafer.jpg", "Himalayan Pink Salt Wafer", 20, 140),
  product("lays_gourmet_lime_cracked_pepper.jpg", "Gourmet Lime & Cracked Pepper", 99, 113),
  product("lays_gourmet_thai_sweet_chilli.jpg", "Gourmet Thai Sweet Chilli", 99, 113),
  product("lays_gourmet_vintage_cheese_paprika.jpg", "Gourmet Vintage Cheese & Paprika", 99, 113),
  product("lays_maxx_macho_chilli.jpg", "Maxx Macho Chilli", 20, 52),
  product("lays_maxx_peppery_cheddar.jpg", "Maxx Peppery Cheddar", 20, 52),
  product("lays_maxx_sizzling_barbeque.jpg", "Maxx Sizzling Barbeque", 20, 52),
]

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
