import type { CollectionAfterChangeHook } from "payload";
import type { Groepe } from "@/payload-types";
import { getID } from "@/utilities/getID";
import { hasPermissionReq } from "@/lib/permissions-payload";

export const addLidtoGroepInfoOnCreate: CollectionAfterChangeHook<Groepe> = async ({
                                                                                      doc:indoc,
                                                                                      req,
                                                                                      operation,
                                                                                      context,
                                                                                    }) => {
  if (operation === "create" && !(hasPermissionReq("create:groepe", req.user))) {
    if (!req.user?.self_lid || typeof req.user?.self_lid === "string"){
      req.payload.logger.info("addLidtoGroepInfoOnCreate self_lid is string")
      return
    }
    const lid_inligting_sigbaar_vir_groepe = (req.user?.self_lid.lid_inligting_sigbaar_vir_groepe ?? [] as string[]).map((groep) => getID(groep))
    lid_inligting_sigbaar_vir_groepe.push(indoc.id)
    await req.payload.update({
      collection:"lede",
      id:getID(req.user?.self_lid),
      data: {
        lid_inligting_sigbaar_vir_groepe: lid_inligting_sigbaar_vir_groepe
      },
      overrideAccess: false,
      req: req
    })
  }
  return indoc
}
