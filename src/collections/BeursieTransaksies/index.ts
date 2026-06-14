import type { CollectionConfig, PayloadRequest, Where } from 'payload'
import { checkPermission, checkPermissionOrWhere } from "@/access/checkPermission";
import { gekoppeldeledebeursies } from "@/collections/Beursies";

export const wheregekoppeldeledebeursies = async (payloadreq: PayloadRequest) => {
  const user = payloadreq.user
  if (user) {
    const beursiesIds = await gekoppeldeledebeursies(payloadreq)
    return beursiesIds.length > 0 ? {or:[{in:{in:beursiesIds.join(",")}},{out:{in:beursiesIds.join(",")}}]} as Where : false
  }
  return false
}

export const BeursieTransaksies: CollectionConfig = {
  slug: 'beursieTransaksies',
  labels: {
    singular: 'BeursieTransaksie',
    plural: 'BeursieTransaksies',
  },
  typescript: { interface: 'BeursieTransaksies' },
  access: {
    create: checkPermission("create:beursietransaksie"),
    read: checkPermissionOrWhere("view:beursietransaksie",wheregekoppeldeledebeursies),
    update: checkPermission("update:beursietransaksie"),
    delete: checkPermission("remove:beursietransaksie"),
  },
  admin: {
    useAsTitle: 'id',
    group: 'Financial',
    defaultColumns: ['amount', 'in', 'out', 'description', 'createdAt'],
  },
  fields: [
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      label: 'Bedrag',
    },
    {
      name: 'in',
      type: 'relationship',
      relationTo: 'beursies',
      label: 'In (Na Beursie)',
      index: true,
    },
    {
      name: 'out',
      type: 'relationship',
      relationTo: 'beursies',
      label: 'Uit (Vanaf Beursie)',
      index: true,
    },
    {
      name: 'description',
      type: 'text',
      label: 'Beskrywing',
      admin: { description: "Transaksie beskrywing wys vir gebruiker" }
    },
    {
      name: 'document',
      type: 'upload',
      relationTo: 'media', // Standard upload collection slug
      label: 'Bewys Dokument',
    },
    {
      name: 'eitem',
      type: 'relationship',
      relationTo: 'eitems',
      label: 'Geassosieerde eItem',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'inskrywing',
      type: 'relationship',
      relationTo: 'inskrywings',
      label: 'Geassosieerde Inskrywing',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
