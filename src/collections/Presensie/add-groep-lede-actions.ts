'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function getGroepeOptions() {
  const payload = await getPayload({ config })
  const groepe = await payload.find({
    collection: 'groepe',
    depth: 0,
    pagination: false,
    sort: 'naam',
  })

  return groepe.docs.map((groep) => ({
    label: groep.naam as string,
    value: groep.id,
  }))
}

export async function getLedeForGroep(groepId: string) {
  const payload = await getPayload({ config })
  const lede = await payload.find({
    collection: 'lede',
    where: {
      groepe: {
        equals: groepId,
      },
    },
    depth: 0,
    pagination: false,
  })

  return lede.docs.map((lid) => lid.id)
}