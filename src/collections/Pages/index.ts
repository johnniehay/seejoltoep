import type { CollectionConfig } from 'payload'
import { checkPermission } from "@/access/checkPermission";

// Extended by PuckPlugin
export const PuckPages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: checkPermission("create:pages"),
    delete: checkPermission("remove:pages"),
    read: () => ({_status: {equals: 'published'}}),
    update: checkPermission("update:pages"),
    readVersions: checkPermission("update:pages")
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      hooks: {
        beforeDuplicate: [
          ({ value })=>{
            if (!value) return value;
            const copyMatch = value.match(/^(.+) \(Copy(?: (\d+))?\)$/);
            if (copyMatch) {
              const baseName = copyMatch[1];
              const copyNum = copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 2;
              return `${baseName} (Copy ${copyNum})`;
            }
            return `${value} (Copy)`;
          }
        ]
      }
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL path for this page (auto-generated from title)'
      },
      hooks: {
        beforeValidate: [
          ({ data, value })=>{
            if (data && !value && data.title) {
              return data.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
            }
            return value;
          }
        ],
        beforeDuplicate: [
          ({ value })=>{
            if (!value) return value;
            const copyMatch = value.match(/^(.+)-copy(?:-(\d+))?$/);
            if (copyMatch) {
              const baseName = copyMatch[1];
              const copyNum = copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 2;
              return `${baseName}-copy-${copyNum}`;
            }
            return `${value}-copy`;
          }
        ]
      }
    },
    {
      name: 'puckData',
      type: 'json',
      //TODO: add access permissions to limit who can edit this field
      admin: {
        hidden: false, // This makes the field visible in the UI
      },
    },
  ],
}
