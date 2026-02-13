'use server'

import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { headers } from 'next/headers'
import { magicLinkSchema, passwordRegistrationSchema } from "@/app/(frontend)/registration/schema";

// Initialize NextAuth to get the signIn function
const { signIn } = NextAuth(authConfig)



export type ActionResponse = {
  success?: boolean
  message?: string
  error?: Record<string, string[]> | string
}

export async function sendMagicLink(data: z.infer<typeof magicLinkSchema>): Promise<ActionResponse> {
  const validated = magicLinkSchema.safeParse(data)

  if (!validated.success) {
    return { error: z.flattenError(validated.error).fieldErrors }
  }

  try {
    await signIn('nodemailer', {
      email: validated.data.email,
      redirect: false,
    })
    return { success: true, message: "If an account exists, a magic link has been sent to your email." }
  } catch (error) {
    console.error("Magic Link Error:", error)
    // Generic error to avoid leaking user existence if strict
    return { error: "Failed to send magic link. Please try again." }
  }
}

export async function registerWithPassword(data: z.infer<typeof passwordRegistrationSchema>): Promise<ActionResponse> {
  const validated = passwordRegistrationSchema.safeParse(data)

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors as any }
  }

  const { email, password, turnstileToken } = validated.data

  // 1. Verify Turnstile Token
  const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1'
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY

  if (turnstileSecret) {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: turnstileSecret,
        response: turnstileToken,
        remoteip: ip,
      }),
    })

    const verifyJson = await verifyRes.json()
    if (!verifyJson.success) {
      return { error: { turnstileToken: ["Security check failed. Please try again."] } }
    }
  } else {
    console.warn("TURNSTILE_SECRET_KEY not set, skipping verification.")
  }

  // 2. Create User in Payload
  const payload = await getPayload({ config })

  try {
    // Check for existing user
    const existingUser = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
    })

    if (existingUser.totalDocs > 0) {
      return { error: { email: ["This email is already registered."] } }
    }

    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
      },
    })

    // 3. Attempt to sign in immediately (optional, but good UX)
    // We return success here and let the client handle the redirect or login flow
    return { success: true, message: "Account created successfully. You can now sign in." }
  } catch (error) {
    console.error("Registration Error:", error)
    return { error: "An unexpected error occurred during registration." }
  }
}
