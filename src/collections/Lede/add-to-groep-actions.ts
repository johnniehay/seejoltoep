'use server'

import config from '@/payload.config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { Groepe } from "@/payload-types";

export async function getGroepe(): Promise<{ id: string; naam: string }[]> {
  const payload = await getPayload({ config })
  const groepe = await payload.find({
    collection: 'groepe',
    pagination: false,
    depth: 0,
  })
  return groepe.docs.map(doc => ({ id: doc.id, naam: doc.naam as string }))
}

export async function addLedeToGroep(ledeIds: string[], groepId: string): Promise<void> {
  const payload = await getPayload({ config })

  for (const lidId of ledeIds) {
    const lid = await payload.findByID({
      collection: 'lede',
      id: lidId,
      depth: 0,
    })

    if (lid) {
      const currentGroepeIds = (lid.groepe || []).map((g: string | Groepe) =>
        typeof g === 'object' ? g.id : g,
      )

      if (!currentGroepeIds.includes(groepId)) {
        const updatedGroepe = [...currentGroepeIds, groepId]

        await payload.update({
          collection: 'lede',
          id: lidId,
          data: {
            groepe: updatedGroepe,
          },
        })
      }
    }
  }

  revalidatePath('/admin/collections/lede')
}
