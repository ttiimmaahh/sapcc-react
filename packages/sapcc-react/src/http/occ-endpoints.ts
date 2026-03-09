import { buildQueryString } from '../utils/query-params'

/**
 * Registry of OCC endpoint URL templates.
 * Template parameters use `:paramName` syntax (e.g., `/countries/:isoCode/regions`).
 *
 * Organized by domain. New endpoints are added as phases are implemented.
 */
const endpointTemplates: Record<string, string> = {
  // Site context
  languages: '/languages',
  currencies: '/currencies',
  countries: '/countries',
  regions: '/countries/:isoCode/regions',
  titles: '/titles',
  cardTypes: '/cardtypes',
  baseSites: '/basesites',

  // Products
  productSearch: '/products/search',
  productDetail: '/products/:productCode',
  productReviews: '/products/:productCode/reviews',
  productSuggestions: '/products/suggestions',
  productStock: '/products/:productCode/stock',
  productReferences: '/products/:productCode/references',

  // Cart
  carts: '/users/:userId/carts',
  cart: '/users/:userId/carts/:cartId',
  cartEntries: '/users/:userId/carts/:cartId/entries',
  cartEntry: '/users/:userId/carts/:cartId/entries/:entryNumber',
  cartVouchers: '/users/:userId/carts/:cartId/vouchers',
  cartVoucher: '/users/:userId/carts/:cartId/vouchers/:voucherId',
  cartPromotions: '/users/:userId/carts/:cartId/promotions',
  cartSave: '/users/current/carts/:cartId/save',
  cartRestore: '/users/current/carts/:cartId/restoresavedcart',
  cartClone: '/users/current/carts/:cartId/clonesavedcart',

  // Checkout
  cartDeliveryAddress: '/users/:userId/carts/:cartId/addresses/delivery',
  cartDeliveryModes: '/users/:userId/carts/:cartId/deliverymodes',
  cartDeliveryMode: '/users/:userId/carts/:cartId/deliverymode',
  cartPaymentDetails: '/users/:userId/carts/:cartId/paymentdetails',
  cartEmail: '/users/:userId/carts/:cartId/email',
  orders: '/users/:userId/orders',

  // User profile
  userProfile: '/users/:userId',
  userPassword: '/users/:userId/password',

  // User addresses
  userAddresses: '/users/:userId/addresses',
  userAddress: '/users/:userId/addresses/:addressId',
  userAddressVerification: '/users/:userId/addresses/verification',

  // User payment methods
  userPaymentDetails: '/users/:userId/paymentdetails',
  userPaymentDetail: '/users/:userId/paymentdetails/:paymentDetailsId',

  // User consents
  userConsentTemplates: '/users/:userId/consenttemplates',
  userConsents: '/users/:userId/consents',
  userConsent: '/users/:userId/consents/:consentCode',

  // User notification preferences
  userNotificationPreferences: '/users/:userId/notificationpreferences',

  // User product interests
  userProductInterests: '/users/:userId/productinterests',

  // User customer coupons
  userCustomerCoupons: '/users/:userId/customercoupons',
  userCustomerCouponClaim: '/users/:userId/customercoupons/:couponCode/claim',
  userCustomerCouponNotification: '/users/:userId/customercoupons/:couponCode/notification',

  // Orders
  order: '/users/:userId/orders/:orderCode',
  orderCancellation: '/users/:userId/orders/:orderCode/cancellation',

  // Return requests
  orderReturns: '/users/:userId/orderReturns',
  orderReturn: '/users/:userId/orderReturns/:returnRequestCode',

  // Consignment tracking
  consignmentTracking: '/orders/:orderCode/consignments/:consignmentCode/tracking',
}

/**
 * Replaces `:paramName` path parameters in a template with actual values.
 */
function substitutePathParams(
  template: string,
  pathParams: Record<string, string>,
): string {
  let result = template
  for (const [key, value] of Object.entries(pathParams)) {
    const placeholder = `:${key}`
    if (!result.includes(placeholder)) {
      throw new Error(`Unknown path parameter "${key}" in template "${template}"`)
    }
    result = result.replace(placeholder, encodeURIComponent(value))
  }

  // Check for any remaining unsubstituted placeholders
  const remaining = /:(\w+)/.exec(result)
  if (remaining) {
    throw new Error(
      `Missing required path parameter "${String(remaining[1])}" for template "${template}"`,
    )
  }

  return result
}

/**
 * Builds a full OCC URL from an endpoint name, path parameters, and query parameters.
 *
 * @param baseUrl - Base URL of the SAP Commerce instance
 * @param prefix - API prefix (e.g., '/occ/v2')
 * @param baseSite - Base site ID
 * @param endpoint - Endpoint name from the registry
 * @param pathParams - Path parameter values to substitute
 * @param queryParams - Optional query string parameters
 * @returns Full URL string
 */
export function buildUrl(
  baseUrl: string,
  prefix: string,
  baseSite: string,
  endpoint: string,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, string | number | boolean | undefined>,
): string {
  const template = endpointTemplates[endpoint]
  if (!template) {
    throw new Error(`Unknown endpoint: "${endpoint}"`)
  }

  const path = pathParams
    ? substitutePathParams(template, pathParams)
    : substitutePathParams(template, {})
  const query = queryParams ? buildQueryString(queryParams) : ''

  return `${baseUrl}${prefix}/${baseSite}${path}${query}`
}

/**
 * Builds a URL from a raw path (not from the endpoint registry).
 * Used by OccClient for direct path access.
 */
export function buildRawUrl(
  baseUrl: string,
  prefix: string,
  baseSite: string,
  path: string,
  queryParams?: Record<string, string | number | boolean | undefined>,
): string {
  const query = queryParams ? buildQueryString(queryParams) : ''
  return `${baseUrl}${prefix}/${baseSite}${path}${query}`
}

/**
 * Returns the available endpoint names (useful for debugging).
 */
export function getEndpointNames(): string[] {
  return Object.keys(endpointTemplates)
}
