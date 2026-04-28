import type { FieldAccess } from 'payload'

import { hasPermission } from "@/lib/permissions";

export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) return hasPermission("admin:winkel")

  return false
}
