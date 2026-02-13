import type { GlobalConfig } from 'payload'
import { adminOnly } from "@/access/adminOnly";

export const SasImportSettingsGlobals: GlobalConfig = {
  slug: 'sas_import_settings',
  label: 'SAS Import Settings',
  access: {
    read: adminOnly,
    update: adminOnly,
  },
  fields: [
    {
      name: 'webhookUrl',
      label: 'SAS Webhook URL',
      type: 'text',
      required: true,
      admin: {
        description: 'The full webhook URL from SAS for the REST API.',
      },
    },
    {
      name: 'kampId',
      label: 'Current Kamp ID',
      type: 'text',
    },
    {
      name: 'kampNaam',
      label: 'Current Kamp Naam',
      type: 'text',
    },
  ],
}
