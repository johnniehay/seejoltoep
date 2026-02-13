'use client'

import { useContext, useEffect, useState } from "react"
import { QRmodalContext, QRScanButton } from "@/components/QRScanner"
import { IconCheck, IconX } from "@tabler/icons-react"

export default function ScanListener({ onScanAction }: { onScanAction: (lidid: string) => Promise<{success: boolean, msg: string}> }) {
  const { qrtext, setQrtext } = useContext(QRmodalContext)
  const [result, setResult] = useState<{success: boolean, msg: string} | null>(null)

  useEffect(() => {
    if (qrtext) {
      const process = async () => {
        // Extract ID: Expecting .../lid/<id>
        const match = qrtext.match(/\/lid\/([a-f0-9]{24})/)
        const lidid = match ? match[1] : null

        if (lidid) {
            const res = await onScanAction(lidid)
            setResult(res)
        } else {
            setResult({ success: false, msg: "Invalid QR Code Format" })
        }

        // Rapid fire: Re-open scanner after 1.5s
        setTimeout(() => {
            setQrtext(null)
        }, 1500)
      }
      process()
    }
  }, [qrtext, onScanAction, setQrtext])

  return (
    <div className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto">
        {result ? (
            <div className={`flex flex-col items-center gap-2 p-6 rounded-xl text-white shadow-lg w-full transition-colors ${result.success ? 'bg-green-600' : 'bg-red-600'}`}>
                {result.success ? <IconCheck size={64}/> : <IconX size={64}/>}
                <h2 className="text-2xl font-bold">{result.success ? "Sukses" : "Fout"}</h2>
                <p className="text-center font-medium">{result.msg}</p>
            </div>
        ) : (
            <div className="p-6 rounded-xl bg-muted text-muted-foreground w-full text-center">
                <p>Gereed om te skandeer...</p>
            </div>
        )}

        <div className="flex flex-col gap-2 w-full">
            <QRScanButton />
            <p className="text-xs text-center text-muted-foreground">Skandeerder maak outomaties oop na 'n suksesvolle skandering.</p>
        </div>
    </div>
  )
}
