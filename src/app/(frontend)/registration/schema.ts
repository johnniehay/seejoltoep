import { z } from 'zod'

// Zod Schemas
export const magicLinkSchema = z.object({
  email: z.email("Voer asseblief 'n geldige e-posadres in"),
})

export const passwordRegistrationSchema = z.object({
  email: z.email("Voer asseblief 'n geldige e-posadres in"),
  password: z.string().min(8, "Wagwoord moet ten minste 8 karakters lank wees"),
  confirmPassword: z.string().min(8, "Wagwoord moet ten minste 8 karakters lank wees"),
  turnstileToken: z.string().min(1, "Voltooi asseblief die sekuriteitskontrole"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wagwoorde stem nie ooreen nie",
  path: ["confirmPassword"],
})
