import type { BasePayload, CollectionConfig, DefaultValue, Field, FieldAccess, FilterOptions, PayloadRequest, Where } from "payload";
import {
  checkConditionPermission,
  checkFieldPermission,
  checkPermission,
  checkPermissionOrWhere
} from "@/access/checkPermission";
import { updateuser } from "@/collections/Lede/hooks/updateuser";
// import snakeCase from "lodash/snakeCase";
import { getRoleFromUser, type UserWithIdRole } from "@/lib/get-role";
import { Inskrywings } from "../Inskrywings";
import {
  ledeAfterChangeGenerator,
  syncInskrywingHookGenerator
} from "@/collections/Lede/hooks/updateinskrywing";
import type { SasImportCollectionConfig } from "@/plugins/sas-import/types";
import { Lede as PayloadLede } from "@/payload-types";
import { getID } from "@/utilities/getID";
import { getlidgroepeinfo } from "@/collections/Groepe/access";
import { handleSasPaymentHook } from "@/collections/Lede/hooks/handleSasPaymentHook";

export const ledeRoleOptions = [
  { label: "Default", value: "default" },
  { label: "Besoeker", value: "besoeker" },
  { label: "Ouer", value: "ouer" },
  { label: "Kandidaat Jeuglid", value: "kanidaat-jeuglid" },
  { label: "Kandidaat Offisier", value: "kanidaat-offisier" },
  { label: "PD", value: "pd" },
  { label: "Verkenner", value: "verkenner" },
  { label: "Wagstaan", value: "wagstaan" },
  { label: "Offisier", value: "offisier" },
  { label: "Divisie Offisier", value: "divisieoffisier" },
  { label: "Kombuis", value: "kombuis" },
  { label: "Logistiek", value: "logistiek" },
  { label: "Nood Offisier", value: "noodoffisier" },
  { label: "Divisie Leier", value: "divisieleier" },
  { label: "Kampraad", value: "kampraad" },
  { label: "Kamp Leier", value: "kampleier" },
  { label: "Admin", value: "admin" },
];

export const ledeRoles = ledeRoleOptions.map((roleoption) => roleoption.value)

interface UserSelfLid {
  self_lid?: string | PayloadLede | null
}

export const divisieleierdivisiequery = (user: UserWithIdRole & UserSelfLid | null | undefined, payload: BasePayload)=> {
  if (getRoleFromUser(user) === "divisieleier") {
    if (!user?.self_lid || typeof user.self_lid === "string" || !user.self_lid.divisie) return
    if (user?.self_lid.rol === "divisieleier") {
      return user.self_lid.divisie
    }
  }
  return
}

export const divisieleierdivisieid = (user: UserWithIdRole & UserSelfLid | null | undefined, payload: BasePayload)=> {
  const divisie = divisieleierdivisiequery(user,payload)
  return divisie ? getID(divisie) : undefined
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
  return [divisieleierdivisieid(payloadreq.user, payloadreq.payload)]
}

