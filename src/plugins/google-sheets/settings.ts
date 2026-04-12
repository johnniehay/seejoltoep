import type { GlobalConfig } from 'payload'

export const GoogleSheetsSettingsGlobal: GlobalConfig = {
  slug: 'google_sheets_settings',
  label: 'Google Sheets Settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: ({ req: { user } }) => !!user?.role?.includes('admin'),
    update: ({ req: { user } }) => !!user?.role?.includes('admin'),
  },
  fields: [
    {
      name: 'sheetId',
      type: 'text',
      required: true,
      admin: {
        description: 'The Google Spreadsheet ID (found in the URL)',
      },
    },
    {
      name: 'collections',
      type: 'array',
      required: true,
      defaultValue: [],
      fields: [
        {
          name: 'slug',
          label: 'Collection Slug',
          type: 'text', // Or 'select' if you want to dynamically fetch slugs
          required: true,
        },
        {
          name: 'targets',
          type: 'array',
          required: true,
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'tabName',
              type: 'text',
              required: true,
            },
            {
              name: 'keyField',
              type: 'text',
              defaultValue: 'id',
              required: true,
            },
            {
              name: 'mapping',
              type: 'json',
              jsonSchema: {
                uri: 'a://b/mapping.json',
                fileMatch: ['a://b/mapping.json'],
                schema: {
                  type: 'object',
                  additionalProperties: { type:'string' }
                }
              },
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
