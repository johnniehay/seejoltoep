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
  const unack_count = kennisgewinglogs?.filter((kennisgewinglog) => !kennisgewinglog.acknowledged).length ?? 0
  return (
    <Dialog>
      <DialogTrigger>
        <div className={"relative"}>
          {subscription ? <IconBell/> : <IconBellOff color={"red"} className={"animate-bounce an"}/>}
          {unack_count > 0 && <span className="absolute bottom-0 right-0 flex items-center justify-center w-3 h-3 text-[0.5rem] font-bold text-white bg-red-500 border-1 border-white rounded-full">
            {unack_count}
          </span>}
        </div>
      </DialogTrigger>
      <DialogContent>
        <section id="kennisgewings" className="w-full max-w-4xl p-6 rounded-xl shadow-md">
          <div className="flex flex-row flex-wrap gap-2 items-center justify-between">
            <h2 className="text-2xl font-semibold">Kennisgewings</h2>
            {notificationSettingsSlot}
          </div>
          <div className="flex flex-col gap-2">
            {kennisgewinglogs ? kennisgewinglogs.filter(logentry => typeof logentry.kennisgewing !== 'string').map((logentry, index) => (
              <KennisgewingCard key={index} notice={logentry.kennisgewing as Kennisgewing} />
            )): (<p>Kennisgewings kon nie afgelaai word nie</p>)}
          </div>
        </section>
      </DialogContent>
    </Dialog>)
}
