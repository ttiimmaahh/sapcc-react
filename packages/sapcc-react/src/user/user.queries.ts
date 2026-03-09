import { queryOptions } from '@tanstack/react-query'
import type { OccClient } from '../http/occ-client'
import type { User } from '../auth/auth.types'
import type {
  AddressListResponse,
  PaymentDetailsListResponse,
  ConsentTemplateListResponse,
  NotificationPreferenceListResponse,
  ProductInterestSearchResult,
  CustomerCouponSearchResult,
  UseUserProfileOptions,
  UseAddressesOptions,
  UsePaymentMethodsOptions,
  UseConsentsOptions,
  UseNotificationPreferencesOptions,
  UseProductInterestsOptions,
  UseCustomerCouponsOptions,
} from './user.types'

/** 30 seconds — user data may change during a session */
const USER_STALE_TIME = 30 * 1000

/** 60 seconds — consent templates and coupons change less frequently */
const SLOW_STALE_TIME = 60 * 1000

/**
 * TanStack Query option factories for SAP Commerce Cloud user account endpoints.
 *
 * Each factory returns a `queryOptions()` object suitable for `useQuery()`.
 * Keys are namespaced under `['sapcc', 'user', ...]`.
 *
 * @example
 * ```ts
 * const client = useSapccClient()
 *
 * // User profile
 * const { data } = useQuery(userQueries.profile(client))
 *
 * // User addresses
 * const { data } = useQuery(userQueries.addresses(client))
 * ```
 */
export const userQueries = {
  /** Fetch the current user's profile */
  profile: (client: OccClient, options: UseUserProfileOptions = {}) =>
    queryOptions({
      queryKey: ['sapcc', 'user', 'profile', options.fields ?? 'DEFAULT'] as const,
      queryFn: async () => {
        const response = await client.get<User>('/users/current', {
          fields: options.fields,
        })
        return response.data
      },
      staleTime: USER_STALE_TIME,
      enabled: options.enabled ?? true,
    }),

  /** Fetch the current user's address book */
  addresses: (client: OccClient, options: UseAddressesOptions = {}) =>
    queryOptions({
      queryKey: ['sapcc', 'user', 'addresses', options.fields ?? 'DEFAULT'] as const,
      queryFn: async () => {
        const response = await client.get<AddressListResponse>('/users/current/addresses', {
          fields: options.fields,
        })
        return response.data.addresses ?? []
      },
      staleTime: USER_STALE_TIME,
      enabled: options.enabled ?? true,
    }),

  /** Fetch the current user's saved payment methods */
  paymentMethods: (client: OccClient, options: UsePaymentMethodsOptions = {}) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'user',
        'payments',
        options.saved ?? true,
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<PaymentDetailsListResponse>(
          '/users/current/paymentdetails',
          {
            saved: options.saved ?? true,
            fields: options.fields,
          },
        )
        return response.data.payments ?? []
      },
      staleTime: USER_STALE_TIME,
      enabled: options.enabled ?? true,
    }),

  /** Fetch consent templates with the current user's consent status */
  consentTemplates: (client: OccClient, options: UseConsentsOptions = {}) =>
    queryOptions({
      queryKey: ['sapcc', 'user', 'consents', options.fields ?? 'DEFAULT'] as const,
      queryFn: async () => {
        const response = await client.get<ConsentTemplateListResponse>(
          '/users/current/consenttemplates',
          {
            fields: options.fields,
          },
        )
        return response.data.consentTemplates ?? []
      },
      staleTime: SLOW_STALE_TIME,
      enabled: options.enabled ?? true,
    }),

  /** Fetch the current user's notification preferences */
  notificationPreferences: (client: OccClient, options: UseNotificationPreferencesOptions = {}) =>
    queryOptions({
      queryKey: ['sapcc', 'user', 'notifications'] as const,
      queryFn: async () => {
        const response = await client.get<NotificationPreferenceListResponse>(
          '/users/current/notificationpreferences',
        )
        return response.data.preferences ?? []
      },
      staleTime: SLOW_STALE_TIME,
      enabled: options.enabled ?? true,
    }),

  /** Fetch the current user's product interest subscriptions */
  productInterests: (client: OccClient, options: UseProductInterestsOptions = {}) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'user',
        'interests',
        options.currentPage ?? 0,
        options.pageSize ?? 10,
        options.sort,
        options.productCode,
        options.notificationType,
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<ProductInterestSearchResult>(
          '/users/current/productinterests',
          {
            currentPage: options.currentPage ?? 0,
            pageSize: options.pageSize ?? 10,
            sort: options.sort,
            productCode: options.productCode,
            notificationType: options.notificationType,
            fields: options.fields,
          },
        )
        return response.data
      },
      staleTime: USER_STALE_TIME,
      enabled: options.enabled ?? true,
    }),

  /** Fetch the current user's customer coupons */
  customerCoupons: (client: OccClient, options: UseCustomerCouponsOptions = {}) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'user',
        'coupons',
        options.currentPage ?? 0,
        options.pageSize ?? 10,
        options.sort,
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<CustomerCouponSearchResult>(
          '/users/current/customercoupons',
          {
            currentPage: options.currentPage ?? 0,
            pageSize: options.pageSize ?? 10,
            sort: options.sort,
            fields: options.fields,
          },
        )
        return response.data
      },
      staleTime: SLOW_STALE_TIME,
      enabled: options.enabled ?? true,
    }),
} as const
