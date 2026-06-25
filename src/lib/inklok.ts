'use server'
import { getPayload } from "payload";
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";
import type { Inklokke, Lede } from "@/payload-types";
import { getID } from "@/utilities/getID";
import { getDocNotID } from "@/utilities/getDocNotID";

export async function inklok({presensieid, divisieid, lidid, tipe = 'in', scan_time, gps, notes} : {
  presensieid: string,
  divisieid?: string,
  lidid: string,
  tipe?: 'in' | 'uit',
  scan_time: string,
  gps?: [number, number],
  notes?: string
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
      gps,
      notes
    },
    depth:1
  })
  return { inklok: inklokdata }
}

export async function fetchPresensieData(presensieid: string) {
  const payload = await getPayload({ config: configPromise })
  const session = await getPayloadSession()
  if (!session) return {error:"Nie ingelog"}
  let user_selflid = session.user.self_lid
  if (user_selflid && typeof user_selflid === "string") user_selflid = getDocNotID(await payload.findByID({collection:"lede", id:user_selflid}))
  const user_selflid_groepeids = (user_selflid && typeof user_selflid !== "string" && user_selflid.groepe) ? user_selflid.groepe.map(getID) : []
  // if (!await hasPermission("view:presensie")) return {error:"Toegang verbode"}

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
  // payload.logger.info(`fetchPresensieData ${JSON.stringify(presensie.sigbaar_vir)} ${JSON.stringify(user_selflid_groepeids)}`)
  if (!presensie.sigbaar_vir?.some((sigbaargroep) => user_selflid_groepeids.includes(getID(sigbaargroep)))) return {error:"Toegang verbode"}
  type LidNetNaam = Pick<Lede, 'id' | 'naam' | 'noemnaam' | 'van'>
  const expectedLedeByLidnommer = (presensie.verwagte_lede ?? []).reduce((acc, verwagte_lid) => {
    if (typeof verwagte_lid !== "object") throw "Expected verwagte_lid to be object"
    acc[verwagte_lid.id] = {
      id: verwagte_lid.id,
      naam: (verwagte_lid.noemnaam ?? verwagte_lid.naam) + " " + verwagte_lid.van,
      van: verwagte_lid.van ?? ""
    };
    return acc;
  }, {} as Record<string, {id: string, naam: string, van: string}>)

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
        naam: (i.lid.noemnaam ?? i.lid.naam) + " " + i.lid.van,
        van: i.lid.van
    },
    tipe: i.tipe as 'in' | 'uit',
    scan_time: new Date(i.scan_time).getTime()
  }))
  return {
    presensieNaam: presensie.naam,
    expectedLede: expectedLedeByLidnommer,
    initialInklokke,
    notesRequired: presensie.notes_required || false,
  }
}
