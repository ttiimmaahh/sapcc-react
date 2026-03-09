import { http, HttpResponse } from 'msw'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

export const siteContextHandlers = [
  // Languages
  http.get(`${BASE_URL}/languages`, () => {
    return HttpResponse.json({
      languages: [
        { isocode: 'en', name: 'English', nativeName: 'English', active: true },
        { isocode: 'de', name: 'German', nativeName: 'Deutsch', active: true },
        { isocode: 'ja', name: 'Japanese', nativeName: '日本語', active: true },
      ],
    })
  }),

  // Currencies
  http.get(`${BASE_URL}/currencies`, () => {
    return HttpResponse.json({
      currencies: [
        { isocode: 'USD', name: 'US Dollar', symbol: '$', active: true },
        { isocode: 'EUR', name: 'Euro', symbol: '€', active: true },
        { isocode: 'JPY', name: 'Japanese Yen', symbol: '¥', active: true },
      ],
    })
  }),

  // Countries (with optional type filter)
  http.get(`${BASE_URL}/countries`, ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')

    const allCountries = [
      { isocode: 'US', name: 'United States' },
      { isocode: 'DE', name: 'Germany' },
      { isocode: 'JP', name: 'Japan' },
    ]

    // In a real OCC API, filtering by type would return a subset
    // For testing, we return all if no type, or a filtered set
    if (type === 'SHIPPING') {
      return HttpResponse.json({
        countries: [
          { isocode: 'US', name: 'United States' },
          { isocode: 'DE', name: 'Germany' },
        ],
      })
    }

    if (type === 'BILLING') {
      return HttpResponse.json({
        countries: [
          { isocode: 'US', name: 'United States' },
          { isocode: 'JP', name: 'Japan' },
        ],
      })
    }

    return HttpResponse.json({ countries: allCountries })
  }),

  // Regions for a country
  http.get(`${BASE_URL}/countries/:isoCode/regions`, ({ params }) => {
    const { isoCode } = params

    if (isoCode === 'US') {
      return HttpResponse.json({
        regions: [
          { isocode: 'US-CA', name: 'California', countryIso: 'US' },
          { isocode: 'US-NY', name: 'New York', countryIso: 'US' },
          { isocode: 'US-TX', name: 'Texas', countryIso: 'US' },
        ],
      })
    }

    if (isoCode === 'DE') {
      return HttpResponse.json({
        regions: [
          { isocode: 'DE-BY', name: 'Bavaria', countryIso: 'DE' },
          { isocode: 'DE-BE', name: 'Berlin', countryIso: 'DE' },
        ],
      })
    }

    // Unknown country returns empty regions
    return HttpResponse.json({ regions: [] })
  }),

  // Titles
  http.get(`${BASE_URL}/titles`, () => {
    return HttpResponse.json({
      titles: [
        { code: 'mr', name: 'Mr.' },
        { code: 'mrs', name: 'Mrs.' },
        { code: 'ms', name: 'Ms.' },
        { code: 'dr', name: 'Dr.' },
      ],
    })
  }),

  // Card types
  http.get(`${BASE_URL}/cardtypes`, () => {
    return HttpResponse.json({
      cardTypes: [
        { code: 'visa', name: 'Visa' },
        { code: 'master', name: 'Mastercard' },
        { code: 'amex', name: 'American Express' },
      ],
    })
  }),
]
