import { getPayload, PayloadRequest } from 'payload'
import config from '@/payload.config'
import { getID } from "@/utilities/getID";
import { getDocNotID } from "@/utilities/getDocNotID";

/**
 * Hierdie funksie bevat die kernlogika vir die skep van beursietransaksies vir 'n e-Item.
 * Dit word gebruik deur sowel die afterChange hook as die server actions.
 */
export async function processEItemInternal(eItemId: string, req?: PayloadRequest) {
  const payload = req?.payload ?? await getPayload({ config })

  // 1. Kry die eItem met produk besonderhede
  const eItem = await payload.findByID({
    collection: 'eitems',
    id: eItemId,
    depth: 2,
    req,
  })

  if (!eItem || eItem._status !== 'published') return

  // 2. Kry Globale Instellings vir beursies
  const system = await payload.findGlobal({
    slug: 'system_beursies',
    req,
  })

  const softyBeursieId = getID(system.softycomp_beursie)
  const winkelBeursieId = getID(system.winkel_beursie)
  const kampKatId = getID(system.kampbetalings_category)

  if (!softyBeursieId || !winkelBeursieId) {
    console.error('Stelsel beursies is nie volledig opgestel nie.')
    return
  }

  // 3. Kyk of daar 'n suksesvolle Softycomp transaksie is vir hierdie eItem
  const transactionResponse = await payload.find({
    collection: 'transactions',
    req,
    where: {
      and: [
        { items: { contains: eItemId } },
        { 'softycomp.userReference': { exists: true } },
        { status: { equals: 'succeeded' } }
      ]
    },
    limit: 1,
    depth: 0
  })

  if (transactionResponse.totalDocs === 0) return

  // 4. Kyk of ons reeds hierdie eItem geprosesseer het (duplikaat voorkoming)
  const existingWalletTx = await payload.find({
    collection: 'beursieTransaksies',
    req,
    where: { eitem: { equals: eItemId } },
    limit: 1,
    depth: 0
  })

  if (existingWalletTx.totalDocs > 0) return

  // 5. Kry die Lid se beursie via lidnommer
  if (!eItem.lidnommer) return
  const lid = await payload.findByID({
    collection: 'lede',
    id: eItem.lidnommer,
    req,
    depth: 0,
  })
  if (!lid.beursie) return
  const lidBeursieId = getID(lid.beursie)
  if (!lidBeursieId) return

  const amount = eItem.customPrice || ((getDocNotID(eItem.product)?.priceInZAR ?? 0) / 100) || 0
  const product = getDocNotID(eItem.product)
  const isKampBetaling = product?.categories?.some(cat => getID(cat) === kampKatId) ?? false

  // 6. Skep die Transaksies

  // Aksie 1: Altyd Geld vanaf Softycomp (Bank) -> Lid Beursie
  await payload.create({
    collection: 'beursieTransaksies',
    req,
    data: {
      amount,
      in: lidBeursieId,
      out: softyBeursieId,
      eitem: eItem.id,
      description: `E-Winkel betaling: ${product?.title || 'Item'}`,
    },
  })

  // Aksie 2: As dit NIE 'n kampbetaling is nie, haal die Geld weer uit Lid -> Winkel
  if (!isKampBetaling) {
    await payload.create({
      collection: 'beursieTransaksies',
      req,
      data: {
        amount,
        in: winkelBeursieId,
        out: lidBeursieId,
        eitem: eItem.id,
        description: `Winkel aankope: ${product?.title || 'Item'}`,
      },
    })
  }
}
