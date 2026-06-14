'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { Where } from 'payload'
import { InskrywingStages } from "@/collections/Inskrywings";

export async function generateInvoiceTransactions(params: {
  ids?: string[]
  where?: Where
}) {
  const payload = await getPayload({ config })

  try {
    // 1. Get the System Beursie reference
    const systemBeursies = await payload.findGlobal({
      slug: 'system_beursies',
    })

    const systemBeursieId = typeof systemBeursies.kampgeld_inkomste === 'string'
      ? systemBeursies.kampgeld_inkomste
      : systemBeursies.kampgeld_inkomste?.id

    if (!systemBeursieId) {
      return { success: false, message: 'Stelsel beursie (Kampgeld inkomste) is nie opgestel nie.' }
    }

    // 2. Define stages that qualify (Wag vir Betaling or higher)
    const qualifyingStages = InskrywingStages.slice(InskrywingStages.indexOf('Wag vir Betaling'))

    const queryConstraints: Where[] = [
      { huidige_inskrywing: { exists: true } },
      { beursie: { exists: true } },
      { stage: { in: qualifyingStages } }
    ]

    if (params.ids && params.ids.length > 0) {
      queryConstraints.push({ id: { in: params.ids } })
    } else if (params.where) {
      queryConstraints.push(params.where)
    }

    // 3. Find Lede
    const ledeResponse = await payload.find({
      collection: 'lede',
      depth: 1, // To get current registration details
      limit: 0,
      where: { and: queryConstraints },
    })

    let createdCount = 0

    for (const lid of ledeResponse.docs) {
      const lidBeursieId = typeof lid.beursie === 'string' ? lid.beursie : lid.beursie?.id
      const inskrywingId = typeof lid.huidige_inskrywing === 'string' ? lid.huidige_inskrywing : lid.huidige_inskrywing?.id

      const inskrywing = typeof lid.huidige_inskrywing === 'string' ? await payload.findByID({ collection: 'inskrywings', id: lid.huidige_inskrywing}) : lid.huidige_inskrywing

      if (!lidBeursieId || !inskrywingId || !inskrywing) continue

      // 4. Check if a transaction for this registration already exists
      const existingTx = await payload.find({
        collection: 'beursieTransaksies',
        limit: 1,
        where: {
          and: [
            { out: { equals: lidBeursieId } },
            { inskrywing: { exists: true } },
          ]
        }
      })

      if (existingTx.totalDocs > 0) continue

      // 5. Calculate amount (assuming 'totaal' field exists on Inskrywing, fallback to 0)
      // Adjust field name based on your actual Inskrywing schema
      const amount = inskrywing.amount || 0

      // 6. Create the transaction
      // Out: Lid's wallet (Liability/Debt)
      // In: System Outstanding wallet
      await payload.create({
        collection: 'beursieTransaksies',
        data: {
          amount,
          in: systemBeursieId,
          out: lidBeursieId,
          inskrywing: inskrywing.id,
          description: `Kampgeld faktuur vir ${lid.vertoonnaam} ${lid.id}`,
        },
      })

      createdCount++
    }

    return {
      success: true,
      message: createdCount > 0
        ? `${createdCount} faktuur transaksies suksesvol geskep.`
        : 'Geen nuwe fakture om te skep nie.'
    }
  } catch (error: any) {
    console.error('Error generating invoices:', error)
    return {
      success: false,
      message: `Fout: ${error.message || 'Kon nie fakture skep nie.'}`
    }
  }
}
