import { describe, it, expectTypeOf } from 'vitest'
import type {
  Product,
  Price,
  Image,
  Stock,
  Category,
  ProductSearchPage,
  Pagination,
  Sort,
  Review,
  ReviewSubmission,
  ProductReferenceType,
  UseProductsOptions,
  UseProductOptions,
  UseProductReviewsOptions,
  UseProductSuggestionsOptions,
  UseProductReferencesOptions,
} from '../product.types'
import type {
  NormalizedProduct,
  NormalizedReview,
} from '../product.normalizers'
import { normalizeProduct, normalizeReview, extractPrimaryImage } from '../product.normalizers'

describe('Product type tests', () => {
  it('Product has required code and name fields', () => {
    expectTypeOf<Product>().toHaveProperty('code')
    expectTypeOf<Product['code']>().toBeString()
    expectTypeOf<Product>().toHaveProperty('name')
    expectTypeOf<Product['name']>().toBeString()
  })

  it('Product has optional price, images, stock fields', () => {
    expectTypeOf<Product['price']>().toEqualTypeOf<Price | undefined>()
    expectTypeOf<Product['images']>().toEqualTypeOf<Image[] | undefined>()
    expectTypeOf<Product['stock']>().toEqualTypeOf<Stock | undefined>()
    expectTypeOf<Product['categories']>().toEqualTypeOf<Category[] | undefined>()
  })

  it('Price has required currencyIso, value, formattedValue', () => {
    expectTypeOf<Price>().toHaveProperty('currencyIso')
    expectTypeOf<Price['currencyIso']>().toBeString()
    expectTypeOf<Price>().toHaveProperty('value')
    expectTypeOf<Price['value']>().toBeNumber()
    expectTypeOf<Price>().toHaveProperty('formattedValue')
    expectTypeOf<Price['formattedValue']>().toBeString()
  })

  it('ProductSearchPage has required products array and pagination', () => {
    expectTypeOf<ProductSearchPage['products']>().toEqualTypeOf<Product[]>()
    expectTypeOf<ProductSearchPage['pagination']>().toEqualTypeOf<Pagination>()
    expectTypeOf<ProductSearchPage['sorts']>().toEqualTypeOf<Sort[]>()
  })

  it('Review has required headline, comment, and rating', () => {
    expectTypeOf<Review['headline']>().toBeString()
    expectTypeOf<Review['comment']>().toBeString()
    expectTypeOf<Review['rating']>().toBeNumber()
    // Optional fields
    expectTypeOf<Review['id']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Review['date']>().toEqualTypeOf<string | undefined>()
  })

  it('ReviewSubmission matches expected shape for mutation payload', () => {
    expectTypeOf<ReviewSubmission>().toHaveProperty('headline')
    expectTypeOf<ReviewSubmission>().toHaveProperty('comment')
    expectTypeOf<ReviewSubmission>().toHaveProperty('rating')
    expectTypeOf<ReviewSubmission['alias']>().toEqualTypeOf<string | undefined>()
  })

  it('ProductReferenceType accepts known reference strings', () => {
    expectTypeOf<'SIMILAR'>().toExtend<ProductReferenceType>()
    expectTypeOf<'CROSSELLING'>().toExtend<ProductReferenceType>()
    expectTypeOf<'UPSELLING'>().toExtend<ProductReferenceType>()
    expectTypeOf<'ACCESSORIES'>().toExtend<ProductReferenceType>()
    // Also accepts arbitrary strings
    expectTypeOf<string>().toExtend<ProductReferenceType>()
  })

  it('NormalizedProduct has non-optional fields with defaults', () => {
    expectTypeOf<NormalizedProduct['code']>().toBeString()
    expectTypeOf<NormalizedProduct['summary']>().toBeString()
    expectTypeOf<NormalizedProduct['formattedPrice']>().toBeString()
    expectTypeOf<NormalizedProduct['inStock']>().toBeBoolean()
    expectTypeOf<NormalizedProduct['primaryImage']>().toEqualTypeOf<Image | null>()
    expectTypeOf<NormalizedProduct['price']>().toEqualTypeOf<Price | null>()
    expectTypeOf<NormalizedProduct['hasVariants']>().toBeBoolean()
  })

  it('normalizeProduct returns NormalizedProduct', () => {
    expectTypeOf(normalizeProduct).returns.toEqualTypeOf<NormalizedProduct>()
  })

  it('normalizeReview returns NormalizedReview', () => {
    expectTypeOf(normalizeReview).returns.toEqualTypeOf<NormalizedReview>()
  })

  it('extractPrimaryImage returns Image | null', () => {
    expectTypeOf(extractPrimaryImage).returns.toEqualTypeOf<Image | null>()
  })

  it('Hook option types have expected optional fields', () => {
    expectTypeOf<UseProductsOptions['query']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<UseProductsOptions['currentPage']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<UseProductsOptions['pageSize']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<UseProductsOptions['enabled']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<UseProductOptions['fields']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<UseProductReviewsOptions['maxCount']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<UseProductSuggestionsOptions['max']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<UseProductReferencesOptions['referenceType']>().toEqualTypeOf<
      ProductReferenceType | undefined
    >()
  })
})
