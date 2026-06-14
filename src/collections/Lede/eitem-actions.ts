'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { Where } from 'payload'
import { getID } from "@/utilities/getID";
import { processEItemInternal } from "@/collections/eItems/processEItem";

export async function processEItemWalletTransactions(params: {
  ids?: string[]
  where?: Where
}) {
  const payload = await getPayload({ config })

  try {
    // 1. Kry Globale Instellings
    const system = await payload.findGlobal({ slug: 'system_beursies' })
    const softyBeursieId = getID(system.softycomp_beursie)
    const winkelBeursieId = getID(system.winkel_beursie)
    const kampKatId = getID(system.kampbetalings_category)

    if (!softyBeursieId || !winkelBeursieId || !kampKatId) {
      return { success: false, message: 'Stelsel beursies is nie volledig opgestel nie.' }
    }
  console.log(`processEItemWalletTransactions ${params.ids} ${params.where} ${typeof params.where}`)
    // 2. Kry die betrokke Lede
    const ledeResponse = await payload.find({
      collection: 'lede',
      where: (params.ids && params.ids.length > 0) ? { id: { in: params.ids } } : (params.where ?? {}),
      limit: 0,
      depth: 0,
    })

    const lidIds = ledeResponse.docs.map(l => l.id)
    if (lidIds.length === 0) return { success: true, message: 'Geen lede gevind nie.' }

    // 3. Soek eItems vir hierdie lede (lidnommer word gebruik as koppeling)
    const eItemsResponse = await payload.find({
      collection: 'eitems',
      where: { lidnommer: { in: lidIds } },
      limit: 0,
      // depth: 2, // Kry produk en kategorieë
      depth: 0, // Kry produk en kategorieë
    })

    let createdCount = 0

    for (const eItem of eItemsResponse.docs) {

      await processEItemInternal(eItem.id)

      createdCount++
    }

    return {
      success: true,
      message: createdCount > 0
        ? `${createdCount} eItem transaksies suksesvol geprosesseer.`
        : 'Geen nuwe eItem transaksies om te prosesseer nie.'
    }

  } catch (error: any) {
    console.error('Error processing eItem transactions:', error)
    return { success: false, message: `Fout: ${error.message}` }
  }
}
