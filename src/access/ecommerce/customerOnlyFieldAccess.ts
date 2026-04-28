import type { FieldAccess } from 'payload'

import { checkPermission } from "@/access/checkPermission";

export const customerOnlyFieldAccess: FieldAccess = ({ req, req: { user } }) => {
  if (user) return !(checkPermission("admin:winkel")({ req }))

  return false
}
