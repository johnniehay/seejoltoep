import type { PayloadRequest, Where } from "payload";
import { getRoleFromUser } from "@/lib/get-role";
import { divisieleierdivisiequery } from "@/collections/Lede";
import { getID } from "@/utilities/getID";

export const getlidgroepeinfo = (payloadreq: PayloadRequest) => {
  const user = payloadreq.user
  console.log(`getlidgroepeinfo ${payloadreq.user?.email} ${user?.self_lid} ${typeof user?.self_lid} ${typeof user?.self_lid !== "string" ? JSON.stringify(user?.self_lid?.lid_inligting_sigbaar_vir_groepe) : ""}`)
  if (!user?.self_lid || typeof user.self_lid === "string" || !user.self_lid.lid_inligting_sigbaar_vir_groepe) return []
  const groepids: string[] = []
  user.self_lid.lid_inligting_sigbaar_vir_groepe.forEach((groep) => {
    groepids.push(typeof groep === "string" ? groep : groep.id)
    if (typeof groep !== "string" && groep.subgroepe) groep.subgroepe.map((subgroep) => groepids.push(typeof subgroep === "string" ? subgroep : subgroep.id))
  })
  return groepids
}

export const wherelidgroepeinfo = async (payloadreq: PayloadRequest) => {
  const lidgroepeinfo = getlidgroepeinfo(payloadreq)
  console.log(`wherelidgroepeinfo ${payloadreq.user?.email} ${JSON.stringify(lidgroepeinfo)}`)
  if (lidgroepeinfo.length === 0) return false
  return { id: { in: lidgroepeinfo.join(",") } } as Where
}

export const groepwheredivisieleier = async (payloadreq: PayloadRequest) => {
  if (getRoleFromUser(payloadreq.user) === "divisieleier") {
    const divisie = divisieleierdivisiequery(payloadreq.user, payloadreq.payload)
    if (!divisie) return false
    if (typeof divisie === "string") {
      payloadreq.payload.logger.error(`wheredivisieleier divisie is string ${divisie} expected object insufficient depth`)
      return false
    }
    const divisiegroep = divisie.groep
    if (!divisiegroep) return false
    return { id: { equals: getID(divisiegroep) } } as Where
  } else {
    return false
  }
}

export const isdivisieleier = async (payloadreq: PayloadRequest) => getRoleFromUser(payloadreq.user) === "divisieleier"

export const isdivisieleier_and_lidgroepeinfo_and_divisiesubgroep = async (payloadreq: PayloadRequest) => {
  const lidgroepeinfowhere = await wherelidgroepeinfo(payloadreq)
  const isuserdivisieleier = await isdivisieleier(payloadreq)
  return isuserdivisieleier ? { and: [lidgroepeinfowhere, { add_lede_where: { not_equals: {} } }, { tipe: { equals: "divisie_subgroep" } }] } as Where : false
}
