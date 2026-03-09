import { siteContextHandlers } from './site-context'
import { productHandlers } from './products'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { userHandlers } from './user'

export const handlers = [...authHandlers, ...siteContextHandlers, ...productHandlers, ...cartHandlers, ...checkoutHandlers, ...userHandlers]
