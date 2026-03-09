import { describe, it, expect } from 'vitest'
import {
  normalizeProduct,
  normalizeReview,
  normalizeSearchResults,
  extractPrimaryImage,
} from '../product.normalizers'
import type { Product, Image, Review, ProductSearchPage } from '../product.types'
import { createProduct, createSearchResults, createReview } from '../../../test/mocks/fixtures/products'

// ---------------------------------------------------------------------------
// extractPrimaryImage
// ---------------------------------------------------------------------------

describe('extractPrimaryImage', () => {
  it('returns null for undefined images', () => {
    expect(extractPrimaryImage(undefined)).toBeNull()
  })

  it('returns null for empty array', () => {
    expect(extractPrimaryImage([])).toBeNull()
  })

  it('prefers PRIMARY imageType with product format', () => {
    const images: Image[] = [
      { url: '/gallery.jpg', imageType: 'GALLERY', format: 'product' },
      { url: '/thumb.jpg', imageType: 'PRIMARY', format: 'thumbnail' },
      { url: '/primary-product.jpg', imageType: 'PRIMARY', format: 'product' },
    ]

    const result = extractPrimaryImage(images)
    expect(result?.url).toBe('/primary-product.jpg')
  })

  it('falls back to any PRIMARY image when product format not available', () => {
    const images: Image[] = [
      { url: '/gallery.jpg', imageType: 'GALLERY', format: 'product' },
      { url: '/primary-thumb.jpg', imageType: 'PRIMARY', format: 'thumbnail' },
    ]

    const result = extractPrimaryImage(images)
    expect(result?.url).toBe('/primary-thumb.jpg')
  })

  it('falls back to first image when no PRIMARY images', () => {
    const images: Image[] = [
      { url: '/gallery1.jpg', imageType: 'GALLERY', format: 'product' },
      { url: '/gallery2.jpg', imageType: 'GALLERY', format: 'thumbnail' },
    ]

    const result = extractPrimaryImage(images)
    expect(result?.url).toBe('/gallery1.jpg')
  })
})

// ---------------------------------------------------------------------------
// normalizeProduct
// ---------------------------------------------------------------------------

