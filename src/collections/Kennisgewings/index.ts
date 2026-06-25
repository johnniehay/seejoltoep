import { CollectionConfig } from "payload";
import { checkPermission, checkPermissionOrWhere } from "@/access/checkPermission";
import { sendPushNotification } from "./hooks/sendPushNotification";
import { wherelidgroepeinfo } from "@/collections/Lede";

export const Kennisgewings: CollectionConfig<"kennisgewings"> = {
  slug: "kennisgewings",
  labels: {
    plural: "Kennisgewings",
    singular: "Kennisgewing"
  },
  access: {
    create: checkPermissionOrWhere("create:kennisgewing",wherelidgroepeinfo),
    delete: checkPermission("remove:kennisgewing"),
    read: checkPermission("view:kennisgewing"),
    update: checkPermissionOrWhere("update:kennisgewing",wherelidgroepeinfo),
  },
  admin:{
    defaultColumns: ['title', 'body', 'groepe'],
    baseFilter: async ({req: payloadreq}) => {
      const lgi = await wherelidgroepeinfo(payloadreq)
      return lgi ? lgi : null
    },
    useAsTitle: 'title'
  },
  versions: {
    drafts: {
      schedulePublish: true
    },
  },
  fields: [
    { name: "title", label:"Opskrif", type:"text", required: true },
    { name: "body", label:"Boodskap Opsomming", type:"textarea", required: true, admin: { description:"Opsomming van die kennisgewing, word in Push kennisgewing gewys" } },
    { name: "detail", label:"Boodskap Detail", type: "richText"},
    { name: "notify", label: "Notify",type: "checkbox", defaultValue: true, admin: { description:"Stuur 'n Push kennisgewing" } },
    { name: "manual_confirmation", label: "Require Manual Confirmation", type: "checkbox",defaultValue: false },
    { name: "visble_until", label: "Sigbaar Tot", type: "date", admin:{date:{pickerAppearance: "dayAndTime",displayFormat:"EEE do MMM HH:mm"}}},

    { name: "groepe", label: "Groepe", type: "relationship", relationTo:"groepe", hasMany: true, index: true, },
    {
      type: "group",
      fields: [
        { name: "icon", label: "Ikoon", type: "upload", relationTo: "media" }, // defaultValue?
        { name: "image", label: "Foto", type: "upload", relationTo: "media" },
        { name: "tag", label: "Tag", type: "text" },
        { name: "timestamp", label: "Timestamp", type: "date",admin:{date:{pickerAppearance: "dayAndTime",displayFormat:"EEE do MMM HH:mm"}} },
        { name: "navigate", label: "Navigeer URL", type: "text" }
      ]
    }

  ],
  hooks: { // Add the hooks property
    afterChange: [sendPushNotification],
  },
}