export const wheredivisieleier = async (payloadreq: PayloadRequest) => {
  if (getRoleFromUser(payloadreq.user) === "divisieleier") {
    const divisieid = divisieleierdivisieid(payloadreq.user, payloadreq.payload)
    if (!divisieid) return false
    return {divisie:{equals:divisieid}} as Where
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

export const wherelidgroepeinfo = async (payloadreq: PayloadRequest) => {
  const lidgroepeinfo = getlidgroepeinfo(payloadreq)
  console.log(`wherelidgroepeinfo ${payloadreq.user?.email} ${JSON.stringify(lidgroepeinfo)}`)
  if (lidgroepeinfo.length === 0) return false
  return {groepe:{in:lidgroepeinfo.join(",")}} as Where
}

const defaultFieldUpdateAccess: {access:{update:FieldAccess}} = {access:{update:checkFieldPermission("update:lede")}}

const inheritedFieldNames: string[] = []

const inheritFields = (fields: Field[]): Field[] => {
  return fields
    .map((field): Field | null => {
      if (field.type === 'row' || field.type === 'collapsible' || field.type === 'group' || field.type === 'array') {
        return { ...field, fields: inheritFields(field.fields) };
      }
      if (field.type === 'tabs') {
        return {
          ...field,
          tabs: field.tabs.map(tab => ({
            ...tab,
            fields: inheritFields(tab.fields),
          })),
        };
      }
      if ((field.type === 'relationship' && field.relationTo === 'lede') || field.type === 'blocks') {
        return null;
      }
      inheritedFieldNames.push(field.name)
      return {
        ...field,
        virtual: `huidige_inskrywing.${field.name}`,
        admin: {
          ...(field.admin || {}),
          readOnly: false,
          description: `${field.admin && "description" in field.admin ? `${field.admin.description} | ` : ''}From Inskrywing`,
        },
        ...defaultFieldUpdateAccess,
      } as Field;
    })
    .filter((field): field is Field => field !== null);
};


const inskrywingsTabsField = Inskrywings.fields.find((f) => f.type === "tabs");
const inskrywingsTabs = inskrywingsTabsField && inskrywingsTabsField.type === "tabs" ? inskrywingsTabsField.tabs : [];

const tabsToInherit = inskrywingsTabs//inskrywingsTabs.filter((t) => ["Kamp & Logistiek", "Inskrywing Meta"].includes(t.label as string));

const tabsFromInskrywings = tabsToInherit.map((tab) => ({
  ...tab,
  fields: inheritFields(tab.fields),
}));

export const Lede: CollectionConfig<"lede"> = {
  slug: "lede",
  labels: {
    singular: "Lid",
    plural: "Lede"
  },
  custom: {
    sasImport: {
      enabled: true,
      keyField: 'id',
      displayColumns: ["naam", "noemnaam", "van", "id", "rol", "divisie"],
      updateHook: async (changes) => !("import_id" in changes && changes.import_id.new < changes.import_id.old),
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
        // soft_shell_baadjies: "Soft Shell baadjies",
        // seejol_hemp_kort: "Seejol Hemp (Kort)",
        verblyfreelings: "Verblyfreëlings",
        vervoer_na_mosselbaai: "Vervoer NA Mosselbaai",
        vervoer_vanaf_mosselbaai: "Vervoer VANAF Mosselbaai",
        hoeveelste_jaar_kamp_jy_op_seejol: "Hoeveelste jaar kamp jy op Seejol?",
        // qr_skakel: "QR Skakel",
        // qr_prent: "QR Prent",
      }
    } as SasImportCollectionConfig,
  },
  access: {
    create: checkPermission("create:lede"),
    delete: checkPermission("remove:lede"),
    read: checkPermissionOrWhere("view:lede",wherelidgroepeinfo),
    update: checkPermissionOrWhere("update:lede",wheredivisieleier),
  },
  admin: {
    useAsTitle: "vertoonnaam",
    defaultColumns: ["vertoonnaam", "van", "id", "rol", "divisie"],
    components: {
      beforeList: [
        '@/collections/Lede/merge-button#LedeMergeButton',
        '@/collections/Lede/add-to-groep-button#AddToGroepButton',
        '@/collections/Lede/LinkUsersButton#LinkUsersButton',
        '@/collections/Lede/LedeActionsButton#LedeActionsButton',
      ],
      afterList: [
        '@/collections/Lede/generatePDFserver#GeneratePDFButtonServer',
        '@/collections/Lede/generateCertificatePDFserver#GenerateCertificatePDFButtonServer',
      ],
    },
  },
  enableQueryPresets: true,
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
                { name: "user", type: "join", collection: "users", on:"self_lid", required: false, admin: { allowCreate: false, condition: checkConditionPermission("view:lede"),  } },
                { name: "divisie", type: "relationship", relationTo: "divisie", required: false, defaultValue: defaultdivisie, filterOptions: divisiewheredivisieleier , ...defaultFieldUpdateAccess},
                { name: "rol", type: "select", options: ledeRoleOptions, interfaceName: "ledeRole", ...defaultFieldUpdateAccess},
                { name: "huidige_inskrywing", type: "relationship", relationTo: "inskrywings", label: "Huidige Inskrywing", ...defaultFieldUpdateAccess },
                { name: "beursie", type: "relationship", relationTo: "beursies", label: "Gekoppelde Beursie", ...defaultFieldUpdateAccess },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "naam", type: "text", label: "Naam", ...defaultFieldUpdateAccess },
                { name: "van", type: "text", label: "Van", ...defaultFieldUpdateAccess },
                { name: "noemnaam", type: "text", label: "Noemnaam", ...defaultFieldUpdateAccess },
                { name: "vertoonnaam", type: "text", label: "Vertoon Naam", hooks: {afterRead: [({ siblingData, value }) => value ?? `${siblingData.noemnaam ?? siblingData.naam} ${siblingData.van}`]}, ...defaultFieldUpdateAccess}
              ]
            },
            {
              type: "row",
              fields: [
                { name: "geboortedatum", type: "date", required: true, label: "Geboortedatum", ...defaultFieldUpdateAccess },
                { name: "geslag", type: "text", label: "Geslag", ...defaultFieldUpdateAccess },
              ]
            },
            {
              type: "row",
              fields: [
                { name: "skoolgraad", type: "text", label: "Skoolgraad", ...defaultFieldUpdateAccess },
                { name: "posisie", type: "text", label: "Posisie", ...defaultFieldUpdateAccess },
                { name: "kommando", type: "text", label: "Kommando", ...defaultFieldUpdateAccess },
              ]
            },
            { name: "hoeveelste_jaar_kamp_jy_op_seejol", type: "text", label: "Hoeveelste jaar kamp jy op Seejol?", ...defaultFieldUpdateAccess },
            { name: "groepe", type: "relationship", relationTo: "groepe", hasMany: true },
            { name: "lid_inligting_sigbaar_vir_groepe", type: "relationship", relationTo: "groepe", hasMany: true },
          ]
        },
        {
          label: "Kontak Besonderhede",
          fields: [
            {
              type: "row",
              fields: [
                { name: "lid_eposadres", type: "email", label: "Lid Eposadres", ...defaultFieldUpdateAccess },
                { name: "lid_kontaknommer", type: "text", label: "Lid Kontaknommer", ...defaultFieldUpdateAccess },
              ]
            },
            {
              type: "collapsible",
              label: "Kontak Voor Kamp",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "kontakpersoon_voor_kamp", type: "text", label: "Kontakpersoon", ...defaultFieldUpdateAccess },
                    { name: "kontaknommer_voor_kamp", type: "text", label: "Kontaknommer", ...defaultFieldUpdateAccess },
                    { name: "eposadres_voor_kamp", type: "email", label: "Eposadres", ...defaultFieldUpdateAccess },
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
                    { name: "kontakpersoon_tydens_kamp", type: "text", label: "Kontakpersoon", ...defaultFieldUpdateAccess },
                    { name: "kontaknommer_tydens_kamp", type: "text", label: "Kontaknommer", ...defaultFieldUpdateAccess },
                    { name: "eposadres_tydens_kamp", type: "email", label: "Eposadres", ...defaultFieldUpdateAccess },
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
                    { name: "ma_volle_naam", type: "text", label: "Ma Volle Naam", ...defaultFieldUpdateAccess },
                    { name: "ma_kontaknommer", type: "text", label: "Ma Kontaknommer", ...defaultFieldUpdateAccess },
                    { name: "ma_eposadres", type: "email", label: "Ma Eposadres", ...defaultFieldUpdateAccess },
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
                    { name: "pa_volle_naam", type: "text", label: "Pa Volle Naam", ...defaultFieldUpdateAccess },
                    { name: "pa_kontaknommer", type: "text", label: "Pa Kontaknommer", ...defaultFieldUpdateAccess },
                    { name: "pa_eposadres", type: "email", label: "Pa Eposadres", ...defaultFieldUpdateAccess },
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
                    { name: "voog_volle_naam", type: "text", label: "Voog Volle Naam", ...defaultFieldUpdateAccess },
                    { name: "voog_kontaknommer", type: "text", label: "Voog Kontaknommer", ...defaultFieldUpdateAccess },
                    { name: "voog_eposadres", type: "email", label: "Voog Eposadres", ...defaultFieldUpdateAccess },
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
                { name: "mediese_fonds_naam", type: "text", label: "Mediese Fonds Naam", ...defaultFieldUpdateAccess },
                { name: "mediese_fonds_nommer", type: "text", label: "Mediese Fonds Nommer", ...defaultFieldUpdateAccess },
                { name: "mediese_fonds_afhanklikheidskode", type: "text", label: "Afhanklikheidskode", ...defaultFieldUpdateAccess },
              ]
            },
            { name: "allergiee", type: "textarea", label: "Allergieë", ...defaultFieldUpdateAccess },
            { name: "mediese_kondisies", type: "textarea", label: "Mediese Kondisies", ...defaultFieldUpdateAccess },
            { name: "kroniese_medikasie", type: "textarea", label: "Kroniese Medikasie", ...defaultFieldUpdateAccess },
            { name: "mediese_notas", type: "textarea", label: "Mediese Notas", ...defaultFieldUpdateAccess },
          ]
        },
        ...tabsFromInskrywings,
        {
          label: "Geskiedenis",
          fields: [
            {
              name: "inskrywings_geskiedenis",
              type: "join",
              collection: "inskrywings",
              on: "lid",
              label: "Inskrywings Geskiedenis",
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
    beforeChange: [syncInskrywingHookGenerator(inheritedFieldNames)],
    afterChange: [updateuser,ledeAfterChangeGenerator(inheritedFieldNames),handleSasPaymentHook]
  }
}
