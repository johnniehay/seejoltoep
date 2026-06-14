import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'
import { checkPermission } from "@/access/checkPermission";

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: checkPermission("admin:winkel"),
    delete: checkPermission("admin:winkel"),
    read: anyone,
    update: checkPermission("admin:winkel"),
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
