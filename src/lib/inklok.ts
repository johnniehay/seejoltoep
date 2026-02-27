'use server'
import { getPayload } from "payload";
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";
import type { Inklokke, Lede } from "@/payload-types";

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

export async function fetchPresensieData(presensieid: string) {
  const payload = await getPayload({ config: configPromise })
  const session = await getPayloadSession()
  if (!session) throw new Error("Unauthorized")

  const presensie = await payload.findByID({
    collection: "presensie",
    id: presensieid,
    depth: 3,
    populate: {
      lede:{naam:true,id:true},
      users:{email:true,name:true}
    },
    joins: {
      inklokke: {
        limit: 0,
      },
    },
    disableErrors: true
  })

  if (!presensie) return null

  const expectedLedeByLidnommer = (presensie.verwagte_lede ?? []).reduce((acc, verwagte_lid) => {
    if (typeof verwagte_lid !== "object") throw "Expected verwagte_lid to be object"
    acc[verwagte_lid.id] = verwagte_lid;
    return acc;
  }, {} as Record<string, Lede>)

  type foundInklokke = Omit<Inklokke, 'lid'> & {
    lid: Pick<Lede, 'id' | 'naam'>
  };
  
  const rawInklokke = (presensie.inklokke?.docs as foundInklokke[])?.filter(i => typeof i.lid === 'object' && i.lid !== null) ?? [];
  
  const initialInklokke = rawInklokke.map(i => ({
    id: i.id,
    lid: {
        id: i.lid.id,
        naam: i.lid.naam
    }
  }))
  return {
    presensieNaam: presensie.naam,
    expectedLede: expectedLedeByLidnommer,
    initialInklokke
  }
}
