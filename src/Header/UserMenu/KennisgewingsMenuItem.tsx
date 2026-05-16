import { useKennisgewinglogs } from "@/providers/KennisgewingProvider";
import React, { useContext } from "react";
import { subscribeContext } from "@/providers/NotificationSubscriptionProvider";
import { IconBell, IconBellOff } from "@tabler/icons-react";
import { KennisgewingCard } from "@/components/kennisgewings/KennisgewingCard";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Kennisgewing } from "@/payload-types";

export function KennisgewingsMenuItem({ notificationSettingsSlot }: { notificationSettingsSlot: React.ReactNode }) {
  const { kennisgewinglogs, refreshKennisgewinglogs} = useKennisgewinglogs()
  const {subscription} = useContext(subscribeContext)
  return (
    <Dialog>
      <DialogTrigger>
        {subscription ? <IconBell/> : <IconBellOff/>}
      </DialogTrigger>
      <DialogContent>
        <section id="kennisgewings" className="w-full max-w-4xl p-6 rounded-xl shadow-md">
          <div className="flex flex-row flex-wrap gap-2 items-center justify-between">
            <h2 className="text-2xl font-semibold">Kennisgewings</h2>
            {notificationSettingsSlot}
          </div>
          <div className="flex flex-col gap-2">
            {kennisgewinglogs ? kennisgewinglogs.filter(logentry => typeof logentry.kennisgewing !== 'string').map((logentry, index) => (
              <KennisgewingCard key={index} notice={logentry.kennisgewing as Kennisgewing} noticeLog={logentry} />
            )): (<p>Kennisgewings kon nie afgelaai word nie</p>)}
          </div>
        </section>
      </DialogContent>
    </Dialog>)
}
