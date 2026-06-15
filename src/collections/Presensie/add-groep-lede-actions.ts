'use server'

import { getPayload, PayloadRequest } from 'payload'
import config from '@/payload.config'
import { getlidgroepeinfo } from "../Groepe/access"
import { auth } from "@/auth";

export async function getGroepeOptions() {
  const payload = await getPayload({ config })
  const groepe = await payload.find({
    collection: 'groepe',
    depth: 0,
    pagination: false,
    sort: 'naam',
    limit: 0,
    where: {id: {in: getlidgroepeinfo({user: (await auth())?.user ?? null } as PayloadRequest)}}
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
    limit: 0
  })

  return lede.docs.map((lid) => lid.id)
}
