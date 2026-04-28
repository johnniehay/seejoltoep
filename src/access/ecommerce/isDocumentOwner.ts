import type { Access } from 'payload'

import { checkPermission, checkPermissionOrWhere } from "@/access/checkPermission";

/**
 * Atomic access checker that verifies if the user owns the document being accessed.
 * Returns a Where query to filter documents by the customer field.
 *
 * Admins have full access, authenticated users get filtered by customer field,
 * and unauthenticated users are denied access.
 *
 * @returns true for admins, Where query for customers, false for guests
 */
export const isDocumentOwner: Access = ({ req }) => {

  if (req.user) {
    return checkPermissionOrWhere("admin:winkel", {customer: { equals: req.user.id }})({ req })
  } else {
    return checkPermission("admin:winkel")({ req })
  }

}
