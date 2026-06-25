import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { inklok } from "@/lib/inklok";

export default async function LidDetailPage({ params }: { params: Promise<{ lidid: string }> }) {
  const { lidid } = await params
  const payload = await getPayload({ config })
  const user = (await auth())?.user
  const perm = await hasPermission("view:lede:page")
  const permContacts = await hasPermission("view:lede:contacts")
  const permMedies = await hasPermission("view:lede:medies")

  if (!user) return redirect('/signin')
  if (!perm) return <h1>Toegang verbode</h1>

  const inklokres = await inklok({
    presensieid:"lid_viewed",
    lidid,
    scan_time: new Date().toISOString()
  })

  let lid
  try {
    lid = await payload.findByID({
      collection: 'lede',
      id: lidid,
      // overrideAccess: false,
      // user: user,
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

          {permContacts && (
            <>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Kontak</h3>
                <p><strong>Epos:</strong> {lid.lid_eposadres}</p>
                <p><strong>Kontaknommer:</strong> {lid.lid_kontaknommer}</p>
              </div>
              {lid.kontakpersoon_voor_kamp && (
                <div>
                  <h4 className="font-semibold text-muted-foreground">Kontak Voor Kamp</h4>
                  <p><strong>Kontakpersoon:</strong> {lid.kontakpersoon_voor_kamp}</p>
                  <p><strong>Kontaknommer:</strong> {lid.kontaknommer_voor_kamp}</p>
                  <p><strong>Eposadres:</strong> {lid.eposadres_voor_kamp}</p>
                </div>
              )}
              {lid.kontakpersoon_tydens_kamp && (
                <div>
                  <h4 className="font-semibold text-muted-foreground">Kontak Tydens Kamp</h4>
                  <p><strong>Kontakpersoon:</strong> {lid.kontakpersoon_tydens_kamp}</p>
                  <p><strong>Kontaknommer:</strong> {lid.kontaknommer_tydens_kamp}</p>
                  <p><strong>Eposadres:</strong> {lid.eposadres_tydens_kamp}</p>
                </div>
              )}
              {lid.ma_volle_naam && (
                <div>
                  <h4 className="font-semibold text-muted-foreground">Ma</h4>
                  <p><strong>Volle Naam:</strong> {lid.ma_volle_naam}</p>
                  <p><strong>Kontaknommer:</strong> {lid.ma_kontaknommer}</p>
                  <p><strong>Eposadres:</strong> {lid.ma_eposadres}</p>
                </div>
              )}
              {lid.pa_volle_naam && (
                <div>
                  <h4 className="font-semibold text-muted-foreground">Pa</h4>
                  <p><strong>Volle Naam:</strong> {lid.pa_volle_naam}</p>
                  <p><strong>Kontaknommer:</strong> {lid.pa_kontaknommer}</p>
                  <p><strong>Eposadres:</strong> {lid.pa_eposadres}</p>
                </div>
              )}
              {lid.voog_volle_naam && (
                <div>
                  <h4 className="font-semibold text-muted-foreground">Voog</h4>
                  <p><strong>Volle Naam:</strong> {lid.voog_volle_naam}</p>
                  <p><strong>Kontaknommer:</strong> {lid.voog_kontaknommer}</p>
                  <p><strong>Eposadres:</strong> {lid.voog_eposadres}</p>
                </div>
              )}
            </>
          )}

          <div>
            <h3 className="font-semibold text-muted-foreground mb-2">Kamp Info</h3>
            <p><strong>Kamp:</strong> {lid.kamp}</p>
            <p><strong>Kamp Naam:</strong> {lid.kamp_naam}</p>
            <p><strong>Kursus:</strong> {lid.kamp_kursus}</p>
          </div>

          {permMedies && (
            <>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Medies</h3>
                <p><strong>Mediese Fonds Naam:</strong> {lid.mediese_fonds_naam}</p>
                <p><strong>Mediese Fonds Nommer:</strong> {lid.mediese_fonds_nommer}</p>
                <p><strong>Afhanklikheidskode:</strong> {lid.mediese_fonds_afhanklikheidskode}</p>
                <p><strong>Allergieë:</strong> {lid.allergiee}</p>
                <p><strong>Mediese Kondisies:</strong> {lid.mediese_kondisies}</p>
                <p><strong>Kroniese Medikasie:</strong> {lid.kroniese_medikasie}</p>
                <p><strong>Mediese Notas:</strong> {lid.mediese_notas}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      Aangeteken as inklok {inklokres?.inklok?.id}
    </div>
  )
}
