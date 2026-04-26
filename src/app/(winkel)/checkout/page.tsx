import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React, { Fragment } from 'react'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'

export default function Checkout() {
  return (
    <div className="container min-h-[90vh] flex">
      <h1 className="sr-only">Plaas Bestelling</h1>

      <CheckoutPage />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Plaas bestelling.',
  openGraph: mergeOpenGraph({
    title: 'Plaas Bestelling',
    url: '/checkout',
  }),
  title: 'Plaas Bestelling',
}
