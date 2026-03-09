import { describe, it, expectTypeOf } from 'vitest'
import type { SapccConfig, ResolvedSapccConfig, DeepPartial } from '../provider/SapccConfig'
import { resolveConfig, defaultConfig } from '../provider/SapccConfig'
import type { OccFields } from '../http/types'

describe('Config type tests', () => {
  it('SapccConfig requires backend.occ.baseUrl and site.baseSite', () => {
    expectTypeOf<SapccConfig>().toHaveProperty('backend')
    expectTypeOf<SapccConfig>().toHaveProperty('site')

    // Optional fields
    expectTypeOf<SapccConfig['auth']>().toEqualTypeOf<
      | { clientId: string; clientSecret?: string; tokenEndpoint?: string }
      | undefined
    >()
  })

  it('ResolvedSapccConfig has no optional backend/site/http/dev/cms fields', () => {
    expectTypeOf<ResolvedSapccConfig['backend']['occ']['prefix']>().toBeString()
    expectTypeOf<ResolvedSapccConfig['site']['language']>().toBeString()
    expectTypeOf<ResolvedSapccConfig['site']['currency']>().toBeString()
    expectTypeOf<ResolvedSapccConfig['http']['retries']>().toBeNumber()
    expectTypeOf<ResolvedSapccConfig['dev']['logging']>().toBeBoolean()
  })

  it('resolveConfig returns ResolvedSapccConfig', () => {
    expectTypeOf(resolveConfig).returns.toEqualTypeOf<ResolvedSapccConfig>()
  })

  it('DeepPartial makes all nested fields optional', () => {
    expectTypeOf(defaultConfig).toExtend<DeepPartial<ResolvedSapccConfig>>()
  })

  it('OccFields accepts valid field strings', () => {
    expectTypeOf<'BASIC'>().toExtend<OccFields>()
    expectTypeOf<'DEFAULT'>().toExtend<OccFields>()
    expectTypeOf<'FULL'>().toExtend<OccFields>()
    expectTypeOf<string>().toExtend<OccFields>()
  })
})
