import { CollectionConfig, Field } from "payload";
import { amountField, currencyField } from "@payloadcms/plugin-ecommerce";
import { currencies as currenciesConfig } from "@/plugins/index"
import { checkFieldPermission } from "@/access/checkPermission";

export const eItems: CollectionConfig = {
  slug: 'eitems',
  labels: {
    singular: 'eItem',
    plural: 'eItems',
  },
  access: {
    read: checkFieldPermission("admin:winkel"),
    update: checkFieldPermission("admin:winkel"),
    create: checkFieldPermission("admin:winkel"),
    delete: checkFieldPermission("admin:winkel"),
    readVersions: checkFieldPermission("admin:winkel")
  },
  versions: {
    drafts: true,
    maxPerDoc: 0
  },
  admin: {
    defaultColumns: ['product','variant', 'quantity', 'lidnommer', '_status'],
    group: 'Ecommerce',
  },
  enableQueryPresets: true,
  fields: [
    {
      name: 'product',
      type: 'relationship',
      label: 'Product',
      relationTo: 'products',
    },
    {
      name: 'variant',
      type: 'relationship',
      label: 'Variant',
      relationTo: 'variants',
    } ,
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 1,
      label: 'Quantity',
      min: 1,
      required: true,
    },
    amountField({ currenciesConfig }),
    currencyField({ currenciesConfig }),
    {
      name: 'lidnommer',
      type: 'text',
      label: 'Lidnommer',
      index: true
    },
    {
      name: 'customText',
      type: 'text',
      label: 'Custom Text',
    },
    {
      name: 'customPrice',
      type: 'number',
      label: 'Custom Price',
    },
  ]
}
