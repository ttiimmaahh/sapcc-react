import { siteContextHandlers } from './site-context'
import { productHandlers } from './products'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { userHandlers } from './user'
import { orderHandlers } from './orders'
import { cmsHandlers } from './cms'

export const handlers = [...authHandlers, ...siteContextHandlers, ...productHandlers, ...cartHandlers, ...orderHandlers, ...checkoutHandlers, ...userHandlers, ...cmsHandlers]
