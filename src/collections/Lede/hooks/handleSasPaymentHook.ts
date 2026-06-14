import { CollectionAfterChangeHook } from 'payload'
import { InskrywingStages } from "@/collections/Inskrywings"
import { clearSasPaymentForLid } from "../lib/clearSasPayment"

export const handleSasPaymentHook: CollectionAfterChangeHook = async ({
  doc,
  // previousDoc,
  req,
  // operation,
}) => {
  const targetStage = 'Betaling ontvang'
  const targetIndex = InskrywingStages.indexOf(targetStage)
  const newIndex = InskrywingStages.indexOf(doc.stage)
  req.payload.logger.info(`handleSasPaymentHook ${targetIndex} ${doc.stage} ${newIndex}`)
  // Hardloop slegs as die huidige status kwalifiseer
  if (newIndex < targetIndex) return

  // try {
    await clearSasPaymentForLid(doc, req.payload, req)
  // } catch (error) {
  //   req.payload.logger.error(`Failed to process SAS payment clearance for Lid ${doc.id} in hook: ${error}`)
  // }

  return doc
}
