import { buildQueryString } from '../utils/query-params'

/**
 * Registry of OCC endpoint URL templates.
 * Template parameters use `:paramName` syntax (e.g., `/countries/:isoCode/regions`).
 *
 * Phase 1 only includes site-context endpoints.
 * Later phases will add products, cart, checkout, etc.
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
