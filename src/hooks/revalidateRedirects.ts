import type { CollectionAfterChangeHook } from 'payload'

import { updateTag } from 'next/cache'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  payload.logger.info(`Revalidating redirects`)

  updateTag('redirects')

  return doc
}
