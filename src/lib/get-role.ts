import { Role, RoleList } from "@/lib/roles";
import { BasePayload } from "payload";

export interface UserWithIdRole {
  id?: string;
  role?: string | null;
}

export let roleOverrides: Record<string, string> = {}

export async function updateRoleOverridesCache(payload: BasePayload) {
  // const dbroleOverrides = (await payload.find({collection:"admin-role-override", depth:0})).docs
  const newRoleOverrides: Record<string, string> = {}
  // for (const dbroleOverride of dbroleOverrides) {
  //   const userid = typeof dbroleOverride.user === "string" ? dbroleOverride.user : dbroleOverride.user.id
  //   if (dbroleOverride.role) {
  //     newRoleOverrides[userid] = dbroleOverride.role
  //   }
  // }
  roleOverrides = newRoleOverrides
}

export function getRoleFromUser(user: UserWithIdRole | null | undefined, noOverride: boolean = false) {
  if (!user) {
    return null
  }
  const userRole = user.role === "" ? "default" : user.role
  if (userRole && userRole.includes("candidate")) {
    return "candidate"
  }
  if (!userRole || !RoleList.includes(userRole as Role)) {
    return null
  }
  if (!noOverride && userRole === "admin" && user.id && user.id in roleOverrides) {
    const overrideRole = roleOverrides[user.id]
    if (RoleList.includes(overrideRole as Role)) {
      return overrideRole as Role
    }
  }
  return userRole as Role
}
