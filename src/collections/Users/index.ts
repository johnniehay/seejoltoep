import type { CollectionConfig, PayloadRequest } from 'payload'

import { authenticated } from '@/access/authenticated'
import {
  checkFieldPermission,
  checkFieldPermissionOrIf,
  checkPermission,
  checkPermissionOrWhere
} from "@/access/checkPermission";

const whereMyself = (payloadreq: PayloadRequest)=> {
  if (payloadreq.user)
    return {id: {equals: payloadreq.user.id}}
  else
    return false
}

export const Users: CollectionConfig = {
  // populated by payload-authjs
  slug: 'users',
  access: {
    admin: authenticated,
    create: () => false,
    read: checkPermissionOrWhere("view:users",whereMyself),
    readVersions: () => false,
    update: checkPermissionOrWhere("update:users",whereMyself),
    // update: checkPermission("update:users"),
    delete: checkPermissionOrWhere("remove:users",whereMyself),
    unlock: checkPermission("update:users"),
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'email',
  },
  auth: {
    useSessions: false,
  },
  fields: [
    {
      name: "tipe",
      type: "select",
      label: "Gebruiker Tipe",
      options: [
        { label: "Jeuglid (Verkenner/PD)", value: "Jeuglid" },
        "Offisier",
        "Ouer"
      ],
      access: {
        create: () => false,
        read: checkFieldPermissionOrIf("view:users",({id,req:{user}}) => (user ? id === user.id : false )),
        update: checkFieldPermission("update:user:role")
      }
    },
    {
      name: "self_lid",
      type: "relationship",
      label: "Self Lid",
      relationTo: "lede",
      hasMany: false
    },
    {
      name: "gekoppelde_lede",
      type: "relationship",
      label: "Gekoppeld Lede",
      relationTo: "lede",
      hasMany: true
    },
    {
      name: "role",
      type: "text",
      label: "Role",
      access:{
        create: () => false,
        read: checkFieldPermissionOrIf("view:users",({id,req:{user}}) => (user ? id === user.id : false )),
        update: checkFieldPermission("update:user:role")
      }
    },
    {
      name: "emailVerified",
      type: "date",
      access: {
        create: () => false,
        read: checkFieldPermissionOrIf("view:users",({id,req:{user,payload}}) => (user ? id === undefined || (id === user.id) : false )),
        update: checkFieldPermission("update:users")
      },
    },
    {
      name: "candidate_self_lid_nommer",
      type: "text",
      admin: { readOnly: true, position: 'sidebar' },
      label: "Kandidaat Self Lidnommer"
    },
    {
      name: "candidate_self_lid_dob",
      type: "date",
      admin: { readOnly: true, position: 'sidebar' },
      label: "Kandidaat Self Geboortedatum"
    },
    {
      name: "candidate_self_lid_invalid_dob",
      type: "checkbox",
      admin: { readOnly: true, position: 'sidebar' },
      label: "Kandidaat Self Ongeldige Geboortedatum"
    },
    {
      name: "candidate_gekoppelde_lede",
      type: "array",
      label: "Kandidaat Gekoppelde Lede",
      admin: { readOnly: true },
      fields: [
        { name: "row_id", type: "text", admin: { readOnly: true } },
        { name: "lid_nommer", type: "text", label: "Lidnommer" },
        { name: "dob", type: "date", label: "Geboortedatum" },
        { name: "invalid_dob", type: "checkbox", label: "Ongeldige Geboortedatum" }
      ]
    },
  ],
  timestamps: true,
}
