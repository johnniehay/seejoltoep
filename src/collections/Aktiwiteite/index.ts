import type { CollectionConfig } from "payload";
import { checkPermission } from "@/access/checkPermission";
import { anyone } from "@/access/anyone";

export const Aktiwiteite: CollectionConfig<"aktiwiteit"> = {
  slug: "aktiwiteit",

  access: {
    create: checkPermission("create:aktiwiteit"),
    delete: checkPermission("remove:aktiwiteit"),
    read: anyone,
    update: checkPermission("update:aktiwiteit"),
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "begin", type: "date", required: true, admin:{date:{pickerAppearance: "dayAndTime",displayFormat:"EEE do MMM HH:mm"}} },
    { name: "einde", type: "date", required: true, admin:{date:{pickerAppearance: "dayAndTime",displayFormat:"EEE do MMM HH:mm"}} },
    { name: "aktiwiteitType", type: "select",required:true,options:["kamp","divisie","verkenners","offisiere","bus"]},
    { name: "beskrywing", type: "text" },
    { name: "presensie", type: "relationship", relationTo: "presensie" },
    { name: "virAlle", type: "select",options:["divisies","verkenners","offisiere"], hasMany:true },
    { name: "divisies", type: "relationship", relationTo:"divisie", hasMany:true },
  ]
}
