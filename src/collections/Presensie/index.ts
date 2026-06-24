import type { CollectionConfig, PayloadRequest, Where } from "payload";
import { checkPermission, checkPermissionOrWhere } from "@/access/checkPermission";

export const getlidgroepe = (payloadreq: PayloadRequest) => {
  const user = payloadreq.user
  console.log(`getlidgroepe ${payloadreq.user?.email} ${user?.self_lid} ${typeof user?.self_lid} ${typeof user?.self_lid !== "string" ? JSON.stringify(user?.self_lid?.groepe) : ""}`)
  if (!user?.self_lid || typeof user.self_lid === "string" || !user.self_lid.groepe) return []
  const groepids: string[] = []
  user.self_lid.groepe.forEach((groep) => {
    groepids.push(typeof groep === "string" ? groep : groep.id)
    if (typeof groep !== "string" && groep.subgroepe) groep.subgroepe.map((subgroep) => groepids.push(typeof subgroep === "string" ? subgroep : subgroep.id))
  })
  return groepids
}

export const wherelidgroepesigbaar = async (payloadreq: PayloadRequest) => {
  const lidgroepe = getlidgroepe(payloadreq)
  console.log(`wherelidgroepe ${payloadreq.user?.email} ${JSON.stringify(lidgroepe)}`)
  if (lidgroepe.length === 0) return false
  return { sigbaar_vir: { in: lidgroepe.join(",") } } as Where
}

export const Presensie: CollectionConfig<"presensie"> = {
  slug: "presensie",

  access: {
    create: checkPermission("create:presensie"),
    delete: checkPermission("remove:presensie"),
    read: checkPermissionOrWhere("view:presensie", wherelidgroepesigbaar),
    update: checkPermission("update:presensie"),
  },
  admin: {
    useAsTitle: "naam"
  },
  fields: [
    {name:"naam", type:"text", required:true, unique:true},
    {name:"id", type:"text", required:true, unique:true, admin:{description:"Optioneel vir spesifieke URL"}},
    {name:"presensie_tipe", type: "select",required:true,options:["bus","wagstaan","divisie"]},
    {name:"sigbaar_vir", type:"relationship", relationTo:"groepe", hasMany:true },
    {name:"self_inklok", type:"checkbox", required:true, defaultValue:false},
    {name:"notes_required", type:"checkbox", required:true, defaultValue:false, label: "Notes Required"},
    {name:"inklokke", type:"join", collection: "inklokke", on: "presensie",maxDepth: 2},
    {
      type: 'ui',
      name: 'addGroepLede',
      admin: {
        components: {
          Field: '@/collections/Presensie/add-groep-lede-button#AddGroepLedeButton',
        },
      },
    },
    {name:"verwagte_lede", type:"relationship", relationTo:"lede", hasMany:true}
  ],
  hooks: {
    beforeChange: [
      ({ operation, data }) => {
        // Only run on the initial creation of a document
        if (operation === 'create') {
          // If the user didn't provide an ID, generate a random one (UUIDv4)
          if (!data.id) {
            data.id =  String(Math.floor(10000000 + Math.random() * 90000000));
          }
        }
        return data;
      },
    ],
  },
}
