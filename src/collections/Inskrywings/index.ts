import { CollectionConfig } from "payload";
import { checkConditionPermission } from "@/access/checkPermission";

export const Inskrywings: CollectionConfig = {
  slug: "inskrywings",
  labels: {
    singular: "Inskrywing",
    plural: "Inskrywings",
  },
  admin: {
    useAsTitle: "import_name",
    defaultColumns: ["import_name", "lid", "kamp", "stage"],
  },
  access: {
    // Define appropriate access control here.
    // Currently open to admin/authenticated based on default Payload config or add specific checks.
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: "lid",
      type: "relationship",
      relationTo: "lede",
      required: true,
      label: "Lid",
      admin: {
        position: "sidebar",
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Kamp & Logistiek",
          fields: [
            {
              type: "row",
              fields: [
                { name: "kamp", type: "text", label: "Kamp" },
                { name: "kamp_kursus", type: "text", label: "Kamp Kursus" },
                { name: "kamp_naam", type: "text", label: "Kamp Naam" },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "kamp_begindatum", type: "date", label: "Kamp Begindatum" },
                { name: "kamp_einddatum", type: "date", label: "Kamp Einddatum" },
                { name: "kamp_ligging", type: "text", label: "Kamp Ligging" },
              ]
            },
            {
              type: "collapsible",
              label: "Kursus Keuses",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "kurses_opsie_1", type: "text", label: "Kursus Opsie 1" },
                    { name: "skakel_vir_kurses_opsie_1", type: "text", label: "Skakel Opsie 1" },
                  ]
                },
                {
                  type: "row",
                  fields: [
                    { name: "kurses_opsie_2", type: "text", label: "Kursus Opsie 2" },
                    { name: "skakel_vir_kurses_opsie_2", type: "text", label: "Skakel Opsie 2" },
                  ]
                },
                {
                  type: "row",
                  fields: [
                    { name: "kurses_opsie_3", type: "text", label: "Kursus Opsie 3" },
                    { name: "skakel_vir_kurses_opsie_3", type: "text", label: "Skakel Opsie 3" },
                  ]
                },
                { name: "opsies", type: "textarea", label: "Opsies" },
                {
                  type: "row",
                  fields: [
                    { name: "opsie_1_waglys", type: "text", label: "Opsie 1 Waglys" },
                    { name: "opsie_2_waglys", type: "text", label: "Opsie 2 Waglys" },
                    { name: "opsie_3_waglys", type: "text", label: "Opsie 3 Waglys" },
                  ]
                }
              ]
            },
            {
              type: "collapsible",
              label: "Logistiek & Produkte",
              fields: [
                { name: "products", type: "textarea", label: "Products" },
                {
                  type: "row",
                  fields: [
                    { name: "soft_shell_baadjies", type: "text", label: "Soft Shell Baadjies" },
                    { name: "seejol_hemp_kort", type: "text", label: "Seejol Hemp (Kort)" },
                  ]
                },
                { name: "verblyfreelings", type: "text", label: "Verblyfreëlings" },
                {
                  type: "row",
                  fields: [
                    { name: "vervoer_na_mosselbaai", type: "text", label: "Vervoer NA Mosselbaai" },
                    { name: "vervoer_vanaf_mosselbaai", type: "text", label: "Vervoer VANAF Mosselbaai" },
                  ]
                }
              ]
            }
          ]
        },
        {
          label: "Inskrywing Meta",
          fields: [
            {
              type: "row",
              fields: [
                { name: "import_id", type: "number", label: "Import ID" },
                { name: "import_name", type: "text", label: "Import Name" },
                { name: "lid_import_ref", type: "text", label: "Lid Import Ref" },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "created_on_import", type: "date", label: "Created On (Import)" },
                { name: "updated_on_import", type: "date", label: "Updated On (Import)" },
                { name: "last_updated_on_import", type: "date", label: "Last Updated On (Import)" },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "responsible_person", type: "number", label: "Responsible Person" },
                { name: "contact_import", type: "number", label: "Contact (Import)" },
                { name: "last_timeline_activity_by", type: "number", label: "Last Timeline Activity By" },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "stage", type: "text", label: "Stage" },
                { name: "previous_stage", type: "text", label: "Previous Stage" },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "currency", type: "text", label: "Currency" },
                { name: "amount", type: "number", label: "Amount" },
                { name: "betaling_ontvang", type: "text", label: "Betaling Ontvang" },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "inskrywer_se_epos", type: "email", label: "Inskrywer se Epos" },
                { name: "bevestigingsepos_is_gestuur", type: "text", label: "Bevestigingsepos Gestuur" },
                { name: "kontak_tipe", type: "select", label: "Kontak tipe", options: ["Volwassene", "Jeuglid"] },
              ]
            },
            { name: "addisionele_notas", type: "textarea", label: "Addisionele Notas" },
            {
              type: "row",
              fields: [
                { name: "qr_skakel", type: "text", label: "QR Skakel" },
                { name: "qr_prent", type: "text", label: "QR Prent" },
              ]
            }
          ]
        }
      ]
    }
  ]
}
