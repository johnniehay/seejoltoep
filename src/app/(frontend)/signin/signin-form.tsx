'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { signIn as signInWebAuthn } from 'next-auth/webauthn'
import { webauthnScript } from "@/lib/webauthn-client.js"
import { Turnstile } from '@marsidev/react-turnstile'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'

import { signInWithMagicLink, signInWithPassword } from './actions'
import { magicLinkSignInSchema, passwordSignInSchema } from './schema'
import { CommonProviderOptions } from "next-auth/providers";
import { AppProvider, OAuthProviderButtonStyles } from "@auth/core/providers";

// Error map from builtin-signin.tsx
const signinErrors: Record<string, string> = {
  default: "Kan nie inteken nie.",
  Signin: "Probeer met 'n ander profiel inteken.",
  OAuthSignin: "Probeer met 'n ander profiel inteken.",
  OAuthCallbackError: "Probeer met 'n ander profiel inteken.",
  OAuthCreateAccount: "Probeer met 'n ander profiel inteken.",
  EmailCreateAccount: "Probeer met 'n ander profiel inteken.",
  Callback: "Probeer met 'n ander profiel inteken.",
  OAuthAccountNotLinked:
    "Om jou identiteit te bevestig, teken in met dieselfde profiel wat jy oorspronklik gebruik het.",
  EmailSignin: "Die e-pos kon nie gestuur word nie.",
  CredentialsSignin: "Inteken het misluk. Maak seker die besonderhede is korrek.",
  SessionRequired: "Teken asseblief in om toegang tot hierdie bladsy te verkry.",
}

function ConditionalUIScript(providerID: string) {
  const startConditionalUIScript = `
const currentURL = window.location.href;
const authURL = currentURL.substring(0, currentURL.lastIndexOf('/'));
(${webauthnScript})(authURL, "${providerID}");
`
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: startConditionalUIScript }} />
    </>
  )
}

export interface CommonProviderWithStyle extends AppProvider {
  style?: OAuthProviderButtonStyles
  enableConditionalUI?: boolean
}

