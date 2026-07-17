import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import {
  IconCertificate,
  IconFirstAidKit,
  IconHelp,
  IconInfoCircle,
  IconListCheck,
  IconLogin2,
  IconMessageReport,
  IconQrcode,
  IconSearch,
  IconShield,
  IconShoppingCart,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react'
import { hasPermission } from '@/lib/permissions'
import GekoppeldeLedeSummary from '@/app/(frontend)/temphome/GekoppeldeLedeSummary'
import { auth } from '@/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
// import Image from 'next/image'
import { ConstructionButton } from './ConstructionButton'
import { Metadata } from "next";
import { getDocNotID } from "@/utilities/getDocNotID";
import { getID } from "@/utilities/getID";
import { cn } from "@/utilities/ui";

export default async function TempHome() {
  const canViewLede = await hasPermission('view:lede')
  const isOffisier = await hasPermission('view:offisier')
  const user = (await auth())?.user
  const self_lid = getDocNotID(user?.self_lid)

  const user_divisie_string = self_lid?.divisie ? getID(self_lid.divisie) : null
  const user_divisie = getDocNotID(self_lid?.divisie)

  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({
    slug: 'sas_import_settings',
  })
  const inskrywings_link = settings.inskrywings_link
  const self_beursie_balance = (self_lid && typeof self_lid !== 'string' && typeof self_lid.beursie === 'object') ? (self_lid.beursie as any)?.balance : 0

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
        <iframe className="w-full h-[200%] scale-50 origin-top-left ml-[23%]" src={"https://logwork.com/widget/countdown/?text=Dae%20tot%20Seejol%2025%20Junie%20%E2%80%93%204%20Julie%202027&timezone=Africa%2FJohannesburg&width=&style=columns&uid=760869&loc=https://logwork.com/countdown-timer&language=af&textcolor=%23dddddd&date=2027-06-25%2017%3A00&digitscolor=%23dddddd&unitscolor=%23305e96&url=nullsrcdoc"}/>
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

        <Button
          asChild
          className="h-24 text-xl md:text-2xl font-bold rounded-3xl w-full max-w-6xl shadow-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all"
          variant="default"
        >
          <Link href="https://forms.gle/HTpPd5Bq4p82fuae9" target="_blank" rel="noopener noreferrer">
            <span className="text-center">
              Voltooi die Kamp Evalueringsvorm ↗
            </span>
          </Link>
        </Button>

        {/* Flexbox container instead of grid */}
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
          {user_divisie || user_divisie_string ? (
            <Button asChild className={btnClass} variant="outline">
              <Link href={`/divisie/${user_divisie_string}`}>
                <IconUsers color="#cb6ce6" size={48} />
                <div className="flex flex-col items-center">
                  <span>My Divisie</span>
                  {user_divisie && (
                    <span className="text-sm font-normal opacity-70 leading-none">
                      {user_divisie.naam}
                    </span>
                  )}
                </div>
              </Link>
            </Button>
          ) : (
            <ConstructionButton icon={<IconUsers color="#cb6ce6" size={48} />} className={btnClass}>
              My Divisie
            </ConstructionButton>
          )}
          {inskrywings_link && (
            <Button asChild className={btnClass} variant="outline">
              <Link href={inskrywings_link}>
                <IconLogin2 color="#0b844d" size={48} />
                <span>Skryf in</span>
              </Link>
            </Button>
          )}
          {/* Functional Buttons */}
          {canViewLede && (
            <Button asChild className={btnClass} variant="outline">
              <Link href="/lid">
                <IconSearch size={48} />
                <span>Lid Soek</span>
              </Link>
            </Button>
          )}
          {false && self_lid && (
            <Button asChild className={btnClass} variant="outline">
              <Link href="/qr/my">
                <IconQrcode size={48} />
                <span>My QR</span>
              </Link>
            </Button>
          )}
          {user_divisie && self_lid && (
            <Button asChild className={btnClass} variant="outline">
              <Link href={`/lid/${self_lid.id}/sertifikaat`}>
                <IconCertificate size={48} />
                <span>My Sertifikaat</span>
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

          <Button asChild className={btnClass} variant="outline">
            <Link href="/rapporteer">
              <IconMessageReport color="#ff3131" size={48} />
              <span>Rapporteer</span>
            </Link>
          </Button>

          <Button asChild className={btnClass} variant="outline">
            <Link href="/noodhulp">
              <IconFirstAidKit color="#ff3131" size={48} />
              <span>Noodhulp</span>
            </Link>
          </Button>

          {/* Construction Buttons */}
          {isOffisier && (
            <ConstructionButton icon={<IconShield color="#ff751f" size={48}/>} className={btnClass}>
              Wagstaan
            </ConstructionButton>
          )}
          {user && self_lid && typeof self_lid !== 'string' && self_lid.beursie && (
            <Button
              asChild
              className={cn(
                btnClass,
                (self_beursie_balance || 0) < 0 && 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
              )}
              variant="outline"
            >
              <Link href={`/beursie/${getID(self_lid.beursie)}`}>
                <IconWallet color={(self_beursie_balance || 0) < 0 ? "#ef4444" : "#5284e2"} size={48} />
                <div className="flex flex-col items-center">
                  <span>My Beursie</span>
                  <span className="text-sm font-normal opacity-70 leading-none">
                    R {(self_beursie_balance || 0).toFixed(2)}
                  </span>
                </div>
              </Link>
            </Button>
          )}
          <Button asChild className={btnClass} variant="outline">
            <Link href="/shop">
              <IconShoppingCart color="#5284e2" size={48} />
              <span>Winkel</span>
            </Link>
          </Button>
          <Button asChild className={btnClass} variant="outline">
            <Link href="/tuis">
              <IconInfoCircle color="#38b6ff" size={48} />
              <span>Inligting</span>
            </Link>
          </Button>
          <Button asChild className={btnClass} variant="outline">
            <Link href="/toep_hulp">
              <IconHelp color="#ffbc00" size={48} />
              <span>Toep Hulp</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: "Interaksiepaneel | Seejol Toep",
  description: "Hoof Interaksiepaneel(Dashboard) van Seejol Voortrekkerkamp Toep)"
}
