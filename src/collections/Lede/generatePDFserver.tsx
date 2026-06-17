import { AfterListServerProps } from "payload";
import { hasPermissionReq } from "@/lib/permissions-payload";
import { GeneratePDFButton } from "@/collections/Lede/generatePDF";

export function GeneratePDFButtonServer( props: AfterListServerProps ){
  const hasperm = hasPermissionReq("view:lede",props.user ?? null)
  if (!hasperm) return (<></>)
  return <GeneratePDFButton pdfurl={"/ledeadmin/bandjies/pdf/"} />
}
