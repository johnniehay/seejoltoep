import { revalidatePath } from "next/cache";
import { inklok, fetchPresensieData } from "@/lib/inklok";
import ScanContainer from "./ScanContainer";

type Args = {
  params: Promise<{
    presensieid: string
  }>
}

export default async function ScanPage({ params: paramsPromise }: Args) {
  const { presensieid } = await paramsPromise

  if (!presensieid || presensieid.length !== 24) return <h1>Invalid presensie</h1>

  // Initial fetch using the server action logic
  const data = await fetchPresensieData(presensieid);
  
  if (!data) return <h1>Presensie not found or Unauthorized</h1>
  const { presensieNaam, expectedLede, initialInklokke } = data;

  async function scanAction(lidid: string, tipe: 'in' | 'uit', time: number) {
    'use server'
    const res = await inklok({ presensieid, lidid, tipe, scan_time: new Date(time).toISOString() })

    if ('error' in res) {
      return { success: false, msg: res.error || "Unknown Error" }
    }

    revalidatePath(`/test/inklok/${presensieid}/scan`)

    const lid = res.inklok.lid
    const lidName = (typeof lid === 'object' && lid !== null && 'naam' in lid)
      ? (lid as any).naam
      : "Unknown Member"

    return { success: true, msg: `${tipe === 'in' ? 'Ingeklok' : 'Uitgeklok'}: ${lidName}` }
  }

  return (
    <ScanContainer
      presensieId={presensieid}
      presensieNaam={presensieNaam || ''}
      initialInklokke={initialInklokke}
      expectedLede={expectedLede}
      scanAction={scanAction}
      fetchDataAction={fetchPresensieData}
    />
  )
}
