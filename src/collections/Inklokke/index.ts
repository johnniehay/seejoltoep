import { checkPermission } from "@/access/checkPermission";
import { CollectionConfig } from "payload";


export const Inklokke: CollectionConfig<"inklokke"> = {
  slug: "inklokke",
  labels: {
    plural: "Inklokke",
    singular: "Inklok"
  },
  access: {
    create: checkPermission("create:inklok"),
    delete: checkPermission("remove:inklok"),
    read: checkPermission("view:inklok"),
    update: checkPermission("update:inklok"),
  },
  admin:{
    defaultColumns: ["presensie","lid","tipe","scan_time"]
  },
  fields: [
    { name: "presensie", type:"relationship", relationTo: "presensie", required: true },
    { name: "divisie", type: "relationship", relationTo: "divisie" },
    { name: "lid", type: "relationship", relationTo: "lede"},
    { name: "ingestuur_deur", type:"relationship", relationTo: "users", required: true, label: "Ingestuur Deur"},
    {
      name: "tipe",
      type: "select",
      options: [
        { label: "In", value: "in" },
        { label: "Uit", value: "uit" },
      ],
      defaultValue: "in",
      required: true,
    },
    {
      name: "scan_time",
      type: "date",
      required: true,
      label: "Scan Tyd"
    }
  ],
}
