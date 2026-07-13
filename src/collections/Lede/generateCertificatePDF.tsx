'use client'

import { Button } from "@/components/ui/button";
import { useListQuery, useSelection } from "@payloadcms/ui";
import * as qs from 'qs-esm'
import { useEffect, useState } from "react";


export function GenerateCertificatePDFButton({pdfurl, btntext}: {pdfurl:string, btntext:string}) {
  const listquery = useListQuery()
  const { getQueryParams, count:selectedcount } = useSelection()
  const [iframeopen, setIframeopen] = useState(false)
  const [iframesrc, setIframesrc] = useState("")
  async function buttonclick() {
    setIframeopen(!iframeopen)
  }

  useEffect(() => {
    const queryParams = getQueryParams()
    const iframeSearchParams = queryParams.length !== 0 ? queryParams : qs.stringify(
      { where: listquery.query.where, sort: listquery.query.sort },
      { addQueryPrefix: true })
    console.log("iframeSearchParams", iframeSearchParams)
    setIframesrc(`${pdfurl}${iframeSearchParams}`)
  },[iframeopen,listquery,getQueryParams])

  return (
    <>
      <div className="gutter--left gutter--right" style={{display:"flex"}}>
        <Button style={{marginLeft:"10px"}} onClick={buttonclick}>{!iframeopen?"Show":"Hide"} {btntext}</Button>
      </div>
      <div className="gutter--left gutter--right" >
        {iframeopen && (<embed style={{height: "90vh", width: "100%"}} src={iframesrc}/>)}
      </div>
    </>
  )
}
