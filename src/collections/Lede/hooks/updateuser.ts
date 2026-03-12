import type { CollectionAfterChangeHook } from "payload";
import { Lede, User } from "@/payload-types";
import { ledeRoles } from "@/collections/Lede";
import { Role } from "@/lib/roles";


export const defaultRoleFromLid: (lid: Lede) => Role = (lid) => {
  if (lid.posisie === "Verkenner") return "verkenner"
  if (lid.posisie === "Penkop/Drawwertjie") return "pd"
  if (lid.kamp_kursus?.toLowerCase().includes("kombuis")) return "kombuis"
  if (lid.kamp_kursus?.toLowerCase().includes("logistiek")) return "logistiek"
  if (lid.kamp_kursus?.toLowerCase().includes("noodhulp")) return "noodoffisier"
  if (lid.posisie === "Offisier") return "offisier"
  if (lid.posisie === "Staatmaker") return "offisier"
  if (lid.posisie === "Jeugvriend") return "offisier"
  return "default"
}

export const getUpdatedRole = (lid: Lede, userCurrentRole?:string|null, ) => {
  const docrol = lid.rol ?? defaultRoleFromLid(lid)
  let updaterole = false
  // TODO: update lid rol,divisie from inskrywing, update user tipe from lid on year change
  const userCurrentRoleIdx = ledeRoles.indexOf(userCurrentRole as string)
  const newRoleIdx = ledeRoles.indexOf(docrol as string)
  if (newRoleIdx >= 0 && newRoleIdx > userCurrentRoleIdx){
    updaterole = true
  }

  return  updaterole ? { role: docrol } : {}
}

export const updateuser: CollectionAfterChangeHook<Lede> = async ({
                                                                  doc,
                                                                  previousDoc,
                                                                  req: { payload, context },
                                                                }) => {
  // payload.logger.warn(`updateuser: pdoc.rol:${previousDoc.rol} doc.rol:${doc.rol} ${JSON.stringify(defaultRoleFromLid(previousDoc))} ${JSON.stringify(defaultRoleFromLid(doc))}`)
  if (previousDoc.rol !== doc.rol || (!doc.rol && defaultRoleFromLid(previousDoc) !== defaultRoleFromLid(doc)) ) {
    // payload.logger.warn(`updateuser: doc.user.docs?:${(doc.user?.docs)?'true':'false'} len${doc.user?.docs?.length} ${JSON.stringify(doc.user)}`)
    const lidusers = await payload.find({collection:"users",where:{self_lid:{equals:doc.id}}, select:{role:true}})
    if (lidusers.totalDocs > 0) {
      const docuser = lidusers.docs[0]
      // payload.logger.warn(`updateuser: docuser:${JSON.stringify(docuser)}`)
      // const userCurrent = typeof docuser === "string" ? await payload.findByID({collection:"users",id:docuser, select:{role:true}}) : docuser
      const userCurrent = docuser
      const userRoleUpdate = getUpdatedRole(doc)//, userCurrent.role)
      // payload.logger.warn(`updateuser: userRoleUpdate:${JSON.stringify(userRoleUpdate)} userCurrent.role:${userCurrent.role}`)
      // const docrol = doc.rol ?? defaultRoleFromLid(doc)
      // let updaterole = false
      // // TODO: update lid rol,divisie from inskrywing, update user tipe from lid on year change
      // if (userCurrent.role) {
      //   const userCurrentRoleIdx = ledeRoles.indexOf(userCurrent.role)
      //   const newRoleIdx = ledeRoles.indexOf(docrol as string)
      //   if (newRoleIdx >= 0 && userCurrentRoleIdx >= 0 && newRoleIdx > userCurrentRoleIdx){
      //     updaterole = true
      //   }
      // }
      if (Object.keys(userRoleUpdate).length > 0) {
        await payload.update({ collection: "users", id: userCurrent.id, data: userRoleUpdate })
      }

    }
  }
}
