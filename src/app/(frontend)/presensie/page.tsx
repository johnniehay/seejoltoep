import { getPayload } from 'payload'
import config from '@payload-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function PresensiePage() {
  const payload = await getPayload({ config })
  const user = (await auth())?.user
  if (!user) return redirect('/signin')
  // const perm = hasPermission("view:")
  // if (!perm) return <h1>Toegang verbode</h1>

  const presensies = await payload.find({
    collection: 'presensie',
    limit: 100,
    sort: 'naam',
    overrideAccess: false,
    user: user,
  })

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Presensies</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presensies.docs.map((presensie) => (
          <Card key={presensie.id}>
            <CardHeader>
              <CardTitle>{presensie.naam}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Type: {presensie.presensie_tipe}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/test/inklok/${presensie.id}/scan`}>
                  Scan Page
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href={`/test/inklok/${presensie.id}`}>
                  Self Inklok
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
