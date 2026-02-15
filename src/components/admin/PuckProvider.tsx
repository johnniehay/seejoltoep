'use client'

import { PuckConfigProvider } from '@delmaredigital/payload-puck/client'
import { puckConfig } from '@/puck/config'
import { puckEditorLayouts } from "@/lib/puck/editorLayouts";

export default function PuckProvider({ children }: { children: React.ReactNode }) {
  return (
    <PuckConfigProvider
      config={puckConfig}
      layouts={puckEditorLayouts}
      editorStylesheets={[
        '/api/puck/styles', // Plugin-compiled CSS from editorStylesheet config
      ]}
    >
      {children}
    </PuckConfigProvider>
  )
}
