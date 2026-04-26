import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React, { Fragment } from 'react'
import { ConfirmOrder } from '@/components/checkout/ConfirmOrder'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ConfirmOrderPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: SearchParams
}) {
  const searchParams = await searchParamsPromise

  const paymentIntent = searchParams.paymentId

  return (
    <div className="container min-h-[90vh] flex py-12">
      <ConfirmOrder />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Besig om bestelling te bevesting.',
  openGraph: mergeOpenGraph({
    title: 'Besig om bestelling te bevesting',
    url: '/checkout/confirm-order',
  }),
  title: 'Besig om bestelling te bevesting',
}
