import { z } from 'zod'

const lidnommerRegex = /^\d{5,6}$/
const lidnommerError = "Lidnommer moet 'n 5 of 6 syfer nommer wees"
const dobError = "Geboortedatum word vereis"

const lidNommerSchema = z.string(lidnommerError).regex(lidnommerRegex, lidnommerError);
const dobSchema = z.iso.date(dobError);

// Optional versions that accept empty strings (for form handling)
const optionalLidNommer = z.union([lidNommerSchema, z.literal('')]).optional();
const optionalDob = z.union([dobSchema, z.literal('')]).optional();

export const MemberSchema = z.object({
  lid_nommer: lidNommerSchema,
  dob: dobSchema,
  invalid_dob: z.boolean().optional(),
  status: z.string().optional()
})

export const SettingsSchema = z.object({
  tipe: z.enum(["Jeuglid", "Offisier", "Ouer"]).optional(),
  hasYouth: z.boolean().optional(),
  isSelfMember: z.boolean().optional(),
})

export const LidFormSchema = z.object({
  lid_nommer: lidNommerSchema,
  dob: dobSchema,
})

export const SetupSchema = z.discriminatedUnion("tipe", [
  z.object({
    tipe: z.literal("Jeuglid"),
    self_lid_nommer: lidNommerSchema,
    self_lid_dob: dobSchema,
    hasYouth: z.boolean().optional(), // should only be false
    isSelfMember: z.boolean().optional(), // should  only be true
    children: z.array(MemberSchema).optional(),
  }),
  z.object({
    tipe: z.literal("Offisier"),
    self_lid_nommer: lidNommerSchema,
    self_lid_dob: dobSchema,
    hasYouth: z.boolean().optional(), // default false
    isSelfMember: z.boolean().optional(), // should only be true
    children: z.array(MemberSchema).optional(),
  }),
  z.object({
    tipe: z.literal("Ouer"),
    self_lid_nommer: optionalLidNommer,
    self_lid_dob: optionalDob,
    hasYouth: z.boolean().optional(), // should only be true
    isSelfMember: z.boolean().optional(), // default false
    children: z.array(MemberSchema).optional(),
  })
]).superRefine((data, ctx) => {
  if (data.tipe === 'Ouer') {
    if (data.isSelfMember) {
      if (!data.self_lid_nommer) {
        ctx.addIssue({
          code: "custom",
          message: lidnommerError,
          path: ['self_lid_nommer'],
        })
      }
      if (!data.self_lid_dob) {
        ctx.addIssue({
          code: "custom",
          message: dobError,
          path: ['self_lid_dob'],
        })
      }
    }
    if (!data.children || data.children.length === 0) {
       ctx.addIssue({
        code: "custom",
        message: "Voeg asseblief ten minste een lid by",
        path: ['children_count'],
      })
    }
  }
})
