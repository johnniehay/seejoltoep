import { Metadata } from "next"
import { CommonProviderWithStyle, SigninForm } from "./signin-form"
import { authConfig } from "@/auth.config"
import { CommonProviderOptions, Provider } from "next-auth/providers";
import { OAuthProviderButtonStyles } from "@auth/core/providers";
import { pick } from "lodash";




export const metadata: Metadata = {
  title: "Teken In",
  description: "Teken in op jou profiel.",
}

function objectKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

export default async function SigninPage(props: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const searchParams = await props.searchParams
  const { error, callbackUrl } = searchParams

  // Extract providers from authConfig
  const providers: CommonProviderWithStyle[] = authConfig.providers.map((provider ) => {
    // return pick(provider, ['id', 'name', 'type', 'style', 'enableConditionalUI','signinUrl','callbackUrl'])
    const { id, name, type, style, enableConditionalUI, signinUrl, callbackUrl } = provider as CommonProviderWithStyle
    return {
      id,
      name,
      type,
      style,
      enableConditionalUI,
      signinUrl,
      callbackUrl,
    }
  })

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/favicon.svg" alt="Logo" className="mr-2 h-6 w-6" />
          Seejol App
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Welkom terug! Teken in om toegang tot jou interaksiepaneel te kry en jou profiel te bestuur.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <SigninForm providers={providers} error={error} callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  )
}
