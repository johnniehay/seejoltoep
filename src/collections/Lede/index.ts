import { BasePayload, CollectionConfig, DefaultValue, FilterOptions, PayloadRequest, Where } from "payload";
import { checkConditionPermission, checkPermissionOrWhere } from "@/access/checkPermission";
import { updateuser } from "@/collections/Lede/hooks/updateuser";
import snakeCase from "lodash/snakeCase";
import { getRoleFromUser, type UserWithIdRole } from "@/lib/get-role";

export const ledeRoleOptions =[
  {label:"Divisie Leier",value:"divisieleier"},
  {label:"Mentor",value:"mentor"},
  {label:"Divisie Member",value:"divisie_member"},
  {label:"Supporter",value:"supporter"},
  {label:"Translator",value:"translator"},
  {label:"Day Visitor",value:"day_visitor"},
  {label:"Candidate divisieleier",value:"candidate-divisieleier"},
  {label:"Candidate Mentor",value:"candidate-mentor"},
  {label:"Candidate Divisie Member",value:"candidate-divisie_member"},
  {label:"Candidate Supporter",value:"candidate-supporter"},
  {label:"Candidate Translator",value:"candidate-translator"},
  {label:"Candidate Day Visitor",value:"candidate-day_visitor"},
  {label:"Affiliated",value:"affiliated"},
];

export const ledeRoles = ledeRoleOptions.map((roleoption) => roleoption.value)

const volunteerRolesLabels = ["Judge", "Referee", "Other Volunteer"]
export const volunteerRoleOptions = volunteerRolesLabels.map(role => {return {label: role, value: snakeCase(role)}});
export const volunteerRoles = volunteerRolesLabels.map(role => snakeCase(role));

export const dietaryOptions = ["None","Halal","Kosher","Vegetarian","Vegan","Other"]

export const divisieleierdivisiesquery = async (user: UserWithIdRole | null | undefined, payload: BasePayload)=> {
  if (getRoleFromUser(user) === "divisieleier") {
    const divisies = (await payload.find({
      collection: "lede",
      select: { divisie: true },
      depth:0,
      where: { and: [{ user: { equals: user?.id } }, { role: { equals: "divisieleier" } }] }
    })).docs
    return divisies.map(t => t.divisie)
  } else {
    return []
  }
}

export const persondivisiesquery = async (user: UserWithIdRole | null | undefined, payload: BasePayload, depth: number =0) => {
  // if (getRoleFromUser(user) === "divisieleier") {
  const divisies = (await payload.find({
    collection: "lede",
    select: { divisie: true },
    depth: depth,
    where: { user: { equals: user?.id } }
  })).docs
  return divisies.map(t => t.divisie)

}

const divisieleierdivisies = async (payloadreq: PayloadRequest) => {
  return divisieleierdivisiesquery(payloadreq.user, payloadreq.payload)
}

export const wheredivisieleier = async (payloadreq: PayloadRequest) => {
  if (getRoleFromUser(payloadreq.user) === "divisieleier") {
    const divisieids = await divisieleierdivisies(payloadreq)
    if (divisieids.length === 0) return false
    return {divisie:{in:divisieids.join(",")}} as Where
  } else {
    return false
  }
}

const divisiewheredivisieleier: FilterOptions = async ({req: payloadreq, user}) => {
  return divisiewheredivisieleierReq(payloadreq)
}

export const divisiewheredivisieleierReq = async (payloadreq: PayloadRequest) => {
  if (getRoleFromUser(payloadreq.user) === "divisieleier") {
    const divisieids = await divisieleierdivisies(payloadreq)
    if (divisieids.length === 0) return false
    return {id:{in:divisieids.join(",")}} as Where
  } else {
    return true
  }
}

const defaultdivisie: DefaultValue =  async ({req: payloadreq, user}) => {
  if (getRoleFromUser(user) === "divisieleier") {
    const divisieids = await divisieleierdivisies(payloadreq)
    if (divisieids.length === 1) {
      return divisieids[0]
    }
    return undefined
  } else {
    return undefined
  }
}

