import { hasPermission } from "@/lib/permissions";
import { getPayload, Where } from "payload";
import config from '@payload-config'
import { Document, Font, Page, pdf, Text, View } from "@react-pdf/renderer";
import { QRCodeSVGPDF } from "@/lib/qrcodePDF/qrcodePDF";
import { chunk } from "lodash";
import { NextRequest } from "next/server";
import * as qs from 'qs-esm'
import { Style } from "@react-pdf/stylesheet";
import type { Lede } from "@/payload-types";
import { getDocNotID } from "@/utilities/getDocNotID";
import { Barcode128PDF } from "@/lib/qrcodePDF/barcode128PDF";

Font.register({family:"OpenSans", src:"./public/OpenSans-Medium.ttf", fontWeight: "medium"})
Font.register({family:"OpenSans-Bold", src:"./public/OpenSans-Bold.ttf", fontWeight: "bold"})

export async function POST(request: NextRequest){
  const hasperm = await hasPermission("view:lede") //TODO: maybe restrict permission
  if (!hasperm) return new Response(null)
  const payload = await getPayload({config})
  const qsearchParams = qs.parse(request.nextUrl.searchParams.toString(),{ignoreQueryPrefix:true, depth:10});
  console.dir({"qsearch":qsearchParams},{depth:10})
  const qsearchWhere = (qsearchParams.where ?? {}) as Where

  const lede = (await payload.db.updateMany({collection:"lede",options:{timestamps:false},where:qsearchWhere,data:{printedAt: new Date().toISOString()}}))
  return new Response(JSON.stringify(lede))
}

const lidRoleAugment = ['VIP', 'Guest'] as const

interface lidAugment {
  roleAugment: typeof lidRoleAugment[number]
}

interface GridItem {
  top: string;
  left: string;
  height: string;
  width: string;
}

function generateGridArray(
  rows: number,
  cols: number,
  height: string,
  width: string,
  topSpacing: string,
  leftSpacing: string
): GridItem[] {
  const result: GridItem[] = [];

  // Extract numeric values and their suffixes (e.g., "cm")
  const hVal = parseFloat(height);
  const wVal = parseFloat(width);
  const tSpace = parseFloat(topSpacing);
  const lSpace = parseFloat(leftSpacing);
  const suffix = height.replace(/[\d.-]/g, '');

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Calculate absolute positions
      const topPos = r * (hVal + tSpace);
      const leftPos = c * (wVal + lSpace);

      result.push({
        top: `${topPos}${suffix}`,
        left: `${leftPos}${suffix}`,
        height: height,
        width: width
      });
    }
  }

  return result;
}


