import { z } from 'zod'

export const magicLinkSignInSchema = z.object({
  email: z.email("Please enter a valid email address"),
})

export const passwordSignInSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  turnstileToken: z.string().min(1, "Please complete the security check"),
})
