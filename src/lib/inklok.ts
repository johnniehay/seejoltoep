'use server'
import { getPayload } from "payload";
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";

export async function inklok({presensieid, divisieid, lidid} : {presensieid: string, divisieid?: string, lidid?: string} ) {
  const payload = await getPayload({ config: configPromise })
  const session = await getPayloadSession()
  const userid = session?.user?.id

  if (!userid) return { error: "Not signed in" }

  // TODO: deduplicate check recent or once
  const inklokdata = await payload.create({collection:"inklokke", data:{presensie:presensieid,divisie:divisieid,lid:lidid, ingestuur_deur:userid}, depth:1})
  return { inklok: inklokdata }
}
