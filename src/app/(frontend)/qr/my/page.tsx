import { redirect } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { auth } from "@/auth";
import DownloadableQRCodeSVG from "@/components/downloadableQRCodeSVG";

export default async function MyQRPage() {
  const user = (await auth())?.user
  const self_lid = (await auth())?.user?.self_lid

  if (!user) {
    // Redirect to login, and then back here
    redirect('/signin?redirect=%2Fqr%2Fmy')
  }



  if (!self_lid) {
    return (
      <div className="container mx-auto py-10 min-h-screen flex flex-col items-center justify-center max-w-md text-center">
        <Card>
          <CardHeader>
            <CardTitle>Geen Gekoppelde Lid</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Daar is geen lidprofiel aan jou gebruikersrekening gekoppel nie.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lid_id = self_lid instanceof Object ? self_lid.id : self_lid
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || '/'
  const qrValue = `${serverUrl}/lid/${lid_id}`

  return (
    <div className="container mx-auto py-10 flex flex-col items-center justify-center gap-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          {/*<CardTitle className="text-center text-3xl">{lid.noemnaam || `${lid.naam} ${lid.van}`}</CardTitle>*/}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6">
          <div className="bg-white p-4 rounded-lg w-full aspect-square max-w-[500px]">
            <DownloadableQRCodeSVG marginSize={4} value={qrValue} className="w-full h-full" />
          </div>
          <p className="text-lg text-muted-foreground text-center">Wys hierdie kode om in te skandeer.</p>
        </CardContent>
      </Card>
    </div>
  )
}
