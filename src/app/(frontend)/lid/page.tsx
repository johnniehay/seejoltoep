import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function LidSoekPage({
  searchParams,
}: {
  searchParams: Promise<{ lidnommer?: string }>
}) {
  const { lidnommer } = await searchParams
  let lid = null
  let error = null
  const user = (await auth())?.user
  const perm = hasPermission("view:lede")
  if (!user) return redirect('/signin')
  if (!perm) return <h1>Toegang verbode</h1>

  if (lidnommer) {
    const payload = await getPayload({ config })
    try {
      const result = await payload.find({
        collection: 'lede',
        where: {
          id: {
            equals: lidnommer,
          },
        },
        overrideAccess: false,
        user: user,
        limit: 1,
      })
      if (result.docs.length > 0) {
        lid = result.docs[0]
      } else {
        error = 'Lid nie gevind nie'
      }
    } catch (e) {
      error = 'Fout met soek'
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Lid Soek</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lidnommer">Lidnommer</Label>
              <Input
                id="lidnommer"
                name="lidnommer"
                placeholder="Tik lidnommer..."
                defaultValue={lidnommer || ''}
                className="text-lg p-6"
              />
            </div>
            <Button type="submit" size="lg">Soek</Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {lid && (
        <Card>
          <CardHeader>
            <CardTitle>{lid.naam} {lid.van}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Noemnaam:</strong> {lid.noemnaam}</p>
            <p><strong>Lidnommer:</strong> {lid.id}</p>
            <p><strong>Rol:</strong> {lid.rol}</p>
            {typeof lid.divisie === 'object' && lid.divisie && (
              <p><strong>Divisie:</strong> {lid.divisie.naam}</p>
            )}
             <Button asChild className="mt-4">
                <Link href={`/lid/${lid.id}`}>View Full Details</Link>
             </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
