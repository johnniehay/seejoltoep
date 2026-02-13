import type { Access, Condition, FieldAccess, PayloadRequest, Where } from 'payload'
import { hasPermissionReq } from "@/lib/permissions-payload";
import type { Permission } from "@/lib/roles";
import { getRoleFromUser } from "@/lib/get-role";

export function checkPermission( permission:Permission, where?: Where | ((payloadreq:PayloadRequest) => boolean|Where|Promise<Where|boolean>)){
  const checkClosurePermission: Access =  ({ req: payloadreq }) => {
    const { user } = payloadreq
    const role = getRoleFromUser(user)
    if (!role) {
      return false
    }
    const wherefunc = typeof where === "function" ? where : (_:PayloadRequest) => where??true
    return hasPermissionReq(permission,user) ? wherefunc(payloadreq) : false
  }
  return checkClosurePermission
}

export function checkFieldPermission( permission:Permission): FieldAccess {
  return ({ req: { user } }) => (user ? hasPermissionReq(permission, user) : false)
}

export function checkConditionPermission( permission:Permission): Condition {
  return (_data, _siblingData, { user }) => ((user) ? hasPermissionReq(permission, user) : false)
}

export function checkFieldPermissionOrIf( permission:Permission, condfunc: FieldAccess): FieldAccess {
  return (fa) => {
    const { req: { user } } = fa
    const userallowed = (user ? hasPermissionReq(permission, user) : false)
    const condallowed = condfunc(fa)
    return userallowed || condallowed
  }
}

export function checkPermissionOrWhere(permission: Permission, where: Where | ((payloadreq:PayloadRequest) => boolean|Where|Promise<Where|boolean>)) {
  const checkOrWhereClosure: Access = ({ req:  payloadreq }) => {
    const { user } = payloadreq
    if (user && hasPermissionReq(permission, user)) {
      return true
    }
    const wherefunc = typeof where === "function" ? where : (_:PayloadRequest) => where
    return wherefunc(payloadreq)
  }
  return checkOrWhereClosure
}