import { Metadata } from "next"
import { RegistrationForm } from "./registration-form"
import { authConfig } from "@/auth.config"
import { CommonProviderWithStyle } from "../signin/signin-form"

export const metadata: Metadata = {
  title: "Registrasie",
  description: "Registreer deur 'n profiel te skep.",
}

export default async function RegistrationPage() {
  const providers: CommonProviderWithStyle[] = authConfig.providers.map((provider) => {
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
              &ldquo;Sluit aan by ons platform vir toegang tot kamp inligting en funksies.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <RegistrationForm providers={providers} />
        </div>
      </div>
    </div>
  )
}
