import { getPayload } from "payload";
import { revalidatePath } from "next/cache";
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";
import { QRScannerModalProvider } from "@/components/QRScanner";
import ScanListener from "./ScanListener";
import { inklok } from "@/lib/inklok";
import type { Inklokke, Lede } from "@/payload-types";

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

  const inklokke = presensie.inklokke?.docs ?? []
  payload.logger.warn(`inklokke ${JSON.stringify(inklokke)}`)
  const inklokkeByLidnommer = inklokke.reduce((acc, inklok) => {
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
    <div className="min-h-screen bg-background py-6 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-center mb-2">Inklok Skandeerder</h1>
      <h2 className="text-xl text-center text-muted-foreground mb-4">{presensie.naam}</h2>

      <QRScannerModalProvider
        fps={15}
        startopened={true}
        showTorchButtonIfSupported
        showZoomSliderIfSupported
        defaultZoomValueIfSupported={1}
      >
        <ScanListener onScanAction={scanAction} />
      </QRScannerModalProvider>
      <div className="w-full max-w-md p-4 bg-muted rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-2">Uitstaande Lede</h3>
        {missingExpected.length > 0 ? (
          <ul className="list-disc list-inside">
            {missingExpected.map(([lidnommer,lid]) => (
              <li key={lid.id}>{lid.naam ?? lid.id}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Geen verwagte lede.</p>
        )}
      </div>
      <div className="w-full max-w-md p-4 bg-muted rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-2">Inklokke</h3>
        {Object.values(inklokkeByLidnommer).length > 0 ? (
          <ul className="list-none space-y-2">
            {Object.values(inklokkeByLidnommer).map((inklok) => (
              <li key={(inklok.lid as Lede).id}>
                <div className="border-2 border-green-600 rounded px-3 py-1 text-green-600">
                   {(inklok.lid as Lede).id} – {(inklok.lid as Lede).naam ?? "Onbekende lid"}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Geen inklokke geregistreer.</p>
        )}
      </div>
    </div>

  )
}
