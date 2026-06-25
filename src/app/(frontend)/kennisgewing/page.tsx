import { getPayload } from "payload";
import config from '@payload-config'
import { auth } from "@/auth";
import { KennisgewingCard } from "@/components/kennisgewings/KennisgewingCard";
import { KennisgewingsList } from "@/components/kennisgewings/KennisgewingList";
import PushNotificationSettings from "@/components/push-notification-settings";
import React from "react";
import Link from "next/link";


export default async function KennisgewingPage({
                                            searchParams,
                                          }: {
  searchParams: Promise<{ kennisgewingid?: string }>
}) {
  const { kennisgewingid } = await searchParams

  if (kennisgewingid) {
    const payload = await getPayload({ config })
    const user = (await auth())?.user
    try {
      const result = await payload.findByID({
        collection: 'kennisgewings',
        id: kennisgewingid,
        overrideAccess: false,
        user: user,
      })
      return (<>
        <KennisgewingCard notice={result} defaultOpen={true}/><footer className="mt-12 pt-6 border-t text-center">
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm"
        >
          Terug na Interaksie Paneel
        </Link>
      </footer>
    </>)
    } catch (e) {
      return (<h1>Kennisgewingid nie gevind nie</h1>)
    }
  } else {
    // return (<KennisgewingsList notificationSettingsSlot={<></>}/>)
    return (<>
      <KennisgewingsList notificationSettingsSlot={<PushNotificationSettings compact={true}/>}/>
      <footer className="mt-12 pt-6 border-t text-center">
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm"
        >
          Terug na Interaksie Paneel
        </Link>
      </footer>
    </>)
  }
}
