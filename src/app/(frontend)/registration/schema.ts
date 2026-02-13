import { z } from 'zod'

// Zod Schemas
export const magicLinkSchema = z.object({
  email: z.email("Please enter a valid email address"),
})

export const passwordRegistrationSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  turnstileToken: z.string().min(1, "Please complete the security check"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})
