'use client'

import { Button } from "@/components/ui/button";
import { ConfirmationModal, useListQuery, useModal, useSelection } from "@payloadcms/ui";
import * as qs from 'qs-esm'
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";


export function GeneratePDFButton({pdfurl}: {pdfurl:string}){
  const listquery = useListQuery()
  const { getQueryParams, count:selectedcount } = useSelection()
  const [iframeopen, setIframeopen] = useState(false)
  const [iframesrc, setIframesrc] = useState("")
  const [startPos, setStartPos] = useState(0)
  const { openModal } = useModal()
  const router = useRouter()
  async function buttonclick() {
    setIframeopen(!iframeopen)
  }
  async function markprinted() {
    const resp = await fetch(iframesrc, {method: "POST"})
    console.log(await resp.json())
    router.refresh()
  }
  const filtered_selected = selectedcount > 0 ? 'selected' : 'filtered'
  const printcount = selectedcount > 0 ? selectedcount : listquery.data?.totalDocs ?? 0

  useEffect(() => {
    const queryParams = getQueryParams()
    const iframeSearchParams = queryParams.length !== 0 ? queryParams : qs.stringify(
      { where: listquery.query.where, sort: listquery.query.sort },
      { addQueryPrefix: true })
    console.log("iframeSearchParams", iframeSearchParams)
    setIframesrc(`${pdfurl}${iframeSearchParams}${iframeSearchParams.length > 0 ? '&' : '?'}startPos=${startPos}`)
  },[iframeopen,listquery,getQueryParams,startPos])

  return (
    <>
      <div className="gutter--left gutter--right" style={{display:"flex"}}>
        <Button style={{marginLeft:"10px"}} onClick={buttonclick}>{!iframeopen?"Show":"Hide"} Lanyards PDF</Button>
        Start position
        <Input type={"number"} min={0} max={3} value={startPos} onChange={(e) => setStartPos(e.target.valueAsNumber)}/>
        <Button style={{marginLeft:"10px"}} onClick={() => openModal("confirmprinted")}>Mark all filtered as printed</Button>
        <ConfirmationModal
          body={`Have you actually printed ${printcount > 1 ? "all":"the"} ${printcount} ${filtered_selected} Person record(s)` }
          confirmingLabel={"Printed"}
          heading={"Confirm printed"}
          modalSlug={"confirmprinted"}
          onConfirm={markprinted}
        />
      </div>
      <div className="gutter--left gutter--right" >
        {iframeopen && (<embed style={{height: "90vh", width: "100%"}} src={iframesrc}/>)}
      </div>
    </>
  )
}
