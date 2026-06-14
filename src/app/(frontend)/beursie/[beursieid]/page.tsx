import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound, unauthorized } from 'next/navigation'
import { format } from 'date-fns'
import { getDocNotID } from "@/utilities/getDocNotID";
import { getID } from "@/utilities/getID";
import { auth } from "@/auth"
import { PayButton } from "@/components/PayButton"

interface PageProps {
  params: Promise<{
    beursieid: string
  }>
}

export default async function BeursiePage({ params }: PageProps) {
  const { beursieid } = await params
  const payload = await getPayload({ config: configPromise })
  const session = await auth()

  if (!session || !session.user) return unauthorized()

  const beursie = await payload.findByID({
    collection: 'beursies',
    id: beursieid,
    depth: 1,
    overrideAccess: false,
    user: session.user
  })

  if (!beursie) {
    return notFound()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('af-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount)
  }

  const isInverted = beursie.invert_display;
  const displayBalance = isInverted ? (beursie.balance || 0) * -1 : (beursie.balance || 0);

  const system = await payload.findGlobal({ slug: 'system_beursies' })
  const paymentProductId = system.aanpasbare_kampbetaling_product ? getID(system.aanpasbare_kampbetaling_product) : null

  // Kry die lid se ID vanaf die beursie se gekoppelde lede (join veld)
  const lid = beursie.lede?.docs?.[0]
  const lidId = lid ? getID(lid) : null

  // Join fields in Payload 3.0 return an object with a 'docs' array
  // As isInverted is true, "In" acts as expense and "Out" acts as income for the asset view
  const credits = (isInverted ? beursie.out : beursie.in)?.docs?.map(getDocNotID) || []
  const debits = (isInverted ? beursie.in : beursie.out)?.docs?.map(getDocNotID) || []

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center border-b pb-6">
        <h1 className="text-3xl font-bold mb-2">{beursie.name}</h1>
        <div className="mt-4">
          <p className="text-sm uppercase tracking-widest text-gray-500">Huidige Balans</p>
          <p className={`text-5xl font-black ${typeof displayBalance !== 'number' ? 'text-gray-500' : displayBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(displayBalance)}
          </p>
          {displayBalance < 0 && paymentProductId && lidId && (
            <PayButton
              productId={paymentProductId}
              amount={Math.abs(displayBalance)}
              lidId={lidId}
            />
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-green-500 flex items-center">
            <span className="mr-2">📥</span> {isInverted ? 'Inbetalings / Ontvangstes' : 'Inkomste (Krediete)'}
          </h2>
          {credits.length > 0 ? (
            <div className="space-y-3">
              {credits.map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{tx.description || 'Geen beskrywing'}</p>
                      <p className="text-xs text-gray-500">
                        {tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy HH:mm') : 'Datum onbekend'}
                      </p>
                    </div>
                    <span className="font-bold text-green-600">+{formatCurrency(tx.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Geen inkomende transaksies gevind nie.</p>
          )}
        </section>

        {/* Uit Transaksies - Regs op groot skerms */}
        <section>
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-red-500 flex items-center">
            <span className="mr-2">📤</span> Uitgawe (Debiete)
          </h2>
          {debits.length > 0 ? (
            <div className="space-y-3">
              {debits.map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{tx.description || 'Geen beskrywing'}</p>
                      <p className="text-xs text-gray-500">
                        {tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy HH:mm') : 'Datum onbekend'}
                      </p>
                    </div>
                    <span className="font-bold text-red-600">-{formatCurrency(tx.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Geen uitgaande transaksies gevind nie.</p>
          )}
        </section>
      </div>

      <footer className="mt-12 pt-6 border-t text-center">
        <a
          href="/"
          className="text-blue-600 hover:underline text-sm"
        >
          Terug na Interaksie Paneel
        </a>
      </footer>
    </div>
  )
}