export function SigninForm({ className, providers, error, callbackUrl }: { className?: string, providers: CommonProviderWithStyle[], error?: string, callbackUrl?: string }) {
  const credentialsProvider = providers.find(p => p.type === 'credentials')
  const emailProvider = providers.find(p => p.type === 'email')
  const webAuthnProvider = providers.find(p => p.type === 'webauthn')
  const oauthProviders = providers.filter(p => p.type === 'oauth' || p.type === 'oidc').map(
    (prov) => { return {...prov,style: {...prov.style,logo: `https://authjs.dev/img/providers/${prov.id}.svg`}}})
  // Determine initial mode: prefer password if available, otherwise magic link
  const [isPasswordMode, setIsPasswordMode] = React.useState(!emailProvider && !!credentialsProvider)
  const [isLoading, setIsLoading] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(
    error ? { type: 'error', text: signinErrors[error] || signinErrors.default } : null
  )
  const router = useRouter()

  // Magic Link Form
  const magicLinkForm = useForm<z.infer<typeof magicLinkSignInSchema>>({
    resolver: zodResolver(magicLinkSignInSchema),
    defaultValues: { email: '' },
  })

  // Password Form
  const passwordForm = useForm<z.infer<typeof passwordSignInSchema>>({
    resolver: zodResolver(passwordSignInSchema),
    defaultValues: { email: '', password: '', turnstileToken: '' },
  })

  const toggleMode = () => {
    const newMode = !isPasswordMode
    setIsPasswordMode(newMode)
    setMessage(null)

    if (newMode) {
      const email = magicLinkForm.getValues("email")
      passwordForm.setValue("email", email)
      passwordForm.clearErrors("email")
    } else {
      const email = passwordForm.getValues("email")
      magicLinkForm.setValue("email", email)
      magicLinkForm.clearErrors("email")
    }
  }

  async function onMagicLinkSubmit(data: z.infer<typeof magicLinkSignInSchema>) {
    setIsLoading(true)
    setMessage(null)
    const res = await signInWithMagicLink(data, callbackUrl)
    setIsLoading(false)

    if (res.error) {
      if (typeof res.error === 'string') {
        setMessage({ type: 'error', text: res.error })
      } else {
        Object.entries(res.error).forEach(([key, msgs]) => {
          // @ts-ignore
          magicLinkForm.setError(key, { message: msgs[0] })
        })
      }
    } else if (res.success) {
      setMessage({ type: 'success', text: res.message || "Inteken skakel gestuur!" })
    }
  }

  async function onPasswordSubmit(data: z.infer<typeof passwordSignInSchema>) {
    setIsLoading(true)
    setMessage(null)
    const res = await signInWithPassword(data, callbackUrl)
    setIsLoading(false)

    if (res.error) {
      if (typeof res.error === 'string') {
        setMessage({ type: 'error', text: res.error })
      } else {
        Object.entries(res.error).forEach(([key, msgs]) => {
          // @ts-ignore
          passwordForm.setError(key, { message: msgs[0] })
        })
      }
    } else if (res.success) {
      setMessage({ type: 'success', text: "Suksesvol ingeteken!" })
      router.push(callbackUrl || '/') // Redirect to home or dashboard
      router.refresh()
    }
  }

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  const conditionalUIProviderID = providers.find(
    (provider) => provider.type === "webauthn" && provider.enableConditionalUI
  )?.id

  const emailInput = (
    <div className="grid gap-2">
      <Label htmlFor="email">E-pos</Label>
      <Input
        id="email"
        placeholder="name@example.com"
        type="email"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect="off"
        disabled={isLoading}
        defaultValue={isPasswordMode ? passwordForm.getValues("email") : magicLinkForm.getValues("email")}
        {...(isPasswordMode ? passwordForm.register("email") : magicLinkForm.register("email"))}
      />
      {(isPasswordMode ? passwordForm.formState.errors.email : magicLinkForm.formState.errors.email) && (
        <p className="text-sm text-red-500">
          {(isPasswordMode ? passwordForm.formState.errors.email : magicLinkForm.formState.errors.email)?.message}
        </p>
      )}
    </div>
  )

  return (
    <div className={cn("grid gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Teken In</CardTitle>
          <CardDescription>Voer jou e-pos in om in te teken</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={cn("mb-4 p-3 rounded text-sm font-medium",
              message.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
              {message.text}
            </div>
          )}

          {/* OAuth Providers - Top Priority */}
          {oauthProviders.length > 0 && (
            <>
              <div className="grid gap-2">
                {oauthProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    variant="outline"
                    type="button"
                    disabled={isLoading}
                    className="w-full"
                    onClick={() => signIn(provider.id, { redirectTo: callbackUrl ?? '/' })}
                  >
                    {provider.style?.logo && (
                      <img
                        src={provider.style.logo}
                        alt=""
                        className="mr-2 h-4 w-4"
                        loading="lazy"
                      />
                    )}
                    Teken in met {provider.name}
                  </Button>
                ))}
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Of teken in met</span></div>
              </div>
            </>
          )}

          {/* Email Form (Magic Link) - Always visible if enabled */}
          {emailProvider && !isPasswordMode && (
            <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}>
              <div className="grid gap-4">
                {emailInput}
                <Button disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Stuur Inteken Skakel E-pos
                </Button>
              </div>
            </form>
          )}

          {/* WebAuthn / Passkey */}
          {webAuthnProvider && (
             <div className="mt-4">
                {/* TODO: fix passkey callbackUrl not working */}
                <Button variant="secondary" className="w-full" onClick={() => signInWebAuthn(webAuthnProvider.id, { redirectTo: callbackUrl ?? '/' })}>
                  Teken in met Wagwoordsleutel
                </Button>
             </div>
          )}

          {/* Password Form - Expandable at bottom */}
          {credentialsProvider && (
            <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-background px-2 text-muted-foreground h-auto py-0.5 flex items-center gap-1"
                  onClick={toggleMode}
                >
                  {isPasswordMode ? "Gebruik Inteken Skakel" : "Teken in met Wagwoord"}
                  {isPasswordMode ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {isPasswordMode && (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <div className="grid gap-4">
                {emailInput}
                <div className="grid gap-2">
                  <Label htmlFor="password">Wagwoord</Label>
                  <Input
                    id="password"
                    type="password"
                    disabled={isLoading}
                    {...passwordForm.register("password")}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.password.message}</p>
                  )}
                </div>

                {turnstileSiteKey && (
                  <div className="flex justify-center">
                    <Turnstile
                      siteKey={turnstileSiteKey}
                      onSuccess={(token) => passwordForm.setValue('turnstileToken', token, { shouldValidate: true })}
                      className="my-4"
                    />
                  </div>
                )}
                {passwordForm.formState.errors.turnstileToken && (
                  <p className="text-sm text-red-500 text-center">{passwordForm.formState.errors.turnstileToken.message}</p>
                )}

                <Button disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Teken In
                </Button>
              </div>
            </form>
            )}
            </>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground text-center w-full">
            Het jy nie 'n profiel nie?{" "}
            <Link href="/registration" className="underline underline-offset-4 hover:text-primary">
              Skep 'n Profiel
            </Link>
          </div>
        </CardFooter>
      </Card>
      {conditionalUIProviderID && ConditionalUIScript(conditionalUIProviderID)}
    </div>
  )
}
