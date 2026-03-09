import { siteContextHandlers } from './site-context'
import { productHandlers } from './products'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'

export const handlers = [...authHandlers, ...siteContextHandlers, ...productHandlers, ...cartHandlers]
