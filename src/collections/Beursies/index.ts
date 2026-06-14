import type { CollectionConfig, FieldHookArgs, PayloadRequest, Where } from 'payload'
import { Beursies as PayloadBeursies } from "@/payload-types";
import { checkPermission, checkPermissionOrWhere } from "@/access/checkPermission";
import { getID } from "@/utilities/getID";

export const gekoppeldeledebeursies = async(payloadreq: PayloadRequest) => {
  const user = payloadreq.user
  if (!user) return []
  const beursiesIds: string[] = []
  if (user.self_lid && typeof user.self_lid !== "string" && user.self_lid.beursie){
    beursiesIds.push(getID(user.self_lid.beursie))
  }
  if (user.gekoppelde_lede && user.gekoppelde_lede.length > 0){
    beursiesIds.push(...user.gekoppelde_lede.filter((lid) => typeof lid !== 'string')
      .map((lid) => lid.beursie)
      .filter((beursie) => !!beursie && typeof beursie === "object")
      .map((beursie) => (getID(beursie))))
  }
  return beursiesIds
}

export const wheregekoppeldeledebeursies = async (payloadreq: PayloadRequest) => {
  const user = payloadreq.user
  if (user) {
    const beursiesIds = await gekoppeldeledebeursies(payloadreq)
    return beursiesIds.length > 0 ? {id:{in:beursiesIds.join(",")}} as Where : false
  }
  return false
}

export const Beursies: CollectionConfig = {
  slug: 'beursies',
  labels: {
    singular: 'Beursie',
    plural: 'Beursies',
  },
  typescript: { interface: 'Beursies' },
  access: {
    create: checkPermission("create:beursie"),
    read: checkPermissionOrWhere("view:beursie",wheregekoppeldeledebeursies),
    update: checkPermission("update:beursie"),
    delete: checkPermission("remove:beursie"),
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'balance'],
    group: 'Financial',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Naam',
      hooks: {afterRead: [({ siblingData, value }:FieldHookArgs<any,string,PayloadBeursies>) => value || (siblingData?.lede?.docs?.map((lid) => typeof lid !== 'string' ? `${lid.vertoonnaam} ${lid.id}` : lid).join(' ') ?? siblingData?.divisies?.docs?.map((divisie) => typeof divisie !== 'string' ? divisie.naam : divisie).join(' ') ?? '')]}
    },
    {
      name: 'invert_display',
      type: 'checkbox',
      label: 'Inverteer Vertoning',
      defaultValue: false,
      admin: { description: 'Indien aan, word die balans en transaksie-rigting omgedraai vir bates (soos bankrekeninge).' }
    },
    {
      name: 'balance',
      type: 'number',
      label: 'Balans',
      virtual: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return 0

            // Query all transactions related to this wallet
            const transactions = await req.payload.find({
              collection: 'beursieTransaksies',
              depth: 0,
              limit: 0, // Adjust based on expected transaction volume or use aggregation
              req,
              where: {
                or: [
                  { in: { equals: data.id } },
                  { out: { equals: data.id } },
                ],
              },
            })

            const totalIn = transactions.docs
              .filter((t) => (typeof t.in === 'string' ? t.in === data.id : t.in?.id === data.id))
              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

            const totalOut = transactions.docs
              .filter((t) => (typeof t.out === 'string' ? t.out === data.id : t.out?.id === data.id))
              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

            return totalIn - totalOut
          },
        ],
      },
    },
    {
      name: 'in',
      type: 'join',
      collection: 'beursieTransaksies',
      on: 'in',
      label: 'In Transaksies',
      defaultLimit: 0
    },
    {
      name: 'out',
      type: 'join',
      collection: 'beursieTransaksies',
      on: 'out',
      label: 'Uit Transaksies',
      defaultLimit: 0
    },
    {
      name: 'lede',
      type: 'join',
      collection: 'lede',
      on: 'beursie',
      label: 'Gekoppelde Lede',
    },
    {
      name: 'divisies',
      type: 'join',
      collection: 'divisie',
      on: 'beursie',
      label: 'Gekoppelde Divisies',
    }
  ],
}
