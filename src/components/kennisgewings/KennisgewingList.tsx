'use client'

import React from "react";
import { useKennisgewinglogs } from "@/providers/KennisgewingProvider";
import { KennisgewingCard } from "@/components/kennisgewings/KennisgewingCard";
import type { Kennisgewing } from "@/payload-types";

export function KennisgewingsList({ notificationSettingsSlot }: { notificationSettingsSlot: React.ReactNode }) {
  const { kennisgewinglogs, refreshKennisgewinglogs } = useKennisgewinglogs()
  return (
    <section id="kennisgewings" className="w-full max-w-4xl p-6 rounded-xl shadow-md">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between">
        <h2 className="text-2xl font-semibold">Kennisgewings</h2>
        { notificationSettingsSlot }
      </div>
      <div className="flex flex-col gap-2">
        {kennisgewinglogs ? kennisgewinglogs.filter(logentry => typeof logentry.kennisgewing !== 'string').map((logentry, index) => (
          <KennisgewingCard key={index} notice={logentry.kennisgewing as Kennisgewing} />
        )): (<p>Kennisgewings kon nie afgelaai word nie</p>)}
      </div>
  </section>)
}
