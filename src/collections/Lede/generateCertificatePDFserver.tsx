import { AfterListServerProps } from "payload";
import { hasPermissionReq } from "@/lib/permissions-payload";
import { GenerateCertificatePDFButton } from "@/collections/Lede/generateCertificatePDF";

export function GenerateCertificatePDFButtonServer( props: AfterListServerProps ){
  const hasperm = hasPermissionReq("view:lede",props.user ?? null)
  if (!hasperm) return (<></>)
  return <GenerateCertificatePDFButton pdfurl={"/ledeadmin/sertifikate/pdf"} btntext={"Sertifikate PDF"} />
}
