import { siteContextHandlers } from './site-context'
import { productHandlers } from './products'
import { authHandlers } from './auth'

export const handlers = [...authHandlers, ...siteContextHandlers, ...productHandlers]
