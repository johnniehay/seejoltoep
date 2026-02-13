import type { CollectionAfterChangeHook } from "payload";
import { Lede } from "@/payload-types";
import { ledeRoles } from "@/collections/Lede";


export const updateuser: CollectionAfterChangeHook<Lede> = async ({
                                                                  doc,
                                                                  previousDoc,
                                                                  req: { payload, context },
                                                                }) => {
  if (previousDoc.rol !== doc.rol) {
    if (doc.user) {
      const userid = typeof doc.user === "string" ? doc.user : doc.user.id;
      const userCurrent = await payload.findByID({collection:"users",id:userid, select:{role:true}})
      let updaterole = false
      //TODO: fix update user rol from lid
      // if (userCurrent.role) {
      //   const userCurrentRoleIdx = ledeRoles.indexOf(userCurrent.role)
      //   const newRoleIdx = ledeRoles.indexOf(doc.rol)
      //   if (newRoleIdx >= 0 && userCurrentRoleIdx >= 0 && newRoleIdx < userCurrentRoleIdx && !doc.rol.includes("candidate")){
      //     updaterole = true
      //   }
      // }
      if (updaterole) {
        await payload.update({ collection: "users", id: userid, data: { role: doc.rol } })
      }

    }
  }
}
