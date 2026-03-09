import { faker } from '@faker-js/faker'

interface MockPrice {
  currencyIso: string
  value: number
  formattedValue: string
}

interface MockImage {
  url: string
  altText: string
  format: 'product'
  imageType: 'PRIMARY'
}

interface MockPagination {
  currentPage: number
  pageSize: number
  sort: string
  totalPages: number
  totalResults: number
}

/** Creates a mock price object with optional overrides */
export function createPrice(overrides?: Partial<MockPrice>): MockPrice {
  return {
    currencyIso: 'USD',
    value: faker.number.float({ min: 1, max: 999, fractionDigits: 2 }),
    formattedValue: '',
    ...overrides,
  }
}

/** Creates a mock image object with optional overrides */
export function createImage(overrides?: Partial<MockImage>): MockImage {
  return {
    url: faker.image.url(),
    altText: faker.commerce.productName(),
    format: 'product' as const,
    imageType: 'PRIMARY' as const,
    ...overrides,
  }
}

/** Creates a mock pagination object with optional overrides */
export function createPagination(overrides?: Partial<MockPagination>): MockPagination {
  return {
    currentPage: 0,
    pageSize: 20,
    sort: 'relevance',
    totalPages: 1,
    totalResults: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  }
}
