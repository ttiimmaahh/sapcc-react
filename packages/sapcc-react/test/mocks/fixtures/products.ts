import { faker } from '@faker-js/faker'
import { createPrice, createImage, createPagination } from './common'
import type {
  Product,
  Review,
  Suggestion,
  ProductReference,
  ProductSearchPage,
  ReviewList,
  SuggestionList,
  ProductReferenceList,
  ProductStockResponse,
  Facet,
  Sort,
} from '../../../src/product/product.types'

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    code: faker.string.alphanumeric(8),
    name: faker.commerce.productName(),
    summary: faker.commerce.productDescription(),
    description: faker.lorem.paragraphs(2),
    url: `/p/${faker.string.alphanumeric(8)}`,
    price: createPrice(),
    images: [
      createImage({ imageType: 'PRIMARY', format: 'product' }),
      createImage({ imageType: 'PRIMARY', format: 'thumbnail' }),
      createImage({ imageType: 'GALLERY', format: 'product' }),
    ],
    stock: {
      stockLevelStatus: 'inStock',
      stockLevel: faker.number.int({ min: 1, max: 500 }),
    },
    purchasable: true,
    availableForPickup: false,
    averageRating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    numberOfReviews: faker.number.int({ min: 0, max: 200 }),
    categories: [
      { code: faker.string.alphanumeric(4), name: faker.commerce.department() },
    ],
    ...overrides,
  }
}

export function createOutOfStockProduct(
  overrides: Partial<Product> = {},
): Product {
  return createProduct({
    stock: { stockLevelStatus: 'outOfStock', stockLevel: 0 },
    purchasable: false,
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// Search results
// ---------------------------------------------------------------------------

export function createSearchResults(
  overrides: {
    query?: string
    page?: number
    pageSize?: number
    totalResults?: number
    productCount?: number
  } = {},
): ProductSearchPage {
  const totalResults =
    overrides.totalResults ?? faker.number.int({ min: 10, max: 200 })
  const pageSize = overrides.pageSize ?? 20
  const currentPage = overrides.page ?? 0
  const productCount =
    overrides.productCount ?? Math.min(pageSize, totalResults)

  return {
    freeTextSearch: overrides.query ?? '',
    currentQuery: { query: overrides.query ?? '' },
    pagination: {
      ...createPagination({
        currentPage,
        pageSize,
        totalPages: Math.ceil(totalResults / pageSize),
        totalResults,
      }),
    },
    products: Array.from({ length: productCount }, () => createProduct()),
    sorts: createDefaultSorts(),
    facets: createDefaultFacets(),
  }
}

function createDefaultSorts(): Sort[] {
  return [
    { code: 'relevance', name: 'Relevance', selected: true },
    { code: 'topRated', name: 'Top Rated', selected: false },
    { code: 'name-asc', name: 'Name (ascending)', selected: false },
    { code: 'name-desc', name: 'Name (descending)', selected: false },
    { code: 'price-asc', name: 'Price (lowest first)', selected: false },
    { code: 'price-desc', name: 'Price (highest first)', selected: false },
  ]
}

function createDefaultFacets(): Facet[] {
  return [
    {
      name: 'Category',
      category: true,
      multiSelect: false,
      priority: 100,
      visible: true,
      values: [
        {
          code: 'cameras',
          name: 'Cameras',
          count: 42,
          selected: false,
          query: { query: ':relevance:category:cameras' },
        },
      ],
    },
    {
      name: 'Brand',
      category: false,
      multiSelect: true,
      priority: 90,
      visible: true,
      values: [
        {
          code: 'sony',
          name: 'Sony',
          count: 15,
          selected: false,
          query: { query: ':relevance:brand:sony' },
        },
        {
          code: 'canon',
          name: 'Canon',
          count: 12,
          selected: false,
          query: { query: ':relevance:brand:canon' },
        },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export function createReview(overrides: Partial<Review> = {}): Review {
  return {
    id: faker.string.uuid(),
    headline: faker.lorem.sentence({ min: 3, max: 8 }),
    comment: faker.lorem.paragraph(),
    rating: faker.number.int({ min: 1, max: 5 }),
    date: faker.date.past().toISOString(),
    principal: {
      name: faker.person.fullName(),
      uid: faker.internet.email(),
    },
    ...overrides,
  }
}

export function createReviewList(
  count = 3,
  overrides: Partial<Review> = {},
): ReviewList {
  return {
    reviews: Array.from({ length: count }, () => createReview(overrides)),
  }
}

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

export function createSuggestion(
  overrides: Partial<Suggestion> = {},
): Suggestion {
  return {
    value: faker.commerce.productName(),
    ...overrides,
  }
}

export function createSuggestionList(count = 5): SuggestionList {
  return {
    suggestions: Array.from({ length: count }, () => createSuggestion()),
  }
}

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------

export function createProductReference(
  overrides: Partial<ProductReference> = {},
): ProductReference {
  return {
    referenceType: 'SIMILAR',
    preselected: false,
    quantity: 1,
    target: createProduct(),
    ...overrides,
  }
}

export function createProductReferenceList(
  count = 3,
  overrides: Partial<ProductReference> = {},
): ProductReferenceList {
  return {
    references: Array.from({ length: count }, () =>
      createProductReference(overrides),
    ),
  }
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export function createProductStock(
  overrides: Partial<ProductStockResponse> = {},
): ProductStockResponse {
  return {
    stockLevelStatus: 'inStock',
    stockLevel: faker.number.int({ min: 1, max: 500 }),
    ...overrides,
  }
}
