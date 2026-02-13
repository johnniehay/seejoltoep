"use client"

import { ComponentProps, ComponentRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";


export default function DownloadableQRCodeSVG(props : ComponentProps<typeof QRCodeSVG>) {
  const qrref = useRef<ComponentRef<typeof QRCodeSVG>>(null);
  const [svgdataurl, setSvgdataurl] = useState("")

  useLayoutEffect(() => {
    const qrouterhtml = qrref.current?.outerHTML ?? ""
    qrref.current?.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    // const svgBlob = new Blob([qrouterhtml], { type: "image/svg+xml;charset=utf-8" })
    // console.log("svgBlob",svgBlob.toString())
    const serializer = new XMLSerializer();
    if (qrref.current) {
      const source = serializer.serializeToString(qrref.current);
      setSvgdataurl("data:image/svg+xml;charset=utf-8," + encodeURIComponent(source))
      // console.log("svgdataurl",svgdataurl.current);
    }
  },[qrref])
  // return (<a download="filename.svg" href={svgdataurl}><QRCodeSVG ref={qrref} {...props}/></a>)
  return (
    <div>
      { svgdataurl.length > 0 ?
        <img alt={typeof props.value === "string" ? props.value : props.value[0]} src={svgdataurl}/> :
        <QRCodeSVG ref={qrref} width={props.width} {...props}/>}
    </div>)
}