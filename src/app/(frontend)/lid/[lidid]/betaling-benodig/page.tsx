import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound, unauthorized } from 'next/navigation'
import { auth } from "@/auth"
import { getID } from "@/utilities/getID"
import { PayButton } from "@/components/PayButton"
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    lidid: string
  }>
}

export default async function BetalingBenodigPage({ params }: PageProps) {
  const { lidid } = await params
  const payload = await getPayload({ config: configPromise })
  const session = await auth()

  if (!session || !session.user) return unauthorized()

  const lid = await payload.findByID({
    collection: 'lede',
    id: lidid,
    depth: 1,
  })

  if (!lid) return notFound()

  const beursie = lid.beursie
  const balance = (typeof beursie === 'object' && beursie !== null) ? (beursie as any).balance : 0

  if (balance >= 0) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Jou rekening is op datum.</h1>
        <Link href={`/lid/${lidid}/sertifikaat`} className="text-blue-600 underline">Gaan na Sertifikaat</Link>
      </div>
    )
  }

  const system = await payload.findGlobal({ slug: 'system_beursies' })
  const paymentProductId = system.aanpasbare_kampbetaling_product ? getID(system.aanpasbare_kampbetaling_product) : null
  const absBalance = Math.abs(balance)
  const formattedBalance = new Intl.NumberFormat('af-ZA', { style: 'currency', currency: 'ZAR' }).format(absBalance)

  return (
    <div className="container mx-auto py-20 px-4 max-w-2xl text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100">
        <h1 className="text-2xl font-bold text-red-600 mb-6">Betaling Benodig</h1>
        <p className="text-lg mb-8 text-gray-700 leading-relaxed">
          <span className="font-bold">{lid.id} {lid.noemnaam || lid.naam} {lid.van}</span> se kampgeld is nie volledig betaal nie.
          Betaal jou uitstaande kampgeld van <span className="font-bold text-red-600">{formattedBalance}</span> deur die toep:
        </p>
        {paymentProductId && <PayButton productId={paymentProductId} amount={absBalance} lidId={lid.id} />}
        <p className="text-lg mt-8 mb-8 text-gray-700 leading-relaxed">
          of Kontak Seejol Finansies.
        </p>
        <div className="mt-8"><Link href="/" className="text-sm text-gray-500 hover:underline">Terug na Interaksiepaneel</Link></div>
      </div>
    </div>
  )
}
