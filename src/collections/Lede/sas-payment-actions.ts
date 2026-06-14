'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Where } from 'payload'
import { InskrywingStages } from "@/collections/Inskrywings"
import { clearSasPaymentForLid } from './lib/clearSasPayment'

export async function runSasPaymentClearanceAction(params: {
  ids?: string[]
  where?: Where
}) {
  const payload = await getPayload({ config })

  try {
    const targetStage = 'Betaling Ontvang'
    const targetIndex = InskrywingStages.indexOf(targetStage)

    // 2. Soek lede wat kwalifiseer (Status is 'Betaling Ontvang' of hoër)
    const qualifyingStages = InskrywingStages.slice(targetIndex)

    const queryConstraints: Where[] = [
      { stage: { in: qualifyingStages } },
      { beursie: { exists: true } },
      { huidige_inskrywing: { exists: true } }
    ]

    if (params.ids && params.ids.length > 0) {
      queryConstraints.push({ id: { in: params.ids } })
    } else if (params.where) {
      queryConstraints.push(params.where)
    }

    const ledeResponse = await payload.find({
      collection: 'lede',
      where: { and: queryConstraints },
      limit: 0,
      depth: 0,
    })

    let processedCount = 0

    for (const lid of ledeResponse.docs) {
      const transactionCreated = await clearSasPaymentForLid(lid, payload)
      if (transactionCreated) {
        processedCount++ // Only increment if a transaction was actually created
      }
    }

    return { success: true, message: `${processedCount} lede betalings ontvang per SAS.` }
  } catch (error: any) {
    console.error('Error in SAS payment action:', error)
    return { success: false, message: `Fout: ${error.message}` }
  }
}
