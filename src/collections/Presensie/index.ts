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
    {name:"abbreviation", type:"text", required:true, unique:true},
    {name:"presensie_tipe", type: "select",required:true,options:["robotgame","robotgame-queue","judging","judging-queue","cultural","general","pit","volunteer"]},
    {name:"inklokke", type:"join", collection: "inklokke", on: "presensie",maxDepth: 2},
    {name:"verwagte_lede", type:"relationship", relationTo:"lede", hasMany:true}
  ]
}
