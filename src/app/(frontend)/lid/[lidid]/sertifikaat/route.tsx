import { Document, Font, Page, pdf } from "@react-pdf/renderer";
import { LidSertifikaatPDFView } from "@/app/(frontend)/lid/[lidid]/sertifikaat/LidSertifikaat";
import type { Lede } from "@/payload-types";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPayload } from "payload";
import config from '@payload-config'
import { inklok } from "@/lib/inklok";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ lidid: string }> }){
// export default async function LidSertifikaatPDFPage({ params }: { params: Promise<{ lidid: string }> }) {
  const { lidid } = await params
  const payload = await getPayload({ config })
  const user = (await auth())?.user
  if (!user) return redirect('/signin')
  // if (!perm) return <h1>Toegang verbode</h1> Possibly add stricter requirements

  const inklokres = await inklok({
    presensieid: "lid_sertifikaat_viewed",
    lidid,
    scan_time: new Date().toISOString()
  })

  let lid
  try {
    lid = await payload.findByID({
      collection: 'lede',
      id: lidid,
      depth: 1 //Include divisie
      // overrideAccess: false,
      // user: user,
    })
  } catch (error) {
    notFound()
  }

  if (!lid) return notFound()

  const OutDoc = ({lid}:{ lid:Lede }) => (
    <Document style={{fontFamily:"OpenSans", fontWeight: "medium"}}>
      <Page size="A5" orientation="landscape">
        <LidSertifikaatPDFView lid={lid}/>
      </Page>
    </Document>)

  const instance = pdf(<OutDoc lid={lid}/>);
  // const stream = await instance.toBuffer();
  // console.log(instance)
  // const stream = await renderToStream(<MyDocument />)
  // const b = await blob(stream)
  const b = await instance.toBlob()
  const response = new Response(b.stream())
  return response
}
