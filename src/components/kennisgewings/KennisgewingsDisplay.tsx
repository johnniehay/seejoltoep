import { getPayload, Where } from 'payload';
import config from '@payload-config';
import React from "react";
import { KennisgewingCard } from './KennisgewingCard';
import PushNotificationSettings from "@/components/push-notification-settings";

export async function KennisgewingsDisplay({where, limit}: {where: Where, limit?: number}) {
  const payload = await getPayload({ config });
  const kennisgewings = await payload.find({
    collection: 'kennisgewings',
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          }
        },
        where
      ]
    },
    limit: limit
  })
  return (<section id="kennisgewings" className="w-full max-w-4xl p-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-xl shadow-md  border-t-(--divisie-color) border-t-4">
    <div className="flex flex-row flex-wrap gap-2 items-center justify-between">
      <h2 className="text-2xl font-semibold">Kennisgewings</h2>
      <PushNotificationSettings compact={true}/>
    </div>
    <div className="flex flex-col gap-2">
      {kennisgewings.docs.map((notice, index) => (
        <KennisgewingCard key={index} notice={notice} />
      ))}
    </div>
  </section>)
}
