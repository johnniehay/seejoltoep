'use client'

import React, { useState } from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon, Menu, X } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="flex items-center gap-3">
      <button
        className="md:hidden p-1"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle Navigation"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div
        className={`${
          isOpen ? 'flex' : 'hidden'
        } md:flex flex-col md:flex-row absolute md:static top-full left-0 w-full md:w-auto bg-[--background] md:bg-transparent p-4 md:p-0 gap-4 md:gap-3 border-b md:border-none shadow-lg md:shadow-none z-50`}
      >
        {navItems.map(({ link }, i) => {
          return <CMSLink key={i} {...link} appearance="link" />
        })}
        <Link href="/search">
          <span className="sr-only">Search</span>
          <SearchIcon className="w-5 text-primary" />
        </Link>
      </div>
    </nav>
  )
}
