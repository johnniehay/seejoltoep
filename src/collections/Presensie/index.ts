import { CollectionConfig } from "payload";
import { checkPermission } from "@/access/checkPermission";
import { anyone } from "@/access/anyone";

export const Presensie: CollectionConfig<"presensie"> = {
  slug: "presensie",

  access: {
    create: checkPermission("create:presensie"),
    delete: checkPermission("remove:presensie"),
    read: anyone,
    update: checkPermission("update:presensie"),
  },
  admin: {
    useAsTitle: "naam"
  },
  fields: [
    {name:"naam", type:"text", required:true, unique:true},
    {name:"id", type:"text", required:true, unique:true},
    {name:"presensie_tipe", type: "select",required:true,options:["bus","wagstaan","divisie"]},
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
  ]
}
