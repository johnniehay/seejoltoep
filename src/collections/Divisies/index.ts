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
import { slugify } from "payload/shared";

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
    { name:"id", type: "text", required: true, label: "ID Slug", access:viewonlyunlesspermission, admin: {
      position: "sidebar",
    },
      hooks:{beforeValidate: [({value, siblingData}) => {
        console.log(`divisie id beforeValidate ${value} ${slugify(siblingData.naam)} ${JSON.stringify(siblingData)}`)
        return (value ? value : slugify(siblingData.naam))
        }]  }
    },
    { name:"naam", type:"text", required:true, unique:true, access:viewonlyunlesspermission },
    { name:"afkorting", type:"text", required:true, unique:true, access:viewonlyunlesspermission },
    { name:"kleur", type:"text", access:viewonlyunlesspermission, admin:{description:"The main color associated with this division (e.g., 'Blou', 'Groen')"}},
    { name:"spesialisasies", type:"text", required:true, hasMany:true, minRows:1, access:viewonlyunlesspermission },
    { name:"kontak", label:"Divisie kontak detail(foon nommer of epoasadres)", type:"text",access:viewonlybutdivisieleierupdateable },
    {
      name: "hero_image",
      type: "upload",
      relationTo: "media",
      access: viewonlybutdivisieleierupdateable,
      admin: {
        description: "Main image for the division's hero section.",
      },
    },
    {
      name: "kort_sin",
      label: "Kort Sin (Hero Subtitel)",
      type: "text",
      access: viewonlybutdivisieleierupdateable,
      admin: {
        description: "A short descriptive sentence for the hero section.",
      },
    },
    {
      name: "hero_button_text",
      label: "Hero Knoppie Teks",
      type: "text",
      access: viewonlybutdivisieleierupdateable,
      admin: {
        description: "Text for the call-to-action button in the hero section (e.g., 'Sien program').",
      },
    },
    {
      name: "hero_button_link",
      label: "Hero Knoppie Skakel",
      type: "text",
      access: viewonlybutdivisieleierupdateable,
      admin: {
        description: "Link for the call-to-action button in the hero section.",
      },
    },
    {
      name: "beskrywing",
      label: "Wat is hierdie divisie? (Kort beskrywing)",
      type: "richText",
      access: viewonlybutdivisieleierupdateable,
    },
    {
      name: "grade",
      label: "Grade",
      type: "text",
      required:true,
      hasMany: true,
      access: viewonlyunlesspermission,
      admin: {
        description: "Age group or grade level for this division (e.g., 'Graad X').",
      },
    },
    {
      name: "whatsapp_link",
      label: "WhatsApp Skakel",
      type: "text",
      access: viewonlybutdivisieleierupdateable,
      admin: {
        description: "Link vir WhatsApp groep vir die divisie.(Opsioneel)",
      },
    },
    {
      name: "aktiwiteite_beskrywing",
      label: "Aktiwiteite Beskrywing",
      type: "richText",
      access: viewonlybutdivisieleierupdateable,
      admin: {
        description: "Description of activities for this division.",
      },
    },
    {
      name: "wat_om_saam_te_bring",
      label: "Wat om saam te bring",
      type: "richText",

      access: viewonlybutdivisieleierupdateable,
      admin: {
        description: "Information on what participants should bring.",
      },
    },
    {
      name: "dokumente",
      label: "Belangrike Dokumente",
      type: "array",
      access: viewonlybutdivisieleierupdateable,
      fields: [
        {
          name: "document",
          label: "Dokument",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "title",
          label: "Titel",
          type: "text",
        }
      ],
      admin: {
        description: "Important documents related to the division (e.g., Paklys, Reëls).",
      },
    },
    {
      name: "gallery",
      label: "Divisie Foto Gallery",
      type: "array",
      access: viewonlybutdivisieleierupdateable,
      fields: [
        {
          name: "image",
          label: "Beeld",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
      admin: {
        description: "A gallery of photos for the division.",
      },
    },
    { name:"groep", type:"relationship", relationTo: "groepe", access:viewonlyunlesspermission},
    {
      name: "divisieleier",
      label: "Divisieleier",
      type: "join",
      collection: "lede",
      on: "divisie",
      where: {rol: {equals: "divisieleier"}},
      // access: viewonlybutdivisieleierupdateable,
      admin: {
        allowCreate: false
      },
    },
    { name:"lede", type:"join", collection:"lede", on:"divisie", defaultLimit:0, admin:{defaultColumns:["name","role"]}},
    { name:"aktiwiteite", type:"join", collection:"aktiwiteit", on:"divisies", defaultLimit:0},
  ]
}
