/**
 * Product normalizers — transform raw OCC product responses into cleaner models.
 *
 * OCC responses are deeply nested and sometimes inconsistent. Normalizers provide:
 * - Consistent defaults for optional fields
 * - Primary image extraction from the images array
 * - Price display helpers
 * - Search result product normalization
 *
 * All normalizers are pure functions (no side effects).
 */

import type { Product, Image, Price, Review, ProductSearchPage } from './product.types'

// ---------------------------------------------------------------------------
// Normalized types — cleaner versions of the OCC types
// ---------------------------------------------------------------------------

/** Normalized product with guaranteed defaults and helper fields */
export interface NormalizedProduct {
  code: string
  name: string
  summary: string
  description: string
  url: string

  // Price
  price: Price | null
  formattedPrice: string

  // Media
  primaryImage: Image | null
  images: Image[]

  // Stock
  inStock: boolean
  stockLevel: number | null
  purchasable: boolean

  // Reviews
  averageRating: number
  numberOfReviews: number

  // Categorization
  categories: { code: string; name: string }[]

  // Variant info
  hasVariants: boolean
  baseProduct: string | null
}

/** Normalized review with consistent date handling */
export interface NormalizedReview {
  id: string
  headline: string
  comment: string
  rating: number
  author: string
  date: string | null
}

// ---------------------------------------------------------------------------
// Normalizer functions
// ---------------------------------------------------------------------------

/**
 * Extracts the primary image from a product's image array.
 * Prefers PRIMARY imageType in 'product' format, falls back to first available.
 */
export function extractPrimaryImage(images?: Image[]): Image | null {
  if (!images?.length) return null

  // Prefer PRIMARY imageType with 'product' format
  const primary = images.find(
    (img) => img.imageType === 'PRIMARY' && img.format === 'product',
  )
  if (primary) return primary

  // Fall back to any PRIMARY image
  const anyPrimary = images.find((img) => img.imageType === 'PRIMARY')
  if (anyPrimary) return anyPrimary

  // Fall back to first image
  return images[0] ?? null
}

/**
 * Normalizes a raw OCC product response into a cleaner model.
 *
 * @param product - Raw OCC product object
 * @returns Normalized product with guaranteed defaults
 */
export function normalizeProduct(product: Product): NormalizedProduct {
  const stockStatus = product.stock?.stockLevelStatus ?? 'outOfStock'
  const inStock = stockStatus === 'inStock' || stockStatus === 'lowStock'

  return {
    code: product.code,
    name: product.name,
    summary: product.summary ?? '',
    description: product.description ?? '',
    url: product.url ?? '',

    // Price
    price: product.price ?? null,
    formattedPrice: product.price?.formattedValue ?? '',

    // Media
    primaryImage: extractPrimaryImage(product.images),
    images: product.images ?? [],

    // Stock
    inStock,
    stockLevel: product.stock?.stockLevel ?? null,
    purchasable: product.purchasable ?? inStock,

    // Reviews
    averageRating: product.averageRating ?? 0,
    numberOfReviews: product.numberOfReviews ?? 0,

    // Categories
    categories: (product.categories ?? []).map((cat) => ({
      code: cat.code,
      name: cat.name ?? '',
    })),

    // Variants
    hasVariants:
      (product.baseOptions != null && product.baseOptions.length > 0) ||
      (product.variantOptions != null && product.variantOptions.length > 0),
    baseProduct: product.baseProduct ?? null,
  }
}

/**
 * Normalizes a product review.
 */
export function normalizeReview(review: Review): NormalizedReview {
  return {
    id: review.id ?? '',
    headline: review.headline,
    comment: review.comment,
    rating: review.rating,
    author: review.principal?.name ?? review.alias ?? 'Anonymous',
    date: review.date ?? null,
  }
}

/**
 * Normalizes all products in a search result page.
 * Leaves the rest of the search metadata (facets, pagination, sorts) intact.
 */
export function normalizeSearchResults(page: ProductSearchPage): ProductSearchPage & {
  normalizedProducts: NormalizedProduct[]
} {
  return {
    ...page,
    normalizedProducts: page.products.map(normalizeProduct),
  }
}
