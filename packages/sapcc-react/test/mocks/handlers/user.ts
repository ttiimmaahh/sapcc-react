import { http, HttpResponse } from 'msw'
import { createUser } from '../fixtures/auth'
import {
  createAddress,
  createPaymentDetails,
  createConsentTemplate,
  createConsentTemplateWithConsent,
  createConsent,
  createNotificationPreferenceSet,
  createProductInterestSearchResult,
  createProductInterestRelation,
  createProductInterestEntry,
  createCustomerCouponSearchResult,
  createCustomerCoupon,
  createAddressVerificationResult,
} from '../fixtures/user'
import { createPagination } from '../fixtures/common'
import type { Address, PaymentDetails, ConsentTemplate, NotificationPreference, CustomerCoupon } from '../../../src/user/user.types'
import type { User } from '../../../src/auth/auth.types'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

// ---------------------------------------------------------------------------
// In-memory user state for realistic handler behavior
// ---------------------------------------------------------------------------

let userProfile: User = createUser({
  uid: 'test@example.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
})

let addresses: Address[] = [
  createAddress({ id: 'addr-1', firstName: 'Test', lastName: 'User', defaultAddress: true }),
  createAddress({ id: 'addr-2', firstName: 'Test', lastName: 'User', defaultAddress: false }),
]

let paymentMethods: PaymentDetails[] = [
  createPaymentDetails({ id: 'pay-1', defaultPayment: true }),
  createPaymentDetails({ id: 'pay-2', defaultPayment: false }),
]

let consentTemplates: ConsentTemplate[] = [
  createConsentTemplate({ id: 'MARKETING_NEWSLETTER', name: 'Marketing Newsletter', version: 0 }),
  createConsentTemplateWithConsent({ id: 'PERSONALIZATION', name: 'Personalization', version: 0 }),
]

let notificationPreferences: NotificationPreference[] = createNotificationPreferenceSet()

let customerCoupons: CustomerCoupon[] = [
  createCustomerCoupon({ couponId: 'COUPON001', name: '10% Off Electronics', status: 'EFFECTIVE' }),
  createCustomerCoupon({ couponId: 'COUPON002', name: 'Free Shipping', status: 'PRESESSION', notificationOn: true }),
]

