'use client'

import { Button } from '@/components/ui/button'
import React from 'react'

export function ConstructionButton({
  children,
  icon,
  className,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  className?: string
}) {
  return (
    <Button
      onClick={() =>
        alert(
          "Onder konstruksie - ons sal jou laat weet met 'n kennisgewing (notification) sodra dit reg is",
        )
      }
      className={className}
      variant="outline"
    >
      {icon}
      <span>{children}</span>
    </Button>
  )
}
