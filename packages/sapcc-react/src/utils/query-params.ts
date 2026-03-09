/**
 * Builds a URL query string from a record of parameter key-value pairs.
 *
 * - Filters out `undefined` values
 * - Encodes both keys and values
 * - Returns empty string if no params remain (not `?`)
 * - Booleans and numbers are converted to strings
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
  )

  if (entries.length === 0) return ''

  const queryString = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return `?${queryString}`
}
