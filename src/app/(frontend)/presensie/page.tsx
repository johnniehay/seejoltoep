import { getPayload } from 'payload'
import config from '@payload-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { auth } from "@/auth";
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
              <Button asChild variant="outline" className="w-full">
                <Link href={`/inklok/${presensie.id}/scan`}>
                  Scan Page
                </Link>
              </Button>
              { presensie.self_inklok && (
                <>
                  <Button asChild className="w-full">
                    <Link href={`/inklok/${presensie.id}`}>
                      Self Inklok
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/inklok/${presensie.id}/out`}>
                      Self Uitklok
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Embedded /presensies as an iframe */}
      <div className="mt-10">
        <iframe
          src="/presensies" // Updated src to the new list page
          width="100%"
          height="2500px" // Adjust height as needed
          style={{ border: '1px solid #ccc', borderRadius: '8px' }}
          title="Embedded Presensies"
        ></iframe>
      </div>
    </div>
  )
}
