import type { GlobalConfig } from 'payload'
import { checkPermission } from "@/access/checkPermission";

export const SystemSettings: GlobalConfig = {
  slug: 'system_settings',
  label: 'Stelsel Instellings',
  typescript: { interface: 'SystemSettings' },
  admin: {
    group: 'System',
  },
  access: {
    read: () => true,
    update: checkPermission('update:systemsettings')
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Groepe Beheer',
      fields: [
        {
          name: 'sync_groepe_where_filter_enabled',
          type: 'checkbox',
          label: 'Aktiveer Outomatiese Groepe Sincronisasie',
          defaultValue: true,
          admin: {
            description: 'Wanneer geaktiveer, sal die stelsel elke 5 minute lede outomaties by groepe voeg of verwyder gebaseerd op hulle "add_lede_where" filters.',
          },
        },
      ],
    },
    {
      name: 'betalings_kontak',
      type: 'richText',
      label: 'Betalings Kontak Inligting',
      admin: {
        description: 'Hierdie inligting word gewys wanneer iemand moet betaal (vervang "Seejol Finansies").',
      },
    },
  ],
}
