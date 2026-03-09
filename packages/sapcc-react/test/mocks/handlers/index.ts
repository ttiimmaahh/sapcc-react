import { siteContextHandlers } from './site-context'
import { productHandlers } from './products'

export const handlers = [...siteContextHandlers, ...productHandlers]
