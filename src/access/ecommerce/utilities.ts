import type { User } from '@/payload-types'

export const checkRole = (allRoles: string[] = [], user?: User | null): boolean => {
  if (user && allRoles) {
    return allRoles.some((role) => user?.role === role)
  }

  return false
}
