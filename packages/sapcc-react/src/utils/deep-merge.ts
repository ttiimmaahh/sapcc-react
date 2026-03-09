/**
 * Recursively makes all properties of T optional, including nested objects.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

/**
 * Checks if a value is a plain object (not an array, Date, RegExp, null, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value) as unknown
  return proto === Object.prototype || proto === null
}

/**
 * Deep merges a target with one or more source objects.
 *
 * - Plain objects are recursively merged
 * - Arrays are replaced (not concatenated)
 * - `undefined` values in sources are skipped
 * - `null` values in sources overwrite the target
 * - Primitives are overwritten
 * - Pure function — does not mutate any input
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: DeepPartial<T>[]
): T {
  const result = { ...target }

  for (const source of sources) {
    if (!isPlainObject(source)) continue

    for (const key of Object.keys(source)) {
      const sourceValue = source[key]

      // Skip undefined values
      if (sourceValue === undefined) continue

      const targetValue = result[key as keyof typeof result]

      // Recursively merge plain objects
      if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
        ;(result as Record<string, unknown>)[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue,
        )
      } else {
        // Overwrite for arrays, nulls, primitives
        ;(result as Record<string, unknown>)[key] = sourceValue
      }
    }
  }

  return result
}
