"use client"

import {
  Html5QrcodeResult,
  Html5QrcodeScanner,
  QrcodeErrorCallback,
  QrcodeSuccessCallback
} from "@part-db/html5-qrcode";
import { createContext, Dispatch, SetStateAction, use, useContext, useLayoutEffect, useState } from "react";
import { Html5QrcodeScannerConfig } from "@part-db/html5-qrcode/esm/html5-qrcode-scanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import "./html5-qrcode.css"
// import { logServerError } from "@/lib/serverlog";

const qrcodeRegionId = "html5qr-code-full-region";

interface QRScannerProps extends Html5QrcodeScannerConfig {
  verbose?: boolean;
  qrCodeSuccessCallback: QrcodeSuccessCallback;
  qrCodeErrorCallback?: QrcodeErrorCallback
}

export default function QRScanner(props: QRScannerProps) {
  useLayoutEffect(() => {
    // when component mounts
    const { verbose: propVerbose, qrCodeSuccessCallback, qrCodeErrorCallback, ...config } = props;
    const verbose = propVerbose === true;
    // Suceess callback is required.
    if (!(props.qrCodeSuccessCallback)) {
      throw "qrCodeSuccessCallback is required callback.";
    }
    const html5QrcodeScanner = new Html5QrcodeScanner(qrcodeRegionId, config, verbose);
    console.log("QRScanner useLayoutEffect prerender");
    html5QrcodeScanner.render(qrCodeSuccessCallback, qrCodeErrorCallback);
    console.log("QRScanner useLayoutEffect");
    // cleanup function when component will unmount
    return () => {
      const clearScanner = async () => {
        await html5QrcodeScanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error)
          // logServerError("(serverlog)Failed to clear html5QrcodeScanner. ", error)
        }).then(() => {
          console.log("clear html5QrcodeScanner.")
        });
      }
      console.log("QRScanner useLayoutEffect cleanup start");
      clearScanner()
      console.log("QRScanner useLayoutEffect cleanup end");

      // logServerError("(serverlog)QRScanner useLayoutEffect cleanup")
    };
  }, []);

  return (<div id={qrcodeRegionId}/>)
}

export function QRScannerWithResults(props: QRScannerProps) {
  function scanSuccess(decodedText: string, result: Html5QrcodeResult) {
    const { qrCodeSuccessCallback } = props;
    setScannedText(decodedText);
    setScannedResultJSON(JSON.stringify(result));
    qrCodeSuccessCallback(decodedText, result);
  }

  const [scannedText, setScannedText] = useState("")
  const [scannedResultJSON, setScannedResultJSON] = useState("")
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm break-all">{scannedText}</p>
      <p className="text-xs font-mono text-muted-foreground break-all">{scannedResultJSON}</p>
      <QRScanner {...props} qrCodeSuccessCallback={scanSuccess}/>
    </div>)
}

export const QRcbmodalContext = createContext<{
  qrSuccessCallback: QrcodeSuccessCallback | null,
  setqrSuccessCallback: Dispatch<SetStateAction<QrcodeSuccessCallback | null>>
}>({
  qrSuccessCallback: null,
  setqrSuccessCallback: () => {
  }
})
export const QRmodalContext = createContext<{
  qrtext: string | null,
  setQrtext: Dispatch<SetStateAction<string | null>>
}>({
  qrtext: null,
  setQrtext: () => {
  }
})

export function QRScannerModalProvider({ children, fps, startopened, ...qrprops }: Readonly<{
  children: React.ReactNode,
  fps?: number | undefined,
  startopened?: boolean
}> & Partial<QRScannerProps>) {
  // const [qrSuccessCallback, setqrSuccessCallback] = useState<QrcodeSuccessCallback|null>(null)
  const [qrtext, setQrtext] = useState<string | null>(startopened ? null : "")
  const scannedSuccess: QrcodeSuccessCallback = (result) => {
    setQrtext(result)
  }

  function modalOnClose() {
    console.log("QRScannerModalProvider onclose");
    if (qrtext === null)
      setQrtext("")
  }

  return (<>
    <Dialog open={qrtext === null} onOpenChange={(open) => !open && modalOnClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
        </DialogHeader>
        <QRScanner qrCodeSuccessCallback={scannedSuccess} fps={fps} {...qrprops}/>
      </DialogContent>
    </Dialog>
    <QRmodalContext value={{ qrtext, setQrtext }}>
      {children}
    </QRmodalContext></>)


}

export function QRScanButton() {
  const { setQrtext } = useContext(QRmodalContext)
  return (<Button onClick={() => {
    setQrtext(null)
  }}>Scan QRcode</Button>)
}


export function QRTextbox() {
  const { qrtext } = useContext(QRmodalContext)
  return (<p>{qrtext}</p>)
}
