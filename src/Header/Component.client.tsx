'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import ServiceWorkerManager from "@/components/service-worker-manager";
import { UserMenu } from "@/Header/UserMenu";
import { Button } from "@/components/ui/button";

export interface HeaderClientProps {
  data: Header
  userData: {
    name: string | null | undefined,
    email: string | null | undefined,
    image: string | null | undefined
  },
  setupSlot?: React.ReactNode
}


export const HeaderClient: React.FC<HeaderClientProps> = ({ data, userData, setupSlot }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header className="container relative z-20   " {...(theme ? { 'data-theme': theme } : {})}>
      <div className="py-8 flex justify-between">
        <HeaderNav data={data} />
        <div className="flex items-center">
          <Link href="/">
            <Logo loading="eager" priority="high" /*className="invert dark:invert-0"*/ />
          </Link>
          <Link href="/">Seejol App</Link>
        </div>
        { userData.name && <UserMenu userData={userData} setupSlot={setupSlot} />}
        { !userData.name && !userData.email &&
          <Button asChild size="sm">
            <Link href={`/signin`}>
              Teken In
            </Link>
          </Button>
        }
      </div>
      <ServiceWorkerManager />
    </header>
  )
}
