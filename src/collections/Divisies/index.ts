import type { CollectionConfig } from "payload";
import { anyone } from "@/access/anyone";
import {
  checkFieldPermission,
  checkFieldPermissionOrIf,
  checkPermission,
  checkPermissionOrWhere
} from "@/access/checkPermission";
import { divisieleierdivisiesquery, divisiewheredivisieleierReq } from "@/collections/Lede";
import { Permission } from "@/lib/roles";

const viewonlyunlesspermission = {
  create: checkFieldPermission("create:divisie"),
  read: () => true,
  update: checkFieldPermission("update:divisie"),
}

const checkFieldPermissionOrDivisieLeier = (permission: Permission) => checkFieldPermissionOrIf(permission,async (args) => {
    const { id, req: { user, payload } } = args
    // console.log("shared_contact update access", user?.role,getRoleFromUser(user), id, doc?.id)
    if (id === undefined) return true //not necessary to check divisieleier as just a pre-check
    const divisieids = await divisieleierdivisiesquery(user, payload)
    // console.log("shared_contact update access divisieids", divisieids)
    if (typeof id !== "string") {
      console.log("Got id as %s in Divisies shared_contact update access", typeof id, id)
      return false
    }
    return divisieids.includes(id);
  })

const viewonlybutdivisieleierupdateable = {
  ...viewonlyunlesspermission,
  update: checkFieldPermissionOrDivisieLeier("update:divisie"),
}

const viewdivisiedetailsbutdivisieleierupdateable = {
  create: checkFieldPermission("create:divisie"),
  read: checkFieldPermissionOrDivisieLeier("view:divisie:details"),
  update: checkFieldPermissionOrDivisieLeier("update:divisie"),
}

export const Divisies: CollectionConfig<"divisie"> = {
  slug: "divisie",
  // labels:{
  //   singular: "divisie",
  //   plural: "divisies"
  // },
  access: {
    create: checkPermission("create:divisie"),
    delete: checkPermission("remove:divisie"),
    read: anyone,
    update: checkPermissionOrWhere("update:divisie",divisiewheredivisieleierReq),
  },
  admin: {useAsTitle:"naam"},
  fields:[
    { name:"number", type:"text", required:true,unique:true, access:viewonlyunlesspermission }, //Afkorting
    { name:"naam", type:"text", required:true, unique:true, access:viewonlyunlesspermission },
    // Lys van Kursusse
    { name:"shared_contact", label:"Divisie contact details visible to other Divisies", type:"text",
      admin:{description:"Contact information that other divisies can use to get touch with you such as a divisie email or social-media page/handle"},
      access:viewonlybutdivisieleierupdateable,
    },
    { name:"lede", type:"join", collection:"lede", on:"divisie", defaultLimit:0, admin:{defaultColumns:["name","role"]}},
    { name:"aktiwiteite", type:"join", collection:"aktiwiteit", on:"divisies", defaultLimit:0},
  ]
}
