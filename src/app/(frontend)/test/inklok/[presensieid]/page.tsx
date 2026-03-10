import { getPayload } from "payload";
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";
import { hasPermission } from "@/lib/permissions";
import { inklok } from "@/lib/inklok";
import { redirect } from "next/navigation";

type Args = {
  params: Promise<{
    presensieid: string
  }>
}

function nullifID<T>(value: T|string): T|null {
  return (typeof value === 'string') ? null : value
}

export default async function Inklok({ params: paramsPromise }: Args) {
  const { presensieid } = await paramsPromise
  if (!presensieid || presensieid.length !== 24) return <h1>Invalid presensie</h1>

  const session = await getPayloadSession()
  if (!session) return <h1>Unauthorized to check in when not signed in</h1>
  const payload = await getPayload({ config: configPromise })
  const presensie = await payload.findByID({collection:"presensie",id:presensieid,depth:1,disableErrors:true})
  if (!presensie) return <h1>Presensie not found</h1>
  const user = session.user
  const isOffisier = await hasPermission("view:offisier")
  const { docs: lede, totalDocs} = await payload.find({collection:"lede",depth:1,where:{user:{equals:user.id}}})

  if (lede.length === 0 && !isOffisier) return <h1>Linked lid not found</h1>

  const lid = lede.length === 1 ? lede[0] : null
  const divisie = nullifID(lid?.divisie) ?? null

  if (lid) {
    const inklokres = await inklok({ presensieid: presensie.id, divisieid: divisie?.id, lidid: lid?.id, scan_time: new Date().toISOString() })
    if ("error" in inklokres) return <h1>Inklok failed: {inklokres.error}</h1>
    redirect(`success/${inklokres.inklok.id}`)
  }

  return <h1>Multiple lede found (unsupported)</h1>
}
