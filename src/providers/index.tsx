import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SubscribeContextProvider } from "./NotificationSubscriptionProvider"
import { SonnerProvider } from "@/providers/Sonner";
import { EcommerceProvider } from "@payloadcms/plugin-ecommerce/client/react";
import { AuthProvider } from "@/providers/Auth";
import { currencies } from "@/plugins";

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <SubscribeContextProvider>
      <ThemeProvider>
        <AuthProvider>
          <HeaderThemeProvider>
            <SonnerProvider />
            <EcommerceProvider
              enableVariants={true}
              api={{
                cartsFetchQuery: {
                  depth: 2,
                  populate: {
                    products: {
                      slug: true,
                      title: true,
                      gallery: true,
                      inventory: true,
                    },
                    variants: {
                      title: true,
                      inventory: true,
                    },
                  },
                },
              }}
              currenciesConfig={currencies}
              paymentMethods={[{
                name: 'softycomp',
                confirmOrder: true,
                initiatePayment: true,
                label: 'Card',
              }]}
            >
              {children}
            </EcommerceProvider>
          </HeaderThemeProvider>
        </AuthProvider>
      </ThemeProvider>
    </SubscribeContextProvider>
  )
}