export const Lede: CollectionConfig<"lede"> = {
  slug: "lede",
  labels: {
    singular: "Lid",
    plural: "Lede"
  },
  custom: {
    googleSheets: {
      targets: [
        {
          name: "inskrywings",
          tabName: 'inskrywings',
          keyField: 'import_id',
          mapping: {
            import_id: "ID",
            import_name: "Name",
            created_on_import: "Created on",
            updated_on_import: "Updated on",
            responsible_person: "Responsible person",
            contact_import: "Contact",
            stage: "Stage",
            previous_stage: "Previous stage",
            currency: "Currency",
            amount: "Amount",
            last_timeline_activity_by: "Last timeline activity by",
            last_updated_on_import: "Last updated on",
            kamp: "Kamp",
            kamp_kursus: "Kamp - Kursus",
            lid_import_ref: "Lid",
            id: "Lidnommer",
            naam: "Naam",
            van: "Van",
            noemnaam: "Noemnaam",
            kamp_naam: "Kamp Naam",
            kamp_begindatum: "Kamp Begindatum",
            kamp_einddatum: "Kamp Einddatum",
            kamp_ligging: "Kamp Ligging",
            geboortedatum: "Geboortedatum",
            geslag: "Geslag",
            lid_eposadres: "Lid eposadres",
            kontaknommer_voor_kamp: "Kontaknommer voor Kamp",
            kontaknommer_tydens_kamp: "Kontaknommer tydens Kamp",
            kontakpersoon_tydens_kamp: "Kontakpersoon tydens Kamp",
            eposadres_tydens_kamp: "Eposadres tydens Kamp",
            kontakpersoon_voor_kamp: "Kontakpersoon voor Kamp",
            eposadres_voor_kamp: "Eposadres voor Kamp",
            lid_kontaknommer: "Lid Kontaknommer",
            skoolgraad: "Skoolgraad",
            posisie: "Posisie",
            kommando: "Kommando",
            ma_volle_naam: "Ma Volle naam",
            ma_kontaknommer: "Ma Kontaknommer",
            ma_eposadres: "Ma Eposadres",
            pa_volle_naam: "Pa Volle Naam",
            pa_kontaknommer: "Pa Kontaknommer",
            pa_eposadres: "Pa Eposadres",
            voog_volle_naam: "Voog Volle Naam",
            voog_kontaknommer: "Voog Kontaknommer",
            voog_eposadres: "Voog Eposadres",
            mediese_fonds_naam: "Mediese Fonds Naam",
            mediese_fonds_nommer: "Mediese Fonds Nommer",
            mediese_fonds_afhanklikheidskode: "Mediese Fonds Afhanklikheidskode",
            allergiee: "Allergieë",
            mediese_kondisies: "Mediese Kondisies",
            kroniese_medikasie: "Kroniese Medikasie",
            mediese_notas: "Mediese Notas",
            addisionele_notas: "Addisionele Notas",
            skakel_vir_kurses_opsie_1: "Skakel vir Kurses Opsie 1",
            kurses_opsie_1: "Kurses Opsie 1",
            skakel_vir_kurses_opsie_2: "Skakel vir Kurses Opsie 2",
            skakel_vir_kurses_opsie_3: "Skakel vir Kurses Opsie 3",
            kurses_opsie_2: "Kurses Opsie 2",
            kurses_opsie_3: "Kurses Opsie 3",
            inskrywer_se_epos: "Inskrywer se epos",
            bevestigingsepos_is_gestuur: "Bevestigingsepos is gestuur",
            kontak_tipe: "Kontak tipe",
            opsies: "Opsies",
            opsie_1_waglys: "Opsie 1: Waglys",
            opsie_2_waglys: "Opsie 2: Waglys",
            opsie_3_waglys: "Opsie 3: Waglys",
            betaling_ontvang: "Betaling Ontvang",
            products: "Products",
            soft_shell_baadjies: "Soft Shell baadjies",
            seejol_hemp_kort: "Seejol Hemp (Kort)",
            verblyfreelings: "Verblyfreëlings",
            vervoer_na_mosselbaai: "Vervoer NA Mosselbaai",
            vervoer_vanaf_mosselbaai: "Vervoer VANAF Mosselbaai",
            hoeveelste_jaar_kamp_jy_op_seejol: "Hoeveelste jaar kamp jy op Seejol?",
            qr_skakel: "QR Skakel",
            qr_prent: "QR Prent",
          }
        },
        {
          name: "LidAppData",
          tabName: "LidAppData",
          keyField: "id",
          mapping: {
            id: "Lidnommer",
            noemnaam: "Noemnaam",
            "divisie.naam": "Divisie",
            "user.email": "Gebruiker Epos"
          }
        }
      ]
    },
    sasImport: {
      enabled: true,
      keyField: 'import_id',
      mapping: {
        import_id: "ID",
        import_name: "Name",
        created_on_import: "Created on",
        updated_on_import: "Updated on",
        responsible_person: "Responsible person",
        contact_import: "Contact",
        stage: "Stage",
        previous_stage: "Previous stage",
        currency: "Currency",
        amount: "Amount",
        last_timeline_activity_by: "Last timeline activity added by",
        last_updated_on_import: "Last updated on",
        kamp: "Kamp",
        kamp_kursus: "Kamp - Kursus",
        lid_import_ref: "Lid",
        id: "Lidnommer",
        naam: "Naam",
        van: "Van",
        noemnaam: "Noemnaam",
        kamp_naam: "Kamp Naam",
        kamp_begindatum: "Kamp Begindatum",
        kamp_einddatum: "Kamp Einddatum",
        kamp_ligging: "Kamp Ligging",
        geboortedatum: "Geboortedatum",
        geslag: "Geslag",
        lid_eposadres: "Lid eposadres",
        kontaknommer_voor_kamp: "Kontaknommer voor Kamp",
        kontaknommer_tydens_kamp: "Kontaknommer tydens Kamp",
        kontakpersoon_tydens_kamp: "Kontakpersoon tydens Kamp",
        eposadres_tydens_kamp: "Eposadres tydens Kamp",
        kontakpersoon_voor_kamp: "Kontakpersoon voor Kamp",
        eposadres_voor_kamp: "Eposadres voor Kamp",
        lid_kontaknommer: "Lid Kontaknommer",
        skoolgraad: "Skoolgraad",
        posisie: "Posisie",
        kommando: "Kommando",
        ma_volle_naam: "Ma Volle naam",
        ma_kontaknommer: "Ma Kontaknommer",
        ma_eposadres: "Ma Eposadres",
        pa_volle_naam: "Pa Volle Naam",
        pa_kontaknommer: "Pa Kontaknommer",
        pa_eposadres: "Pa Eposadres",
        voog_volle_naam: "Voog Volle Naam",
        voog_kontaknommer: "Voog Kontaknommer",
        voog_eposadres: "Voog Eposadres",
        mediese_fonds_naam: "Mediese Fonds Naam ",
        mediese_fonds_nommer: "Mediese Fonds Nommer",
        mediese_fonds_afhanklikheidskode: "Mediese Fonds Afhanklikheidskode",
        allergiee: "Allergieë",
        mediese_kondisies: "Mediese Kondisies",
        kroniese_medikasie: "Kroniese Medikasie",
        mediese_notas: "Mediese Notas",
        addisionele_notas: "Addisionele Notas",
        skakel_vir_kurses_opsie_1: "Skakel vir Kurses Opsie 1 ",
        kurses_opsie_1: "Kurses Opsie 1",
        skakel_vir_kurses_opsie_2: "Skakel vir Kurses Opsie 2",
        skakel_vir_kurses_opsie_3: "Skakel vir Kurses Opsie 3",
        kurses_opsie_2: "Kurses Opsie 2 ",
        kurses_opsie_3: "Kurses Opsie 3 ",
        inskrywer_se_epos: "Inskrywer se epos",
        bevestigingsepos_is_gestuur: "Bevestigingsepos is gestuur",
        kontak_tipe: "Kontak tipe",
        opsies: "Opsies",
        opsie_1_waglys: "Opsie 1: Waglys",
        opsie_2_waglys: "Opsie 2: Waglys",
        opsie_3_waglys: "Opsie 3: Waglys",
        betaling_ontvang: "Betaling Ontvang",
        products: "Products",
        soft_shell_baadjies: "Soft Shell baadjies",
        seejol_hemp_kort: "Seejol Hemp (Kort)",
        verblyfreelings: "Verblyfreëlings",
        vervoer_na_mosselbaai: "Vervoer NA Mosselbaai",
        vervoer_vanaf_mosselbaai: "Vervoer VANAF Mosselbaai",
        hoeveelste_jaar_kamp_jy_op_seejol: "Hoeveelste jaar kamp jy op Seejol?",
        // qr_skakel: "QR Skakel",
        // qr_prent: "QR Prent",
      }
    },
  },
  access: {
    create: checkPermissionOrWhere("create:lede",wheredivisieleier),
    delete: checkPermissionOrWhere("remove:lede",wheredivisieleier),
    read: checkPermissionOrWhere("view:lede",wheredivisieleier),
    update: checkPermissionOrWhere("update:lede",wheredivisieleier),
  },
  admin: {
    useAsTitle: "naam",
    defaultColumns: ["naam", "van", "id", "rol", "divisie"],
    components: {
      beforeList: ['@/collections/Lede/merge-button#LedeMergeButton'],
    },
  },
  fields: [
    { name: "id", type: "text", required: true, label: "Lidnommer" }, //Moved outside as custom id does not work in tabs
    {
      type: "tabs",
      tabs: [
        {
          label: "Algemeen",
          fields: [
            {
              type: "row",
              fields: [
                { name: "user", type: "relationship", relationTo: "users", required: false, admin: { condition: checkConditionPermission("view:lede") } },
                { name: "divisie", type: "relationship", relationTo: "divisie", required: false, defaultValue: defaultdivisie, filterOptions: divisiewheredivisieleier },
                { name: "rol", type: "select", options: ledeRoleOptions, interfaceName: "ledeRole" },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "naam", type: "text", label: "Naam" },
                { name: "van", type: "text", label: "Van" },
                { name: "noemnaam", type: "text", label: "Noemnaam" },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "geboortedatum", type: "date", required: true, label: "Geboortedatum" },
                { name: "geslag", type: "text", label: "Geslag" },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "skoolgraad", type: "text", label: "Skoolgraad" },
                { name: "posisie", type: "text", label: "Posisie" },
                { name: "kommando", type: "text", label: "Kommando" },
              ]
            },
            { name: "hoeveelste_jaar_kamp_jy_op_seejol", type: "text", label: "Hoeveelste jaar kamp jy op Seejol?" },
          ]
        },
        {
          label: "Kontak Besonderhede",
          fields: [
            {
              type: "row",
              fields: [
                { name: "lid_eposadres", type: "email", label: "Lid Eposadres" },
                { name: "lid_kontaknommer", type: "text", label: "Lid Kontaknommer" },
              ]
            },
            {
              type: "collapsible",
              label: "Kontak Voor Kamp",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "kontakpersoon_voor_kamp", type: "text", label: "Kontakpersoon" },
                    { name: "kontaknommer_voor_kamp", type: "text", label: "Kontaknommer" },
                    { name: "eposadres_voor_kamp", type: "email", label: "Eposadres" },
                  ]
                }
              ]
            },
            {
              type: "collapsible",
              label: "Kontak Tydens Kamp",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "kontakpersoon_tydens_kamp", type: "text", label: "Kontakpersoon" },
                    { name: "kontaknommer_tydens_kamp", type: "text", label: "Kontaknommer" },
                    { name: "eposadres_tydens_kamp", type: "email", label: "Eposadres" },
                  ]
                }
              ]
            }
          ]
        },
        {
          label: "Familie",
          fields: [
            {
              type: "collapsible",
              label: "Ma",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "ma_volle_naam", type: "text", label: "Ma Volle Naam" },
                    { name: "ma_kontaknommer", type: "text", label: "Ma Kontaknommer" },
                    { name: "ma_eposadres", type: "email", label: "Ma Eposadres" },
                  ]
                }
              ]
            },
            {
              type: "collapsible",
              label: "Pa",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "pa_volle_naam", type: "text", label: "Pa Volle Naam" },
                    { name: "pa_kontaknommer", type: "text", label: "Pa Kontaknommer" },
                    { name: "pa_eposadres", type: "email", label: "Pa Eposadres" },
                  ]
                }
              ]
            },
            {
              type: "collapsible",
              label: "Voog",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "voog_volle_naam", type: "text", label: "Voog Volle Naam" },
                    { name: "voog_kontaknommer", type: "text", label: "Voog Kontaknommer" },
                    { name: "voog_eposadres", type: "email", label: "Voog Eposadres" },
                  ]
                }
              ]
            }
          ]
        },
        {
          label: "Medies",
          fields: [
            {
              type: "row",
              fields: [
                { name: "mediese_fonds_naam", type: "text", label: "Mediese Fonds Naam" },
                { name: "mediese_fonds_nommer", type: "text", label: "Mediese Fonds Nommer" },
                { name: "mediese_fonds_afhanklikheidskode", type: "text", label: "Afhanklikheidskode" },
              ]
            },
            { name: "allergiee", type: "textarea", label: "Allergieë" },
            { name: "mediese_kondisies", type: "textarea", label: "Mediese Kondisies" },
            { name: "kroniese_medikasie", type: "textarea", label: "Kroniese Medikasie" },
            { name: "mediese_notas", type: "textarea", label: "Mediese Notas" },
          ]
        },
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
        },
        {
          label: "System",
          fields: [
            { name: "syncedData", type: "json", admin: { readOnly: true, hidden: true } }
          ],
          hidden:true,
        }
      ]
    }
  ],
  hooks:{
    afterChange: [updateuser]
  }
}
