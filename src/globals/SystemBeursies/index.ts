import type { GlobalConfig } from 'payload'
import { checkPermission } from "@/access/checkPermission";

export const SystemBeursies: GlobalConfig = {
  slug: 'system_beursies',
  label: 'Stelsel Beursies',
  typescript:{interface: 'SystemBeursies'},
  admin: {
    group: 'Financial',
  },
  access: {
    read: () => true,
    update: checkPermission('update:systembeursies')
  },
  fields: [
    {
      name: 'bankrekening',
      type: 'relationship',
      relationTo: 'beursies',
      label: 'Bankrekening Beursie',
      required: true,
    },
    {
      name: 'kampgeld_inkomste',
      type: 'relationship',
      relationTo: 'beursies',
      label: 'Kampgeld Inkomste Beursie',
      required: true,
      admin:{description: 'Hierdie beursie word gebruik as die "In" beursie vir kampgeld fakture.'},
    },
    {
      name: 'kampbetalings_category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Kampbetalings Kategorie',
      required: true,
      admin: { description: 'Produkte in hierdie kategorie word as direkte kampbetalings hanteer.' }
    },
    {
      name: 'softycomp_beursie',
      type: 'relationship',
      relationTo: 'beursies',
      label: 'Softycomp (Bank) Beursie',
      required: true,
    },
    {
      name: 'winkel_beursie',
      type: 'relationship',
      relationTo: 'beursies',
      label: 'Winkel Inkomste Beursie',
      required: true,
    },
    {
      name: 'snoepie_inbetaling_product',
      type: 'relationship',
      relationTo: 'products',
      label: 'Snoepie Inbetaling Produk',
      required: true,
    },
    {
      name: 'aanpasbare_kampbetaling_product',
      type: 'relationship',
      relationTo: 'products',
      label: 'Aanpasbare Kampbetaling Produk',
      required: true,
      admin: { description: 'Hierdie produk word gebruik vir oop betalings op uitstaande beursie balanse.' }
    },
  ],
}
