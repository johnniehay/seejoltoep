'use client'

import { PuckConfigProvider } from '@delmaredigital/payload-puck/client'
import { puckConfig } from '@/puck/config'

export default function PuckProvider({ children }: { children: React.ReactNode }) {
  return <PuckConfigProvider config={puckConfig}>{children}</PuckConfigProvider>
}
