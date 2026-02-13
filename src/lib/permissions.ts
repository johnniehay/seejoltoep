import { auth } from "@/auth";
import { Permission} from "@/lib/roles";

import { cookies } from "next/headers";
import type { User } from "@/payload-types";
import { getPermissionsReq } from "@/lib/permissions-payload";

export async function getPermissions() {
  const session = await auth()
  if (session && session.user) {
    const user = session.user as User;
    return getPermissionsReq(user,undefined)
  } else {
    const cookieStore = await cookies()
    const accesscookie = cookieStore.get("access")
    if (accesscookie && accesscookie.value === process.env.NONPUBLIC_ACCESS) {
      return getPermissionsReq(null,accesscookie.value)
    }
    return getPermissionsReq(null)
  }
}

export async function hasPermission(permission: Permission) {
  return (await getPermissions()).includes(permission)
}
