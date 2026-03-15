import { z } from 'zod'

export const magicLinkSignInSchema = z.object({
  email: z.email("Voer asseblief 'n geldige e-posadres in"),
})

export const passwordSignInSchema = z.object({
  email: z.email("Voer asseblief 'n geldige e-posadres in"),
  password: z.string().min(1, "Wagwoord word vereis"),
  turnstileToken: z.string().min(1, "Voltooi asseblief die sekuriteitskontrole"),
})
