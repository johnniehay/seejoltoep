import type { CollectionConfig } from 'payload'
import { checkConditionPermission, checkPermissionOrWhere } from "@/access/checkPermission";
import { addLidtoGroepInfoOnCreate } from "./hooks/addLidtoGroepInfoOnCreate";
import { divisieleierdivisiequery } from "@/collections/Lede";
import { hasPermissionReq } from "@/lib/permissions-payload";
import { getDocNotID } from "@/utilities/getDocNotID";
import {
  getlidgroepeinfo,
  isdivisieleier,
  isdivisieleier_and_lidgroepeinfo_and_divisiesubgroep,
  wherelidgroepeinfo
} from "@/collections/Groepe/access";

export const Groepe: CollectionConfig = {
  slug: 'groepe',
  labels:{
    singular: 'Groep',
    plural: 'Groepe',
  },
  access: {
    create: checkPermissionOrWhere("create:groepe",isdivisieleier),
    delete: checkPermissionOrWhere("remove:groepe",isdivisieleier_and_lidgroepeinfo_and_divisiesubgroep),
    read: checkPermissionOrWhere("view:groepe",wherelidgroepeinfo),
    update: checkPermissionOrWhere("update:groepe",wherelidgroepeinfo),
  },
  admin: {
    useAsTitle: 'naam',
  },
  fields: [
    {
      name: 'naam',
      type: 'text',
      required: true,
    },
    {
      name: 'tipe',
      type: 'select',
      options: [
        { label: 'Vervoer', value: 'vervoer' },
        { label: 'Divisie', value: 'divisie' },
        { label: 'DivisieSubGroep', value: 'divisie_subgroep' },
        { label: 'Tent', value: 'tent' },
        { label: 'Kennisgewing', value: 'kennisgewing' }
      ],
      filterOptions: ({req: payloadreq, options,data, siblingData}) => {
        if (hasPermissionReq("update:groepe",payloadreq.user)) return options
        const divisiegroep = getDocNotID(divisieleierdivisiequery(payloadreq.user,payloadreq.payload))?.groep
        console.log(`groepTipefilterOptions ${divisiegroep} ${siblingData.id}`)
        if (getlidgroepeinfo(payloadreq).length > 0)
          return options.filter((option) => (typeof option === 'string'?option:option.value).includes( divisiegroep === siblingData.id ? "divisie": "divisie_subgroep"))
        return []
      },
      defaultValue: ({user}) => hasPermissionReq("update:groepe",user)?null:'divisie_subgroep'
    },
    {
      name: 'subgroepe',
      type: 'relationship',
      relationTo: 'groepe',
      hasMany: true,
    },
    {
      name: 'add_lede_where',
      label: 'Add lede where',
      type: "json",
      admin: {
        description: 'JSON "where" query to filter which lede gets added to the group automatically',
        condition: checkConditionPermission("update:groepe")
      },
      jsonSchema: {
        uri: 'a://b/where.json',
        fileMatch: ['a://b/where.json'],
        schema: {
          type: 'object',
          description: 'Payload "where" query object',
          // Allow any valid JSON structure for the where clause
          // This is a simplified schema, a more robust one would validate against Payload's query syntax
          additionalProperties: true,
        },
      },
    },
    {
      name: 'remove_lede_not_in_where',
      label: 'Remove lede not in where',
      type: "checkbox",
      admin: {
        condition: checkConditionPermission("update:groepe")
      },
    },
    {
      name: 'lede',
      type: 'join',
      collection: 'lede',
      on: 'groepe',
      admin:{allowCreate:false}
    },
    {
      name: 'users',
      type: 'join',
      collection: 'users',
      on: 'groepe',
      admin:{
        allowCreate:false,
        condition: checkConditionPermission("view:users")
      }
    },
  ],
  hooks: {afterChange:[addLidtoGroepInfoOnCreate]}
}
