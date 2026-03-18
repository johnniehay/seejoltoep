import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SubscribeContextProvider } from "./NotificationSubscriptionProvider"

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <SubscribeContextProvider>
      <ThemeProvider>
        <HeaderThemeProvider>{children}</HeaderThemeProvider>
      </ThemeProvider>
    </SubscribeContextProvider>
  )
}
