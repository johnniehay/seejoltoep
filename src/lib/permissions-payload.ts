import type { User } from "@/payload-types";
import { NonPublicPermissions, Permission, Role, rolePermissions } from "@/lib/roles";
import { getRoleFromUser } from "@/lib/get-role";

export function getPermissionsReq(user: User | null, accesscookie?: string){
  if (user) {
    const userRole = getRoleFromUser(user);
    if (!userRole) { //role in rolePermissions vs rolesList.includes
      return []
    }
    return rolePermissions[userRole]
  } else {
    if (accesscookie && accesscookie === process.env.NONPUBLIC_ACCESS) {
      return NonPublicPermissions
    }
    return []
  }
}
export function hasPermissionReq(permission: Permission,user: User | null, accesscookie?: string) {
  const permissions = getPermissionsReq(user,accesscookie)
  return permissions.includes(permission)
}