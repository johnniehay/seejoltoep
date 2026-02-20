import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import { IconListCheck, IconQrcode, IconSearch } from '@tabler/icons-react'
import { hasPermission } from '@/lib/permissions'
import GekoppeldeLedeSummary from "@/app/(frontend)/temphome/GekoppeldeLedeSummary";
import { auth } from "@/auth";

export default async function TempHome() {
  const canViewLede = await hasPermission('view:lede')
  const self_lid = (await auth())?.user?.self_lid

  return (
    <div className="container mx-auto py-10 min-h-screen flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold mb-8">Temporary Home</h1>
      <GekoppeldeLedeSummary />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {canViewLede && (
          <Button asChild className="h-40 text-3xl rounded-3xl flex-col gap-4" variant="default">
            <Link href="/lid">
              <IconSearch size={48} />
              <span>Lid Soek</span>
            </Link>
          </Button>
        )}
        {self_lid && (
          <Button asChild className="h-40 text-3xl rounded-3xl flex-col gap-4" variant="default">
            <Link href="/qr/my">
              <IconQrcode size={48} />
              <span>My QR</span>
            </Link>
          </Button>
        )}
        <Button asChild className="h-40 text-3xl rounded-3xl flex-col gap-4" variant="secondary">
          <Link href="/presensie">
            <IconListCheck size={48} />
            <span>Presensies</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
