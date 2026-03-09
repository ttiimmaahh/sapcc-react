import { createContext } from 'react'
import type { ResolvedSapccConfig } from './SapccConfig'
import type { OccClient } from '../http/occ-client'

/**
 * Internal context value shape — holds the resolved config and OccClient instance.
 */
export interface SapccContextValue {
  config: ResolvedSapccConfig
  client: OccClient
}

/**
 * React context for the SAP Commerce Cloud provider.
 * Internal only — consumers use hooks (useSapccConfig, useSapccClient).
 */
export const SapccContext = createContext<SapccContextValue | null>(null)
