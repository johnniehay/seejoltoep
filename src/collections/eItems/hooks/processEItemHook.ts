import { CollectionAfterChangeHook } from 'payload'
import { processEItemInternal } from '../processEItem'
import type { Eitem } from "@/payload-types";

export const processEItemHook: CollectionAfterChangeHook<Eitem> = async ({
  doc,
  // operation,
  req
}) => {
  if (doc._status === 'published') {
    await processEItemInternal(doc.id, req)
  }
}
