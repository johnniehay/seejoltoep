import { getPayload } from "payload";
import { revalidatePath } from "next/cache";
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";
import { inklok } from "@/lib/inklok";
import type { Lede, Inklokke } from "@/payload-types";
import ScanContainer from "./ScanContainer";

type Args = {
  params: Promise<{
    presensieid: string
  }>
}

export default async function ScanPage({ params: paramsPromise }: Args) {
  const { presensieid } = await paramsPromise

  if (!presensieid || presensieid.length !== 24) return <h1>Invalid presensie</h1>

  const session = await getPayloadSession()
  if (!session) return <h1>Unauthorized</h1>

  const payload = await getPayload({ config: configPromise })
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

  if (!presensie) return <h1>Presensie not found</h1>
  const expectedLedeByLidnommer = (presensie.verwagte_lede ?? []).reduce((acc, verwagte_lid) => {
    if (typeof verwagte_lid !== "object") throw "Expected verwagte_lid to be object"
    acc[verwagte_lid.id] = verwagte_lid;
    return acc;
  }, {} as Record<string, Lede>)
  const expectedLidnommers = Object.keys(expectedLedeByLidnommer)

  // Create a simple map for the client to resolve names offline
  const ledeMap = Object.values(expectedLedeByLidnommer).reduce((acc, lid) => {
    acc[lid.id] = lid.naam || "Onbekend";
    return acc;
  }, {} as Record<string, string>);

  const inputInklokke = presensie.inklokke?.docs ?? []

  type foundInklokke = Omit<Inklokke, 'lid'> & {
    lid: Pick<Lede, 'id' | 'naam'>
  };
  const initialInklokke = (presensie.inklokke?.docs as foundInklokke[])?.filter(i => typeof i.lid === 'object' && i.lid !== null) ?? [];
  payload.logger.warn(`inklokke ${JSON.stringify(inputInklokke)}`)
  const inklokkeByLidnommer = inputInklokke.reduce((acc, inklok) => {
    if (typeof inklok !== 'object') throw "Expected inklok to be object"
    if (!inklok.lid) throw "Expected inklok.lid to not be null|undefined"
    if (typeof inklok.lid !== 'object') throw "Expected inklok.lid to be object"
    //TODO: implement in/out inklok
    acc[inklok.lid.id] = inklok
    return acc
  }, {} as Record<string, Inklokke>)

  const missingExpected = Object.entries(expectedLedeByLidnommer).filter(([expectedLidnommer]) => !inklokkeByLidnommer.hasOwnProperty(expectedLidnommer))

  async function scanAction(lidid: string) {
    'use server'
    const res = await inklok({ presensieid, lidid })

    if ('error' in res) {
      return { success: false, msg: res.error || "Unknown Error" }
    }

    revalidatePath(`/test/inklok/${presensieid}/scan`)

    const lid = res.inklok.lid
    const lidName = (typeof lid === 'object' && lid !== null && 'naam' in lid)
      ? (lid as any).naam
      : "Unknown Member"

    return { success: true, msg: `Ingeklok: ${lidName}` }
  }

  return (
    <ScanContainer
      presensieId={presensieid}
      presensieNaam={presensie.naam || ''}
      initialInklokke={initialInklokke}
      expectedLede={expectedLedeByLidnommer}
      scanAction={scanAction}
      ledeMap={ledeMap}
    />
  )
}
