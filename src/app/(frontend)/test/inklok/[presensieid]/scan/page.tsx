import { getPayload } from "payload";
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";
import { QRScannerModalProvider } from "@/components/QRScanner";
import ScanListener from "./ScanListener";
import { inklok } from "@/lib/inklok";

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
    depth: 0,
    disableErrors: true
  })

  if (!presensie) return <h1>Presensie not found</h1>

  async function scanAction(lidid: string) {
    'use server'
    const res = await inklok({ presensieid, lidid })

    if ('error' in res) {
      return { success: false, msg: res.error || "Unknown Error" }
    }

    const lid = res.inklok.lid
    const lidName = (typeof lid === 'object' && lid !== null && 'naam' in lid)
      ? (lid as any).naam
      : "Unknown Member"

    return { success: true, msg: `Ingeklok: ${lidName}` }
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-center mb-2">Inklok Skandeerder</h1>
      <h2 className="text-xl text-center text-muted-foreground mb-8">{presensie.naam}</h2>

      <QRScannerModalProvider
        fps={15}
        startopened={true}
        showTorchButtonIfSupported
        showZoomSliderIfSupported
        defaultZoomValueIfSupported={1}
      >
        <ScanListener onScanAction={scanAction} />
      </QRScannerModalProvider>
    </div>
  )
}
