import { getPayload } from "payload";
import configPromise from '@payload-config'
import { IconCheck } from "@tabler/icons-react";

import { asNotID } from "@/lib/util";

type Args = {
  params: Promise<{
    inklokid: string
  }>
}

export default async function CheckedInDisplay({ params: paramsPromise }: Args) {
  const { inklokid } = await paramsPromise
  if (!inklokid || inklokid.length !== 24) return <h1>Invalid inklok</h1>
  const payload = await getPayload({ config: configPromise })
  const inklok = await payload.findByID({collection:"inklokke",id:inklokid,depth:1,disableErrors:true})
  if (!inklok) return <h1>inklok not found</h1>

  const lid = inklok.lid ? asNotID(inklok.lid) : null
  const divisie = inklok.divisie ? asNotID(inklok.divisie) : null
  const ingestuurDeur = asNotID(inklok.ingestuur_deur)

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <IconCheck size={"20vh"}/>
      <h1 className="text-3xl font-bold text-center">Dankie vir die inklok</h1>
      <h2 className="text-xl font-semibold text-muted-foreground">at</h2>
      <h2 className="text-2xl font-bold text-center">{asNotID(inklok.presensie).naam}</h2>
      {lid ? <h3 className="text-xl font-bold">{lid.naam}</h3> : <h3 className="text-xl font-bold">{ingestuurDeur.name}</h3>}
      {divisie && <h3 className="text-lg font-semibold text-muted-foreground">{divisie.naam}</h3>}
      <p className="text-lg font-medium">{new Date(inklok.updatedAt).toLocaleTimeString([],{hour: '2-digit', minute: '2-digit',timeZoneName: undefined})}</p>
    </div>)
}
