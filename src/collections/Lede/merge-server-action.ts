"use server"

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";
import { hasPermissionReq } from "@/lib/permissions-payload";
import { divisieleierdivisiesquery } from "@/collections/Lede/index";
import { redirect } from "next/navigation";
import { flattenValidationErrors } from "next-safe-action";

export const mergeLede = authActionClient
  .metadata({ actionName: "mergeLede" })
  .schema(z.array(z.string()), {handleValidationErrorsShape: async (ve, utils) => flattenValidationErrors(ve).fieldErrors})
  .action(async ({ parsedInput: mergeledeids, ctx: { user, payload } }) => {
    console.log("merge",mergeledeids)
    const hasRolePerm = hasPermissionReq("update:lede",user) && hasPermissionReq("remove:lede",user)
    const divisieleierdivisieids = await divisieleierdivisiesquery(user, payload) as string[]
    if (!hasRolePerm && divisieleierdivisieids.length === 0)
      return {error:"Unauthorized"}
    const mwhere = {id:{in:mergeledeids.join(',')}}
    const qwhere = hasRolePerm ? mwhere : {and:[mwhere,{divisie:{in:divisieleierdivisieids.join(',')}}]}
    const mergelede = (await payload.find({collection:"lede",depth:0,where:qwhere})).docs
    if (mergelede.length !== 2) return {error:"Select 2 valid lede to merge"}
    console.log("Merging lede",mergelede)
    const [p1,p2] = mergelede
    const [basep, remp] = new Date(p1.createdAt) < new Date(p2.createdAt) ? [p1,p2] : [p2,p1]
    console.log("Merging base",basep,"rem", remp)
    if (basep.user && remp.user && basep.user !== remp.user) return {error:"Two lede with linked users can't be merged"}
    const ifeqelsecomb = <A extends string|null|undefined>(a: A, b: A) => a === b ? a : (a && b) ? a + b : a ?? b;
    const updata: Omit<typeof p1,"id"|"createdAt"|"updatedAt"> = {
      //TODO: fix merge lede
      // name: ifeqelsecomb(basep.name, remp.name),
      // divisie: basep.divisie ?? remp.divisie,
      // user: basep.user ?? remp.user,
      // role: basep.role.includes("candidate") ? (remp.role.includes("candidate") ? basep.role : remp.role) : basep.role, //prefer non-candidate
      // dietary_requirements: basep.dietary_requirements, // what if mismatch
      // allergies_and_other: ifeqelsecomb(basep.allergies_and_other,remp.allergies_and_other),
      // special_needs: ifeqelsecomb(basep.special_needs,remp.special_needs),
    }
    console.log("Merging updata", updata) //TODO: reduce logging
    await payload.update({collection:"lede", id:basep.id, data:updata});
    await payload.delete({collection:"lede",id:remp.id});
    redirect(`/admin/collections/lede/${basep.id}`)
  })
