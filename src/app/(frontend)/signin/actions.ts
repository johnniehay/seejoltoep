'use server'

import { z } from 'zod'
import { AuthError } from 'next-auth'
import { headers } from 'next/headers'
import { signIn } from "@/auth"
import { magicLinkSignInSchema, passwordSignInSchema } from './schema'



export type ActionResponse = {
  success?: boolean
  message?: string
  error?: Record<string, string[]> | string
}

export async function signInWithMagicLink(data: z.infer<typeof magicLinkSignInSchema>, callbackUrl?: string): Promise<ActionResponse> {
  const validated = magicLinkSignInSchema.safeParse(data)

  if (!validated.success) {
    return { error: z.flattenError(validated.error).fieldErrors as any }
  }

  try {
    await signIn('nodemailer', {
      email: validated.data.email,
      redirect: false,
      redirectTo: callbackUrl,
    })
    return { success: true, message: "Kyk in jou e-pos vir 'n inteken skakel." }
  } catch (error) {
    console.error("Magic Link Error:", error)
    return { error: "Kon nie die inteken skakel stuur nie. Probeer asseblief weer." }
  }
}

export async function signInWithPassword(data: z.infer<typeof passwordSignInSchema>, callbackUrl?: string): Promise<ActionResponse> {
  const validated = passwordSignInSchema.safeParse(data)

  if (!validated.success) {
    return { error: z.flattenError(validated.error).fieldErrors as any }
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
      return { error: { turnstileToken: ["Sekuriteitskontrole het misluk. Probeer asseblief weer."] } }
    }
  }

  // 2. Attempt Sign In
  try {
    const signinres = await signIn("payload-local", {
      email,
      password,
      redirect: false,
      redirectTo: callbackUrl,
    })
    console.log(`signinres ${JSON.stringify(signinres)}`)
    return { success: true, message: `Suksesvol ingeteken.` }
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return { error: "Ongeldige e-pos of wagwoord." }
      }
    }
    throw error // Rethrow to allow redirect if successful (though redirect:false is used above) or other errors
  }
}
