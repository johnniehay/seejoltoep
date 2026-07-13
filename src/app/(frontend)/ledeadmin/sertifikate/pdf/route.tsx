import { hasPermission } from "@/lib/permissions";
import { getPayload, Where } from "payload";
import config from '@payload-config'
import { Document, Font, Image, Page, pdf, Text, View } from "@react-pdf/renderer";
import { QRCodeSVGPDF } from "@/lib/qrcodePDF/qrcodePDF";
import { chunk } from "lodash";
import { NextRequest } from "next/server";
import * as qs from 'qs-esm'
import { Style } from "@react-pdf/stylesheet";
import type { Lede } from "@/payload-types";
import { LidSertifikaatPDFView } from "@/app/(frontend)/lid/[lidid]/sertifikaat/LidSertifikaat";
import { auth } from "@/auth";

Font.register({family:"OpenSans", src:"./public/OpenSans-Medium.ttf", fontWeight: "medium"})
Font.register({family:"OpenSans-Bold", src:"./public/OpenSans-Bold.ttf", fontWeight: "bold"})


const PersonRoleAugment = ['VIP', 'Guest'] as const

interface PersonAugment {
  roleAugment: typeof PersonRoleAugment[number]
}

export async function GET(request: NextRequest){
  const hasperm = await hasPermission("view:lede") //TODO: maybe restrict permission
  if (!hasperm) return new Response(null)
  const session = await auth()
  const payload = await getPayload({config})
  const qsearchParams = qs.parse(request.nextUrl.searchParams.toString(),{ignoreQueryPrefix:true, depth:10});
  console.dir({"qsearch":qsearchParams},{depth:10})
  const qsearchWhere = (qsearchParams.where ?? {}) as Where
  const qsearchSort = typeof qsearchParams.sort === "string" || (Array.isArray(qsearchParams.sort) && qsearchParams.sort.every(el => typeof el=== "string") )? qsearchParams.sort : undefined

  console.dir({"payload.config.serverURL":payload.config.serverURL,getServerUrl:process.env.NEXT_PUBLIC_SERVER_URL,NEXT_PUBLIC_SERVER_URL:process.env.NEXT_PUBLIC_SERVER_URL})
  const serverurl  = process.env.NEXT_PUBLIC_SERVER_URL

  const lede = (await payload.find({collection:"lede", pagination:false, overrideAccess:false, user:session?.user, limit:0,depth:1,sort:qsearchSort,where:qsearchWhere})).docs


  const ledefilter = (lid: Lede) => (!!lid.divisie && lid.huidige_inskrywing && lid.stage !== 'Gekanselleer');
  const OutDoc = ({lede}:{ lede:Lede[] }) => (
    <Document style={{fontFamily:"OpenSans", fontWeight: "medium"}}>
      { lede.filter(ledefilter).map((lid, idx) => (
        <Page key={idx} size="A5" orientation="landscape">
          <LidSertifikaatPDFView key={lid.id} lid={lid}/>
        </Page>))}
    </Document>)

  const instance = pdf(<OutDoc lede={lede}/>);
  // const stream = await instance.toBuffer();
  // console.log(instance)
  // const stream = await renderToStream(<MyDocument />)
  // const b = await blob(stream)
  const b = await instance.toBlob()
  const response = new Response(b.stream())
  return response
}
