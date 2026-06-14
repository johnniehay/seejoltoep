import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { getID } from "@/utilities/getID";
import { hasPermission } from "@/lib/permissions";
import { auth } from "@/auth"

export default async function BankReconciliationPage() {
  const payload = await getPayload({ config: configPromise })
  const session  = await auth()

  if (!session || !session.user || !(await hasPermission('view:finansies'))) {
    // For now, redirecting if no user session exists
    if (!session || !session.user) redirect('/login')
    return (<h1>Unauthorized</h1>)
  }

  const system = await payload.findGlobal({ slug: 'system_beursies' })
  const bankId = getID(system.bankrekening)

  if (!bankId) {
    return <div className="p-8 text-red-500">Bankrekening is nie in globale instellings opgestel nie.</div>
  }

  const beursie = await payload.findByID({
    collection: 'beursies',
    id: bankId,
    depth: 1,
  })

  const transactions = await payload.find({
    collection: 'beursieTransaksies',
    where: {
      or: [
        { in: { equals: bankId } },
        { out: { equals: bankId } }
      ]
    },
    sort: '-createdAt',
    limit: 100,
    depth: 1,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('af-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
  }

  return (
    <div className="container mx-auto py-10 px-6">
      <div className="flex justify-between items-end mb-8 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Bankrekening Oorsig</h1>
          <p className="text-muted-foreground mt-1">Rekonsilieer transaksies en koppel dokumente.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 uppercase font-bold">Balans</p>
          <p className="text-4xl font-black text-green-600">{formatCurrency((beursie.balance || 0) * -1)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Datum</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Beskrywing</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">In (Bank In)</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Uit (Bank Uit)</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Aksies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.docs.map((tx: any) => {
              const isMissingLink = !tx.document && !tx.eitem;
              const isBankIn = getID(tx.out) === bankId; // inverted

              return (
                <tr key={tx.id} className={isMissingLink ? 'bg-red-50/50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {isMissingLink && (
                      <span className="text-red-600 text-xl font-bold animate-pulse" title="Benodig bewys koppeling">❗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(tx.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {tx.description}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    {isBankIn ? `+${formatCurrency(tx.amount)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                    {!isBankIn ? `-${formatCurrency(tx.amount)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a
                      href={`/admin/collections/beursieTransaksies/${tx.id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Wysig / Koppel
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
