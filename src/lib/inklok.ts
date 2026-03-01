'use server'
import { getPayload } from "payload";
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";
import type { Inklokke, Lede } from "@/payload-types";

export async function inklok({presensieid, divisieid, lidid, tipe = 'in', scan_time, gps} : {
  presensieid: string,
  divisieid?: string,
  lidid: string,
  tipe?: 'in' | 'uit',
  scan_time: string,
  gps?: [number, number]
}) {
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
        { tipe: { equals: tipe } },
        { scan_time: { greater_than: new Date(Date.now() - 30000).toISOString() } }
      ]
    },
    limit: 1,
    depth: 1
  })

  if (existing.totalDocs > 0) {
    return { inklok: existing.docs[0] }
  }

  const inklokdata = await payload.create({
    collection:"inklokke",
    data:{
      presensie:presensieid,
      divisie:divisieid,
      lid:lidid,
      ingestuur_deur:userid,
      tipe,
      scan_time: scan_time,
      gps
    },
    depth:1
  })
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
      lede:{naam:true, noemnaam:true, van: true,id:true},
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
  type LidNetNaam = Pick<Lede, 'id' | 'naam' | 'noemnaam' | 'van'>
  const expectedLedeByLidnommer = (presensie.verwagte_lede ?? []).reduce((acc, verwagte_lid) => {
    if (typeof verwagte_lid !== "object") throw "Expected verwagte_lid to be object"
    acc[verwagte_lid.id] = {id: verwagte_lid.id, naam: (verwagte_lid.noemnaam ?? verwagte_lid.naam) + " " + verwagte_lid.van};
    return acc;
  }, {} as Record<string, {id: string, naam: string}>)

  type foundInklokke = Omit<Inklokke, 'lid'> & {
    lid: LidNetNaam
  };

  const rawInklokke = (presensie.inklokke?.docs as foundInklokke[])?.filter(i => typeof i.lid === 'object' && i.lid !== null) ?? [];

  // Group by lid and find the latest scan for each
  const latestInklokkeMap = new Map<string, foundInklokke>();

  rawInklokke.forEach(inklok => {
    const lidId = inklok.lid.id;
    const currentLatest = latestInklokkeMap.get(lidId);

    const inklokTime = new Date(inklok.scan_time || inklok.createdAt).getTime();
    const currentLatestTime = currentLatest ? new Date(currentLatest.scan_time || currentLatest.createdAt).getTime() : 0;

    if (!currentLatest || inklokTime > currentLatestTime) {
      latestInklokkeMap.set(lidId, inklok);
    }
  });

  const initialInklokke = Array.from(latestInklokkeMap.values()).map(i => ({
    id: i.id,
    lid: {
        id: i.lid.id,
        naam: (i.lid.noemnaam ?? i.lid.naam) + " " + i.lid.van
    },
    tipe: i.tipe as 'in' | 'uit',
    scan_time: new Date(i.scan_time).getTime()
  }))
  return {
    presensieNaam: presensie.naam,
    expectedLede: expectedLedeByLidnommer,
    initialInklokke
  }
}
