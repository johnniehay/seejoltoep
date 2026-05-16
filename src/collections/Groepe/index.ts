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
        { label: 'Kennisgewing', value: 'kennisgewing' }
      ],
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
      admin:{allowCreate:false}
    },
  ],
}
