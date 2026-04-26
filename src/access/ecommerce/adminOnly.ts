import type { Access } from 'payload'

import { checkRole } from '@/access/ecommerce/utilities'

export const adminOnly: Access = ({ req: { user } }) => {
  if (user) return checkRole(['admin'], user)

  return false
}
