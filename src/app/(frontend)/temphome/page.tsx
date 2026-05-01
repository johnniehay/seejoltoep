import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import {
  IconFirstAidKit,
  IconInfoCircle,
  IconListCheck,
  IconLogin2,
  IconQrcode,
  IconSearch,
  IconShield,
  IconShoppingCart,
  IconUsers,
} from '@tabler/icons-react'
import { hasPermission } from '@/lib/permissions'
import GekoppeldeLedeSummary from '@/app/(frontend)/temphome/GekoppeldeLedeSummary'
import { auth } from '@/auth'
// import Image from 'next/image'
import { ConstructionButton } from './ConstructionButton'
import { Metadata } from "next";

export default async function TempHome() {
  const canViewLede = await hasPermission('view:lede')
  const isOffisier = await hasPermission('view:offisier')
  const user = (await auth())?.user
  const self_lid = user?.self_lid

  // Changed w-full to flex-1 and added a min-width to allow growth while maintaining button size
  const btnClass = 'h-40 text-2xl rounded-3xl flex-col gap-4 shadow-lg hover:shadow-xl transition-all flex-1 min-w-[calc(50%-12px)] md:min-w-[calc(33.33%-16px)] lg:min-w-[calc(25%-18px)]'

  return (
    <div className="min-h-screen bg-slate-50 md:bg-[url('/seejolbackgroundwide.jpg')] bg-[url('/seejolbackgroundnarrow.jpg')] bg-[length:100%_auto]">
      {/* Header Image with top focus and bottom fade */}
      <div className="relative w-full h-[15vw] overflow-hidden">
        {/*<Image*/}
        {/*  src="/seejolheader.jpg"*/}
        {/*  alt="Seejol Header"*/}
        {/*  fill*/}
        {/*  className="object-cover object-top"*/}
        {/*  priority*/}
        {/*  */}
        {/*/>*/}
        {/* Gradient fade to transparent at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 invisible" />
      </div>

      <div className="container mx-auto py-10 px-4 flex flex-col items-center gap-12 -mt-8 relative z-10">
        {!user && (
          <Button
            asChild
            className="h-40 text-4xl font-bold rounded-3xl gap-8 w-full max-w-4xl shadow-xl"
            variant="default"
          >
            <Link href="/lid">
              <IconLogin2 size={48} />
              <span>Teken in</span>
            </Link>
          </Button>
        )}

        {user && <GekoppeldeLedeSummary />}

        {/* Flexbox container instead of grid */}
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
          <Button asChild className={btnClass} variant="outline">
            <Link href="/tuis">
              <IconInfoCircle color="#38b6ff" size={48} />
              <span>Inligting</span>
            </Link>
          </Button>
          <Button asChild className={btnClass} variant="outline">
            <Link href="/inskrywingsinligting">
              <IconLogin2 color="#0b844d" size={48} />
              <span>Skryf in</span>
            </Link>
          </Button>
          {/* Functional Buttons */}
          {canViewLede && (
            <Button asChild className={btnClass} variant="outline">
              <Link href="/lid">
                <IconSearch size={48} />
                <span>Lid Soek</span>
              </Link>
            </Button>
          )}
          {self_lid && (
            <Button asChild className={btnClass} variant="outline">
              <Link href="/qr/my">
                <IconQrcode size={48} />
                <span>My QR</span>
              </Link>
            </Button>
          )}
          {user && (
            <Button asChild className={btnClass} variant="outline">
              <Link href="/presensie">
                <IconListCheck color="#7ed957" size={48} />
                <span>Presensies</span>
              </Link>
            </Button>
          )}

          {/* Construction Buttons */}
          <ConstructionButton icon={<IconFirstAidKit color="#ff3131" size={48}/>} className={btnClass}>
            Noodhulp
          </ConstructionButton>
          {isOffisier && (
            <ConstructionButton icon={<IconShield color="#ff751f" size={48}/>} className={btnClass}>
              Wagstaan
            </ConstructionButton>
          )}
          <Button asChild className={btnClass} variant="outline">
            <Link href="/shop">
              <IconShoppingCart color="#5284e2" size={48} />
              <span>Winkel</span>
            </Link>
          </Button>
          <ConstructionButton icon={<IconUsers color="#cb6ce6" size={48}/>} className={btnClass}>
            My Divisie
          </ConstructionButton>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: "Interaksiepaneel | Seejol Toep",
  description: "Hoof Interaksiepaneel(Dashboard) van Seejol Voortrekkerkamp Toep)"
}
