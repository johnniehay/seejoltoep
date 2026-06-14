import { Payload, PayloadRequest } from 'payload'
import { Lede } from '@/payload-types'
import { getID } from '@/utilities/getID'
import { getDocNotID } from '@/utilities/getDocNotID'
import { InskrywingStages } from "@/collections/Inskrywings";

/**
 * Hierdie funksie bereken en skep 'n vereffeningstransaksie vir 'n Lid se SAS-betaling.
 * Dit word gebruik deur die afterChange hook en die handmatige aksie.
 */
export async function clearSasPaymentForLid(lid: Lede, payload: Payload, req?: PayloadRequest) {

  const targetStage = 'Betaling ontvang'
  const targetIndex = InskrywingStages.indexOf(targetStage)
  const newIndex = InskrywingStages.indexOf(lid.stage ?? 'fallback')

  // Hardloop slegs as die huidige status kwalifiseer
  payload.logger.warn(`SAS betaling ontvang ${newIndex}, ${targetIndex}`)
  if (newIndex < targetIndex) return

  const lidBeursieId = lid.beursie ? getID(lid.beursie) : undefined
  const inskrywingId = lid.huidige_inskrywing ? getID(lid.huidige_inskrywing) : undefined

  if (!lidBeursieId || !inskrywingId) {
    // payload.logger.warn(`Skipping SAS payment clearance for Lid ${lid.id}: Missing wallet or current registration.`)
    return // Cannot process without a wallet or registration
  }

  try {
    // 1. Get System Settings
    const system = await payload.findGlobal({
      slug: 'system_beursies',
      req,
    })

    const bankrekeningId = getID(system.bankrekening)
    const kampKatId = getID(system.kampbetalings_category)
    const snoepieProductId = getID(system.snoepie_inbetaling_product)

    if (!bankrekeningId) {
      payload.logger.error(`System Beursies: Bankrekening is nie opgestel nie. Kan nie SAS betaling vereffen vir Lid ${lid.id}.`)
      return
    }

    // 2. Calculate Total Invoiced (Debt)
    // These are transactions where the Lid was the 'out' side for this specific registration
    const debtTransactions = await payload.find({
      collection: 'beursieTransaksies',
      where: {
        and: [
          { out: { equals: lidBeursieId } },
          { inskrywing: { equals: inskrywingId } }
        ]
      },
      limit: 0,
      req,
    })

    const totalDebt = debtTransactions.docs.reduce((sum, tx) => sum + (tx.amount || 0), 0)

    // 3. Calculate Portal Payments (Credits via eItems)
    // Find transactions where money came 'in' to Lid via an eItem
    const creditTransactions = await payload.find({
      collection: 'beursieTransaksies',
      where: {
        and: [
          { in: { equals: lidBeursieId } },
          { eitem: { exists: true } }
        ]
      },
      limit: 0,
      depth: 2, // Get eItem and Product details
      req,
    })

    const validPortalPayments = creditTransactions.docs.reduce((sum, tx) => {
      const eItem = getDocNotID(tx.eitem)
      const product = getDocNotID(eItem?.product)

      if (!product) return sum

      const isKampCategory = product.categories?.some(cat => getID(cat) === kampKatId)
      const isSnoepie = getID(product) === snoepieProductId

      // Include if it's a kamp payment category but NOT the snoepie top-up product
      if (isKampCategory && !isSnoepie) {
        return sum + (tx.amount || 0)
      }
      return sum
    }, 0)

    // 4. Calculate Difference
    const remainingBalanceToClear = totalDebt - validPortalPayments

    // 5. Create Clearance Transaction if debt remains
    if (remainingBalanceToClear > 0) {
      await payload.create({
        collection: 'beursieTransaksies',
        req,
        data: {
          amount: remainingBalanceToClear,
          in: lidBeursieId,
          out: bankrekeningId,
          inskrywing: inskrywingId,
          description: `SAS Betaling Ontvang: ${lid.vertoonnaam} (${lid.id})`,
        },
        context: { fromSasHook: true } // Mark this context to prevent infinite loops if hooks react to transactions
      })
      return true // Indicate a transaction was created
    }
    return false // No transaction needed
  } catch (error: any) {
    payload.logger.error(`Failed to process SAS payment clearance for Lid ${lid.id}: ${error.message || error}`)
    return false
  }
}
