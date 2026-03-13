import type { CollectionConfig } from 'payload'

export const Groepe: CollectionConfig = {
  slug: 'groepe',
  labels:{
    singular: 'Groep',
    plural: 'Groepe',
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
      ],
    },
    {
      name: 'subgroepe',
      type: 'relationship',
      relationTo: 'groepe',
      hasMany: true,
    },
    {
      name: 'lede',
      type: 'join',
      collection: 'lede',
      on: 'groepe',
      admin:{allowCreate:false}
    },
  ],
}
