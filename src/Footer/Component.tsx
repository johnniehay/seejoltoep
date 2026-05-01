import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from "@/Header/Nav";

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t border-border bg-[--background] ">
      <div className="container py-2 gap-8 flex flex-row justify-between relative">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>
        <HeaderNav data={footerData} />

        <div className="flex flex-row gap-4 items-center">
          <ThemeSelector />
          {/*<nav className="flex flex-row gap-4">*/}
          {/*  {navItems.map(({ link }, i) => {*/}
          {/*    return <CMSLink className="text-white" key={i} {...link} />*/}
          {/*  })}*/}
          {/*</nav>*/}
        </div>
      </div>
    </footer>
  )
}