export async function GET(request: NextRequest){
  const hasperm = await hasPermission("view:lede") //TODO: maybe restrict permission
  if (!hasperm) return new Response(null)
  const payload = await getPayload({config})
  const qsearchParams = qs.parse(request.nextUrl.searchParams.toString(),{ignoreQueryPrefix:true, depth:10});
  console.dir({"qsearch":qsearchParams},{depth:10})
  const qsearchWhere = (qsearchParams.where ?? {}) as Where
  const qsearchSort = typeof qsearchParams.sort === "string" || (Array.isArray(qsearchParams.sort) && qsearchParams.sort.every(el => typeof el=== "string") )? qsearchParams.sort : undefined
  const qsearchStartPos= qsearchParams.startPos && typeof qsearchParams.startPos === "string" ? qsearchParams.startPos : '0'
  const startpos = parseInt(qsearchStartPos)
  console.dir({"payload.config.serverURL":payload.config.serverURL,getServerUrl:process.env.NEXT_PUBLIC_SERVER_URL,NEXT_PUBLIC_SERVER_URL:process.env.NEXT_PUBLIC_SERVER_URL})
  const serverurl  = process.env.NEXT_PUBLIC_SERVER_URL

  const lede = (await payload.find({collection:"lede", pagination:false, limit:0,sort:qsearchSort,where:qsearchWhere})).docs
  const positionOffsets = generateGridArray(52, 7, "1.5cm", "8cm", "0.1cm", "0.1cm")
  const commmonTextStyles: Style = {position:"absolute", width: "3cm", minHeight: "0.3cm", textAlign:"center", fontSize: "0.5rem"}
  const txtdbg = false
  const LidPDF = ({lid: inlid, position}: {lid:Lede, position:number} ) => {

    // const lidjson = (inlid.special_needs && inlid.special_needs.startsWith('{')) ? JSON.parse(inlid.special_needs) : {}
    // const liddivisiename = "roleAugment" in lidjson ? (lidjson as lidAugment).roleAugment : inlid.role === 'day_visitor' ? "Day Visitor" : ""
    // if (liddivisiename !== "") console.log("liddivisiename",liddivisiename)
    // const augmenteddivisie = (!!inlid.divisie && typeof inlid.divisie !== "string" && liddivisiename === "") ? inlid.divisie : { name: liddivisiename, number: ''   }
    const lid = {...inlid}
    return (
    // (!!lid.divisie && getDocNotID(lid.divisie).naam.length > 0 ) &&
    <View style={{position:"absolute", ...positionOffsets[position], borderRight:"1pt solid grey"} } wrap={false} debug={false}>
      {/*divisieNumberTop<Text debug={txtdbg} style={{position:"absolute",fontSize:"1rem",top:"1.9cm",left: "0.5cm",width: "4.1cm", textAlign:"left"}} hyphenationCallback={w => [w]}>divisie #{lid.divisie.number}</Text>*/}
      <Barcode128PDF debug={false} style={{position:"absolute",top:"0.0cm",right: "0.0cm"}} width={"4.65cm"} height={"9mm"} marginSize={10} value={`${lid.id}`}/>
      <Text debug={txtdbg} style={{...commmonTextStyles,bottom:"0.5cm",left: "1.5cm", width: "2.5cm", textAlign:"left", fontSize: (lid.noemnaam?.length ?? 0) > 13 ? "0.4rem" : "0.5rem"}} hyphenationCallback={w => [w]}>{lid.noemnaam}</Text>
      <Text debug={txtdbg} style={{...commmonTextStyles,bottom:"0.1cm",left: "1.5cm", width: "2.98cm", textAlign:"left"}} hyphenationCallback={w => [w]}>{lid.van}</Text>
      <Text debug={txtdbg} style={{...commmonTextStyles,top:"0.0cm",left: "1.5cm", textAlign:"left", fontSize:"0.8rem"}} hyphenationCallback={w => [w]}>{lid.id}</Text>
      {/*<Text debug={true}  style={{position:"absolute",bottom:"10cm",left: "2cm", width: "6cm", fontSize:lid.name.length>10?10:18,transform:lid.name.length>100 ? [{operation:"scale", value:[0.5,0.5]}] : undefined}} >{lid.name}</Text>*/}
      {/*liddivisiename === "" && <Text debug={txtdbg} style={{...commmonTextStyles,top:"4.6cm",left: "0.5cm",minHeight:undefined,fontSize:"0.6rem"}} hyphenationCallback={w => [w]}>divisie</Text>*/}
      <Text debug={txtdbg} style={{...commmonTextStyles,bottom:"0.1cm"/*4.5*/,left: "5cm" ,fontSize:"0.3rem", maxHeight: "6mm", width: "3cm", textAlign:"left" }} hyphenationCallback={w => [w]}>{lid.allergiee}</Text>
      {/*divisieNumBotRight<Text debug={txtdbg} style={{position:"absolute",fontSize:"1rem",top:"6.2cm",left: "5.95cm",width: undefined, textAlign:"left"}} hyphenationCallback={w => [w]}>divisie #{lid.divisie.number}</Text>*/}
      <Text debug={txtdbg} style={{...commmonTextStyles,fontSize:"0.5rem",bottom:"0.1cm",left: "4.45cm",width: undefined, fontWeight:"bold", fontFamily:"OpenSans-Bold"}} hyphenationCallback={w => [w]}>{lid.divisie ? getDocNotID(lid.divisie).afkorting : "??"}</Text>
      <QRCodeSVGPDF style={{position:"absolute",top:"0.0cm",left: "0.0cm"}} width={"15mm"} height={"15mm"} marginSize={4} value={`${serverurl}/lid/${lid.id}`}/>
    </View>
  )}
  const ledefilter = (lid: Lede) => (/*!!lid.divisie && */lid.huidige_inskrywing && lid.stage !== 'Gekanselleer');
  const blanklede = (n: number)=> Array(n).fill({id: "", divisie:null}) as Lede[];
  const OutDoc = ({lede, startPos = 0}:{ lede:Lede[], startPos?:number}) => (
    <Document style={{fontFamily:"OpenSans", fontWeight: "medium"}}>
      { chunk(lede.filter(ledefilter).toSpliced(0,0,...blanklede(startPos)),364).map((pagelede,idx) => (
        <Page key={idx} size="A1">
          {pagelede.map((lid,idx) => <LidPDF key={lid.id} lid={lid} position={idx}/>)}
        </Page>))}
    </Document>)

  const instance = pdf(<OutDoc lede={lede} startPos={startpos}/>);
  // const stream = await instance.toBuffer();
  // console.log(instance)
  // const stream = await renderToStream(<MyDocument />)
  // const b = await blob(stream)
  const b = await instance.toBlob()
  const response = new Response(b.stream())
  return response
}