/** Reset user state between tests */
export function resetUserState(): void {
  userProfile = createUser({
    uid: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
  })

  addresses = [
    createAddress({ id: 'addr-1', firstName: 'Test', lastName: 'User', defaultAddress: true }),
    createAddress({ id: 'addr-2', firstName: 'Test', lastName: 'User', defaultAddress: false }),
  ]

  paymentMethods = [
    createPaymentDetails({ id: 'pay-1', defaultPayment: true }),
    createPaymentDetails({ id: 'pay-2', defaultPayment: false }),
  ]

  consentTemplates = [
    createConsentTemplate({ id: 'MARKETING_NEWSLETTER', name: 'Marketing Newsletter', version: 0 }),
    createConsentTemplateWithConsent({ id: 'PERSONALIZATION', name: 'Personalization', version: 0 }),
  ]

  notificationPreferences = createNotificationPreferenceSet()

  customerCoupons = [
    createCustomerCoupon({ couponId: 'COUPON001', name: '10% Off Electronics', status: 'EFFECTIVE' }),
    createCustomerCoupon({ couponId: 'COUPON002', name: 'Free Shipping', status: 'PRESESSION', notificationOn: true }),
  ]
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const userHandlers = [
  // ── User Profile (PATCH /users/current) — Update profile ────────────
  http.patch(
    `${BASE_URL}/users/current`,
    async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      userProfile = {
        ...userProfile,
        firstName: (body.firstName as string) ?? userProfile.firstName,
        lastName: (body.lastName as string) ?? userProfile.lastName,
        titleCode: (body.titleCode as string) ?? userProfile.titleCode,
        name: `${(body.firstName as string) ?? userProfile.firstName} ${(body.lastName as string) ?? userProfile.lastName}`,
      }
      return HttpResponse.json(userProfile)
    },
  ),

  // ── User Profile (DELETE /users/current) — Close account ────────────
  http.delete(
    `${BASE_URL}/users/current`,
    () => {
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // ── Change Password (POST /users/current/password) ──────────────────
  http.post(
    `${BASE_URL}/users/current/password`,
    async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      const oldPassword = body.oldPassword as string | undefined
      const newPassword = body.newPassword as string | undefined

      if (!oldPassword || !newPassword) {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'Old and new password are required' }] },
          { status: 400 },
        )
      }

      // Simulate wrong old password
      if (oldPassword === 'wrong_password') {
        return HttpResponse.json(
          { errors: [{ type: 'PasswordMismatchError', message: 'Old password is incorrect' }] },
          { status: 400 },
        )
      }

      return new HttpResponse(null, { status: 202 })
    },
  ),

  // ── Addresses (GET /users/current/addresses) ────────────────────────
  http.get(
    `${BASE_URL}/users/current/addresses`,
    () => {
      return HttpResponse.json({ addresses })
    },
  ),

  // ── Create Address (POST /users/current/addresses) ──────────────────
  http.post(
    `${BASE_URL}/users/current/addresses`,
    async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      const newAddress = createAddress({
        firstName: body.firstName as string,
        lastName: body.lastName as string,
        line1: body.line1 as string,
        town: body.town as string,
        postalCode: body.postalCode as string,
        defaultAddress: (body.defaultAddress as boolean) ?? false,
      })
      addresses.push(newAddress)
      return HttpResponse.json(newAddress, { status: 201 })
    },
  ),

  // ── Update Address (PATCH /users/current/addresses/:addressId) ──────
  http.patch(
    `${BASE_URL}/users/current/addresses/:addressId`,
    async ({ params, request }) => {
      const { addressId } = params
      const body = (await request.json()) as Record<string, unknown>
      const idx = addresses.findIndex((a) => a.id === addressId)

      if (idx === -1) {
        return HttpResponse.json(
          { errors: [{ type: 'NotFoundError', message: 'Address not found' }] },
          { status: 404 },
        )
      }

      addresses[idx] = { ...addresses[idx], ...body } as Address
      return HttpResponse.json(addresses[idx])
    },
  ),

  // ── Delete Address (DELETE /users/current/addresses/:addressId) ─────
  http.delete(
    `${BASE_URL}/users/current/addresses/:addressId`,
    ({ params }) => {
      const { addressId } = params
      addresses = addresses.filter((a) => a.id !== addressId)
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // ── Verify Address (POST /users/current/addresses/verification) ─────
  http.post(
    `${BASE_URL}/users/current/addresses/verification`,
    () => {
      return HttpResponse.json(createAddressVerificationResult())
    },
  ),

  // ── Payment Methods (GET /users/current/paymentdetails) ─────────────
  http.get(
    `${BASE_URL}/users/current/paymentdetails`,
    () => {
      return HttpResponse.json({ payments: paymentMethods })
    },
  ),

  // ── Update Payment (PUT /users/current/paymentdetails/:paymentDetailsId) ──
  http.put(
    `${BASE_URL}/users/current/paymentdetails/:paymentDetailsId`,
    async ({ params, request }) => {
      const { paymentDetailsId } = params
      const body = (await request.json()) as Record<string, unknown>
      const idx = paymentMethods.findIndex((p) => p.id === paymentDetailsId)

      if (idx === -1) {
        return HttpResponse.json(
          { errors: [{ type: 'NotFoundError', message: 'Payment method not found' }] },
          { status: 404 },
        )
      }

      // If setting as default, unset others
      if (body.defaultPayment === true) {
        for (const pm of paymentMethods) {
          pm.defaultPayment = false
        }
      }

      paymentMethods[idx] = { ...paymentMethods[idx], ...body } as PaymentDetails
      return HttpResponse.json(paymentMethods[idx])
    },
  ),

  // ── Delete Payment (DELETE /users/current/paymentdetails/:paymentDetailsId) ──
  http.delete(
    `${BASE_URL}/users/current/paymentdetails/:paymentDetailsId`,
    ({ params }) => {
      const { paymentDetailsId } = params
      paymentMethods = paymentMethods.filter((p) => p.id !== paymentDetailsId)
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // ── Consent Templates (GET /users/current/consenttemplates) ─────────
  http.get(
    `${BASE_URL}/users/current/consenttemplates`,
    () => {
      return HttpResponse.json({ consentTemplates })
    },
  ),

  // ── Give Consent (POST /users/current/consents) — form-encoded ──────
  http.post(
    `${BASE_URL}/users/current/consents`,
    async ({ request }) => {
      const body = await request.text()
      const params = new URLSearchParams(body)
      const consentTemplateId = params.get('consentTemplateId')
      const consentTemplateVersion = params.get('consentTemplateVersion')

      if (!consentTemplateId || !consentTemplateVersion) {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'consentTemplateId and consentTemplateVersion are required' }] },
          { status: 400 },
        )
      }

      // Update in-memory state: add consent to the matching template
      const template = consentTemplates.find((t) => t.id === consentTemplateId)
      if (template) {
        template.currentConsent = createConsent({
          code: `consent_${consentTemplateId}`,
        })
      }

      // SAP Commerce returns a ConsentTemplate with the new consent
      const responseTemplate = template ?? createConsentTemplateWithConsent({
        id: consentTemplateId,
        version: Number(consentTemplateVersion),
      })

      return HttpResponse.json(responseTemplate, { status: 201 })
    },
  ),

  // ── Withdraw Consent (DELETE /users/current/consents/:consentCode) ───
  http.delete(
    `${BASE_URL}/users/current/consents/:consentCode`,
    ({ params }) => {
      const { consentCode } = params

      // Update in-memory state: remove consent from matching template
      for (const template of consentTemplates) {
        if (template.currentConsent?.code === consentCode) {
          template.currentConsent = undefined
          break
        }
      }

      return new HttpResponse(null, { status: 204 })
    },
  ),

  // ── Notification Preferences (GET /users/current/notificationpreferences) ──
  http.get(
    `${BASE_URL}/users/current/notificationpreferences`,
    () => {
      return HttpResponse.json({ preferences: notificationPreferences })
    },
  ),

  // ── Update Notification Preferences (PUT /users/current/notificationpreferences) ──
  http.put(
    `${BASE_URL}/users/current/notificationpreferences`,
    async ({ request }) => {
      const body = (await request.json()) as { preferences?: NotificationPreference[] }

      if (body.preferences) {
        notificationPreferences = body.preferences
      }

      return new HttpResponse(null, { status: 200 })
    },
  ),

  // ── Product Interests (GET /users/current/productinterests) ─────────
  http.get(
    `${BASE_URL}/users/current/productinterests`,
    ({ request }) => {
      const url = new URL(request.url)
      const pageSize = Number(url.searchParams.get('pageSize') ?? 10)
      const currentPage = Number(url.searchParams.get('currentPage') ?? 0)

      return HttpResponse.json(
        createProductInterestSearchResult({
          pagination: createPagination({
            currentPage,
            pageSize,
            totalResults: 2,
            totalPages: 1,
          }),
        }),
      )
    },
  ),

  // ── Add Product Interest (POST /users/current/productinterests) ─────
  http.post(
    `${BASE_URL}/users/current/productinterests`,
    ({ request }) => {
      const url = new URL(request.url)
      const productCode = url.searchParams.get('productCode')
      const notificationType = url.searchParams.get('notificationType')

      if (!productCode || !notificationType) {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'productCode and notificationType are required' }] },
          { status: 400 },
        )
      }

      const newInterest = createProductInterestRelation({
        product: { code: productCode, name: `Product ${productCode}`, images: [] },
        productInterestEntry: [
          createProductInterestEntry({ interestType: notificationType }),
        ],
      })

      return HttpResponse.json(newInterest, { status: 201 })
    },
  ),

  // ── Remove Product Interest (DELETE /users/current/productinterests) ──
  http.delete(
    `${BASE_URL}/users/current/productinterests`,
    ({ request }) => {
      const url = new URL(request.url)
      const productCode = url.searchParams.get('productCode')
      const notificationType = url.searchParams.get('notificationType')

      if (!productCode || !notificationType) {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'productCode and notificationType are required' }] },
          { status: 400 },
        )
      }

      return new HttpResponse(null, { status: 204 })
    },
  ),

  // ── Customer Coupons (GET /users/current/customercoupons) ───────────
  http.get(
    `${BASE_URL}/users/current/customercoupons`,
    ({ request }) => {
      const url = new URL(request.url)
      const pageSize = Number(url.searchParams.get('pageSize') ?? 10)
      const currentPage = Number(url.searchParams.get('currentPage') ?? 0)

      return HttpResponse.json(
        createCustomerCouponSearchResult({
          coupons: customerCoupons,
          pagination: createPagination({
            currentPage,
            pageSize,
            totalResults: customerCoupons.length,
            totalPages: 1,
          }),
        }),
      )
    },
  ),

  // ── Claim Coupon (POST /users/current/customercoupons/:couponCode/claim) ──
  http.post(
    `${BASE_URL}/users/current/customercoupons/:couponCode/claim`,
    ({ params }) => {
      const { couponCode } = params
      const coupon = createCustomerCoupon({
        couponId: couponCode as string,
        status: 'EFFECTIVE',
      })
      customerCoupons.push(coupon)
      return HttpResponse.json(coupon, { status: 201 })
    },
  ),

  // ── Disclaim Coupon (DELETE /users/current/customercoupons/:couponCode/claim) ──
  // Note: Spartacus uses DELETE on the same /claim path for disclaim
  http.delete(
    `${BASE_URL}/users/current/customercoupons/:couponCode/claim`,
    ({ params }) => {
      const { couponCode } = params
      customerCoupons = customerCoupons.filter((c) => c.couponId !== couponCode)
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // ── Toggle Coupon Notification (PATCH /users/current/customercoupons/:couponCode/notification) ──
  http.patch(
    `${BASE_URL}/users/current/customercoupons/:couponCode/notification`,
    ({ params }) => {
      const { couponCode } = params
      const idx = customerCoupons.findIndex((c) => c.couponId === couponCode)

      const existing = idx !== -1 ? customerCoupons[idx] : undefined
      if (existing) {
        customerCoupons[idx] = {
          ...existing,
          notificationOn: !existing.notificationOn,
        }
      }

      return new HttpResponse(null, { status: 200 })
    },
  ),
]
