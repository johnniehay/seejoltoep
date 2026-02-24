'use server'
import { getPayload } from "payload";
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";

export async function inklok({presensieid, divisieid, lidid} : {presensieid: string, divisieid?: string, lidid?: string} ) {
  const payload = await getPayload({ config: configPromise })
  const session = await getPayloadSession()
  const userid = session?.user?.id

  if (!userid) return { error: "Not signed in" }

  // Check if already clocked in
  const existing = await payload.find({
    collection: "inklokke",
    where: {
      and: [
        { presensie: { equals: presensieid } },
        { lid: { equals: lidid } },
        { createdAt: { less_than: new Date(Date.now() - 30000).toISOString() } }
      ]
    },
    limit: 1,
    depth: 1
  })

  if (existing.totalDocs > 0) {
    return { inklok: existing.docs[0] }
  }

  const inklokdata = await payload.create({collection:"inklokke", data:{presensie:presensieid,divisie:divisieid,lid:lidid, ingestuur_deur:userid}, depth:1})
  return { inklok: inklokdata }
}
