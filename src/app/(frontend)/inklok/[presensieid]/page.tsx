import { getPayload } from "payload";
import configPromise from '@payload-config'
import { getPayloadSession } from "@/lib/payload-authjs-custom/exports/server";
import { inklok } from "@/lib/inklok";
import { redirect } from "next/navigation";
import { getID } from "@/utilities/getID";

type Args = {
  params: Promise<{
    presensieid: string
  }>
}

// function nullifID<T>(value: T|string): T|null {
//   return (typeof value === 'string') ? null : value
// }

export default async function Inklok({ params: paramsPromise }: Args) {
  const { presensieid } = await paramsPromise
  if (!presensieid) return <h1>Invalid presensie</h1>

  const session = await getPayloadSession()
  if (!session) return <h1>Unauthorized to check in when not signed in</h1>
  const payload = await getPayload({ config: configPromise })
  const presensie = await payload.findByID({collection:"presensie",id:presensieid,depth:1,disableErrors:true})
  if (!presensie) return <h1>Presensie not found</h1>

  const sessionUser = session.user

  if (!sessionUser.self_lid) return <h1>Linked lid not found</h1>
  // Map the self_lid to the lede array to maintain your existing logic flow
  const lid = getID(sessionUser.self_lid)
  const divisie = typeof sessionUser.self_lid === "object" && sessionUser.self_lid.divisie ? getID(sessionUser.self_lid.divisie) : undefined

  if (lid) {
    const inklokres = await inklok({ presensieid: presensie.id, divisieid: divisie, lidid: lid, scan_time: new Date().toISOString() })
    if ("error" in inklokres) return <h1>Inklok failed: {inklokres.error}</h1>
    redirect(`success/${inklokres.inklok.id}`)
  }

  return <h1>Multiple lede found (unsupported)</h1>
}
