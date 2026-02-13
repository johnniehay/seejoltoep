'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'
import { Turnstile } from '@marsidev/react-turnstile'

import {
  sendMagicLink,
  registerWithPassword
} from './actions'
import { magicLinkSchema, passwordRegistrationSchema } from "@/app/(frontend)/registration/schema";

// --- Main Form Component ---

export function RegistrationForm({ className }: { className?: string }) {
  const [isPasswordMode, setIsPasswordMode] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  // Magic Link Form
  const magicLinkForm = useForm<z.infer<typeof magicLinkSchema>>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  // Password Form
  const passwordForm = useForm<z.infer<typeof passwordRegistrationSchema>>({
    resolver: zodResolver(passwordRegistrationSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', turnstileToken: '' },
  })

  async function onMagicLinkSubmit(data: z.infer<typeof magicLinkSchema>) {
    setIsLoading(true)
    setMessage(null)
    const res = await sendMagicLink(data)
    setIsLoading(false)

    if (res.error) {
      if (typeof res.error === 'string') {
        setMessage({ type: 'error', text: res.error })
      } else {
        // Handle field errors if any returned
        Object.entries(res.error).forEach(([key, msgs]) => {
          // @ts-ignore
          magicLinkForm.setError(key, { message: msgs[0] })
        })
      }
    } else if (res.success) {
      setMessage({ type: 'success', text: res.message || "Magic link sent!" })
    }
  }

  async function onPasswordSubmit(data: z.infer<typeof passwordRegistrationSchema>) {
    setIsLoading(true)
    setMessage(null)
    const res = await registerWithPassword(data)
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
      setMessage({ type: 'success', text: res.message || "Account created!" })
      // Optional: Redirect to login or sign in automatically
      setTimeout(() => router.push('/api/auth/signin'), 2000)
    }
  }

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'

  return (
    <div className={cn("grid gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>{isPasswordMode ? "Create an account" : "Sign in / Register"}</CardTitle>
          <CardDescription>
            {isPasswordMode
              ? "Enter your details below to create your account"
              : "Enter your email to receive a magic link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={cn("mb-4 p-3 rounded text-sm font-medium",
              message.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
              {message.text}
            </div>
          )}

          {!isPasswordMode ? (
            <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...magicLinkForm.register("email")}
                  />
                  {magicLinkForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{magicLinkForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Magic Link
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    disabled={isLoading}
                    {...passwordForm.register("email")}
                  />
                  {passwordForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
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
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    disabled={isLoading}
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
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
                  Create Account
                </Button>
              </div>
            </form>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <Button variant="outline" type="button" disabled={isLoading} className="w-full">
            {/* Placeholder Google Icon */}
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
            Google
          </Button>
        </CardContent>
        <CardFooter>
          <Button variant="link" className="w-full" onClick={() => {
            setIsPasswordMode(!isPasswordMode)
            setMessage(null)
          }}>
            {isPasswordMode ? "Back to Magic Link" : "Register with Password"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
