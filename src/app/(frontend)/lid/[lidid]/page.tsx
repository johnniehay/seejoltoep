import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

export default async function LidDetailPage({ params }: { params: Promise<{ lidid: string }> }) {
  const { lidid } = await params
  const payload = await getPayload({ config })
  const user = (await auth())?.user
  const perm = hasPermission("view:lede")
  if (!user) return redirect('/signin')
  if (!perm) return <h1>Toegang verbode</h1>

  let lid
  try {
    lid = await payload.findByID({
      collection: 'lede',
      id: lidid,
      overrideAccess: false,
      user: user,
    })
  } catch (error) {
    notFound()
  }

  if (!lid) return notFound()

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{lid.naam} {lid.van}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-muted-foreground">Algemeen</h3>
              <p><strong>Noemnaam:</strong> {lid.noemnaam}</p>
              <p><strong>Lidnommer:</strong> {lid.id}</p>
              <p><strong>Rol:</strong> {lid.rol}</p>
              <p><strong>Geslag:</strong> {lid.geslag}</p>
              <p><strong>Geboortedatum:</strong> {lid.geboortedatum ? new Date(lid.geboortedatum).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">Organisasie</h3>
              {typeof lid.divisie === 'object' && lid.divisie && (
                <p><strong>Divisie:</strong> {lid.divisie.naam}</p>
              )}
              <p><strong>Skoolgraad:</strong> {lid.skoolgraad}</p>
              <p><strong>Posisie:</strong> {lid.posisie}</p>
              <p><strong>Kommando:</strong> {lid.kommando}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-muted-foreground mb-2">Kontak</h3>
            <p><strong>Epos:</strong> {lid.lid_eposadres}</p>
            <p><strong>Kontaknommer:</strong> {lid.lid_kontaknommer}</p>
          </div>

          <div>
            <h3 className="font-semibold text-muted-foreground mb-2">Kamp Info</h3>
            <p><strong>Kamp:</strong> {lid.kamp}</p>
            <p><strong>Kamp Naam:</strong> {lid.kamp_naam}</p>
            <p><strong>Kursus:</strong> {lid.kamp_kursus}</p>
          </div>

          {lid.mediese_kondisies && (
             <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Medies</h3>
                <p className="whitespace-pre-wrap">{lid.mediese_kondisies}</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
