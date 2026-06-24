'use client'

import { useContext, useEffect, useState, useRef } from "react"
import { QRmodalContext, QRScanButton } from "@/components/QRScanner"
import { IconCheck, IconX, IconCloudUpload } from "@tabler/icons-react"
import type { useScanSync } from "@/hooks/useScanSync"

export default function ScanListener({
  ledeMap,
  syncHook,
  scanTipe,
  currentLocation,
  notesRequired,
  onScanTriggerNotes,
  isNotesDialogOpen
}: {
  ledeMap: Record<string, string>,
  syncHook: ReturnType<typeof useScanSync>,
  scanTipe: 'in' | 'uit',
  currentLocation?: [number, number],
  notesRequired: boolean,
  onScanTriggerNotes: (lidId: string, lidName: string, tipe: 'in' | 'uit', currentLocation?: [number, number]) => void,
  isNotesDialogOpen: boolean
}) {
  const { qrtext, setQrtext } = useContext(QRmodalContext)
  const [result, setResult] = useState<{success: boolean, msg: string} | null>(null)
  const processingRef = useRef(false)
  const { addScan, pendingCount, isOnline } = syncHook

  useEffect(() => {
    if (qrtext && !processingRef.current && !isNotesDialogOpen) { // Only process if notes dialog is not open
      const process = async () => {
        processingRef.current = true
        // Extract ID: Expecting .../lid/<id>
        const match = qrtext.match(/(?:\/lid\/)?([0-9]{5,6})/)
        const lidid = match ? match[1] : null
        setQrtext("") // Clear QR text immediately to prevent re-processing

        if (lidid) {
            const lidName = ledeMap[lidid] || "Onbekende Lid";
            if (notesRequired) {
              onScanTriggerNotes(lidid, lidName, scanTipe, currentLocation);
              setResult(null); // Clear previous result
              // Do not re-open scanner here; ScanContainer will handle it after notes dialog closes
              setTimeout(() => {
                processingRef.current = false
              }, 1500) // Still reset processingRef after a short delay
            } else {
              const res = await addScan(lidid, lidName, scanTipe, currentLocation);
              setResult(res);
              // Re-open scanner after 1.5s
              setTimeout(() => {
                  setQrtext(null)
                  processingRef.current = false
              }, 1500)
            }
        } else {
            setResult({ success: false, msg: "Invalid QR Code Format" })
            // Re-open scanner after 1.5s for invalid format
            setTimeout(() => {
                setQrtext(null)
                processingRef.current = false
            }, 1500)
        }
      }
      process()
    }
  }, [qrtext, setQrtext, addScan, ledeMap, scanTipe, currentLocation, notesRequired, onScanTriggerNotes, isNotesDialogOpen]) // Add isNotesDialogOpen to dependencies

  return (
    <div className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto">
        {/* Offline/Sync Status Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
          <span>{isOnline ? "Aanlyn" : "Vanlyn"}</span>
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-orange-600 ml-2">
              <IconCloudUpload size={16} />
              {pendingCount} hangend
            </span>
          )}
        </div>

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
