import type { Access } from 'payload'
import { getRoleFromUser } from "@/lib/get-role";

export const adminOnly: Access = ({ req: { user } }) => {
  // Return true or false based on if the user has an admin role
  const role = getRoleFromUser(user)
  if (role && role === 'admin') {
    return true
  }
  return false
}
