import {
  QRScanButton,
  QRScannerModalProvider,
  QRScannerWithResults,
  QRTextbox
} from "@/components/QRScanner";
import { QRCodeSVG } from "qrcode.react";
import DownloadableQRCodeSVG from "@/components/downloadableQRCodeSVG";


export default function ScanTestHome() {
  // return (<QRScannerWithResults qrCodeSuccessCallback={null} fps={15}/>)
  return (<QRScannerModalProvider fps={15} startopened={true} showTorchButtonIfSupported showZoomSliderIfSupported defaultZoomValueIfSupported={8}>
    <QRTextbox/>
    <QRScanButton/>
    <div className="bg-white">
    <QRCodeSVG width={undefined} height="82px" marginSize={4} value="https://dev.seejol.cids.org.za/lid/6964260a7265855279a099bf"/>
    <QRCodeSVG width={undefined} height="102.5px" marginSize={4} value="https://dev.seejol.cids.org.za/test/inklok/696690c0a64344e0bacef518/scan"/>
    <QRCodeSVG width={undefined} height="123px" marginSize={4} value="https://dev.seejol.cids.org.za/lid/6964260a7265855279a099bf"/>
    <DownloadableQRCodeSVG width={undefined} height="143.5px" marginSize={4} value="https://dev.seejol.cids.org.za/lid/6964260a7265855279a099bf"/>
    <QRCodeSVG width={undefined} height="164px" marginSize={4} value="https://dev.seejol.cids.org.za/lid/6964260a7265855279a099bf"/>
    </div>
  </QRScannerModalProvider>)
}