describe('normalizeProduct', () => {
  it('maps all required fields from a full product', () => {
    const product = createProduct({
      code: 'CAM001',
      name: 'Test Camera',
      summary: 'A great camera',
      description: 'Detailed description',
      url: '/p/CAM001',
    })

    const result = normalizeProduct(product)

    expect(result.code).toBe('CAM001')
    expect(result.name).toBe('Test Camera')
    expect(result.summary).toBe('A great camera')
    expect(result.description).toBe('Detailed description')
    expect(result.url).toBe('/p/CAM001')
  })

  it('provides empty string defaults for missing optional text fields', () => {
    const product: Product = { code: 'MIN', name: 'Minimal' }

    const result = normalizeProduct(product)

    expect(result.summary).toBe('')
    expect(result.description).toBe('')
    expect(result.url).toBe('')
    expect(result.formattedPrice).toBe('')
  })

  it('extracts price and formattedPrice from the product', () => {
    const product = createProduct({
      price: {
        currencyIso: 'USD',
        value: 99.99,
        formattedValue: '$99.99',
      },
    })

    const result = normalizeProduct(product)

    expect(result.price).toEqual({
      currencyIso: 'USD',
      value: 99.99,
      formattedValue: '$99.99',
    })
    expect(result.formattedPrice).toBe('$99.99')
  })

  it('sets price to null when not present', () => {
    const product: Product = { code: 'NO_PRICE', name: 'No Price' }

    const result = normalizeProduct(product)

    expect(result.price).toBeNull()
    expect(result.formattedPrice).toBe('')
  })

  it('extracts primaryImage from images array', () => {
    const product = createProduct() // fixture includes PRIMARY+product image

    const result = normalizeProduct(product)

    expect(result.primaryImage).not.toBeNull()
    expect(result.primaryImage?.imageType).toBe('PRIMARY')
    expect(result.images.length).toBeGreaterThan(0)
  })

  it('defaults images to empty array when not present', () => {
    const product: Product = { code: 'NO_IMG', name: 'No Images' }

    const result = normalizeProduct(product)

    expect(result.primaryImage).toBeNull()
    expect(result.images).toEqual([])
  })

  it('converts inStock stockLevelStatus to inStock: true', () => {
    const product = createProduct({
      stock: { stockLevelStatus: 'inStock', stockLevel: 100 },
    })

    const result = normalizeProduct(product)

    expect(result.inStock).toBe(true)
    expect(result.stockLevel).toBe(100)
  })

  it('converts lowStock stockLevelStatus to inStock: true', () => {
    const product = createProduct({
      stock: { stockLevelStatus: 'lowStock', stockLevel: 3 },
    })

    const result = normalizeProduct(product)

    expect(result.inStock).toBe(true)
    expect(result.stockLevel).toBe(3)
  })

  it('converts outOfStock stockLevelStatus to inStock: false', () => {
    const product = createProduct({
      stock: { stockLevelStatus: 'outOfStock', stockLevel: 0 },
    })

    const result = normalizeProduct(product)

    expect(result.inStock).toBe(false)
    expect(result.stockLevel).toBe(0)
  })

  it('defaults stock to out of stock when not present', () => {
    const product: Product = { code: 'NO_STOCK', name: 'No Stock' }

    const result = normalizeProduct(product)

    expect(result.inStock).toBe(false)
    expect(result.stockLevel).toBeNull()
    expect(result.purchasable).toBe(false)
  })

  it('uses explicit purchasable flag when provided', () => {
    const product = createProduct({
      stock: { stockLevelStatus: 'outOfStock' },
      purchasable: true, // override — product is purchasable despite out of stock
    })

    const result = normalizeProduct(product)

    expect(result.inStock).toBe(false)
    expect(result.purchasable).toBe(true)
  })

  it('maps categories with defaults for missing names', () => {
    const product = createProduct({
      categories: [
        { code: 'cameras', name: 'Cameras' },
        { code: 'digital' }, // no name
      ],
    })

    const result = normalizeProduct(product)

    expect(result.categories).toEqual([
      { code: 'cameras', name: 'Cameras' },
      { code: 'digital', name: '' },
    ])
  })

  it('detects variants from baseOptions', () => {
    const product = createProduct({
      baseOptions: [
        {
          variantType: 'ApparelSizeVariantProduct',
          selected: { code: 'S', variantOptionQualifiers: [] },
          options: [
            { code: 'S', variantOptionQualifiers: [] },
            { code: 'M', variantOptionQualifiers: [] },
          ],
        },
      ],
    })

    const result = normalizeProduct(product)

    expect(result.hasVariants).toBe(true)
  })

  it('detects variants from variantOptions', () => {
    const product = createProduct({
      variantOptions: [
        { code: 'RED', variantOptionQualifiers: [] },
        { code: 'BLUE', variantOptionQualifiers: [] },
      ],
    })

    const result = normalizeProduct(product)

    expect(result.hasVariants).toBe(true)
  })

  it('sets hasVariants false when no variant info present', () => {
    const product: Product = { code: 'SIMPLE', name: 'Simple' }

    const result = normalizeProduct(product)

    expect(result.hasVariants).toBe(false)
    expect(result.baseProduct).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// normalizeReview
// ---------------------------------------------------------------------------

describe('normalizeReview', () => {
  it('maps review fields correctly', () => {
    const review = createReview({
      id: 'rev-1',
      headline: 'Great product',
      comment: 'Really loved it',
      rating: 5,
      date: '2024-01-15T10:00:00Z',
      principal: { name: 'John Doe', uid: 'john@example.com' },
    })

    const result = normalizeReview(review)

    expect(result.id).toBe('rev-1')
    expect(result.headline).toBe('Great product')
    expect(result.comment).toBe('Really loved it')
    expect(result.rating).toBe(5)
    expect(result.date).toBe('2024-01-15T10:00:00Z')
    expect(result.author).toBe('John Doe')
  })

  it('uses principal.name as author when available', () => {
    const review: Review = {
      headline: 'Test',
      comment: 'Test comment',
      rating: 3,
      principal: { name: 'Jane Smith' },
    }

    const result = normalizeReview(review)

    expect(result.author).toBe('Jane Smith')
  })

  it('falls back to alias when principal is missing', () => {
    const review: Review = {
      headline: 'Test',
      comment: 'Test comment',
      rating: 3,
      alias: 'camera_fan_2024',
    }

    const result = normalizeReview(review)

    expect(result.author).toBe('camera_fan_2024')
  })

  it('falls back to Anonymous when both principal and alias are missing', () => {
    const review: Review = {
      headline: 'Test',
      comment: 'Test comment',
      rating: 3,
    }

    const result = normalizeReview(review)

    expect(result.author).toBe('Anonymous')
  })

  it('defaults id to empty string and date to null when missing', () => {
    const review: Review = {
      headline: 'Test',
      comment: 'Comment',
      rating: 4,
    }

    const result = normalizeReview(review)

    expect(result.id).toBe('')
    expect(result.date).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// normalizeSearchResults
// ---------------------------------------------------------------------------

describe('normalizeSearchResults', () => {
  it('passes through search metadata and normalizes products', () => {
    const searchPage = createSearchResults({
      query: 'camera',
      totalResults: 5,
      productCount: 3,
    })

    const result = normalizeSearchResults(searchPage)

    // Metadata preserved
    expect(result.freeTextSearch).toBe('camera')
    expect(result.pagination.totalResults).toBe(5)
    expect(result.products).toHaveLength(3)
    expect(result.sorts).toBeDefined()
    expect(result.facets).toBeDefined()

    // Normalized products added
    expect(result.normalizedProducts).toHaveLength(3)
    expect(result.normalizedProducts[0]).toHaveProperty('code')
    expect(result.normalizedProducts[0]).toHaveProperty('formattedPrice')
    expect(result.normalizedProducts[0]).toHaveProperty('inStock')
    expect(result.normalizedProducts[0]).toHaveProperty('primaryImage')
  })

  it('returns empty normalizedProducts for search with no results', () => {
    const searchPage: ProductSearchPage = {
      freeTextSearch: 'nonexistent',
      currentQuery: { query: 'nonexistent' },
      pagination: {
        currentPage: 0,
        pageSize: 20,
        sort: 'relevance',
        totalPages: 0,
        totalResults: 0,
      },
      products: [],
      sorts: [],
    }

    const result = normalizeSearchResults(searchPage)

    expect(result.normalizedProducts).toEqual([])
    expect(result.products).toEqual([])
  })
})
