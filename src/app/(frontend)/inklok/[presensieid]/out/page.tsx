import { getPayload } from "payload";
import configPromise from '@payload-config'
import { getPayloadSession } from "@/lib/payload-authjs-custom/exports/server";
import { inklok } from "@/lib/inklok";
import { redirect } from "next/navigation";
import { getID } from "@/utilities/getID";
import { revalidatePath } from "next/cache";

type Args = {
  params: Promise<{
    presensieid: string
  }>
}

export default async function Uitklok({ params: paramsPromise }: Args) {
  const { presensieid } = await paramsPromise
  if (!presensieid) return <h1>Invalid presensie</h1>

  const session = await getPayloadSession()
  if (!session) return <h1>Unauthorized to check out when not signed in</h1>
  const payload = await getPayload({ config: configPromise })
  const presensie = await payload.findByID({
    collection:"presensie",
    id:presensieid,
    depth:1,
    disableErrors:true,
  })
  if (!presensie) return <h1>Presensie not found</h1>

  const sessionUser = session.user

  if (!sessionUser.self_lid) return <h1>Linked lid not found</h1>
  const lid = getID(sessionUser.self_lid)
  const divisie = typeof sessionUser.self_lid === "object" && sessionUser.self_lid.divisie ? getID(sessionUser.self_lid.divisie) : undefined

  // Define the server action outside the component to avoid closure issues
  async function processUitklokWithNotes(formData: FormData) {
    "use server"
    const currentPresensieId = formData.get("presensieId") as string;
    const currentLidId = formData.get("lidId") as string;
    const currentDivisieId = formData.get("divisieId") as string | undefined;
    const notes = formData.get("notes") as string | undefined;

    if (!currentLidId) {
      throw new Error("Lid ID not found in form data.");
    }

    const inklokres = await inklok({
      presensieid: currentPresensieId,
      divisieid: currentDivisieId || undefined,
      lidid: currentLidId,
      tipe: 'uit', // Changed to 'uit'
      scan_time: new Date().toISOString(),
      notes: notes || undefined,
    })

    if ("error" in inklokres) {
      throw new Error(`Uitklok failed: ${inklokres.error}`);
    }
    revalidatePath(`/inklok/${currentPresensieId}/out`);
    redirect(`/inklok/success/${inklokres.inklok.id}`)
  }

  if (lid) {
    if (presensie.notes_required) {
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Notas vereis vir Uitklok {presensie.naam}</h1>
          <form action={processUitklokWithNotes}>
            <input type="hidden" name="presensieId" value={presensie.id} />
            <input type="hidden" name="lidId" value={lid} />
            {divisie && <input type="hidden" name="divisieId" value={divisie} />}
            <label htmlFor="notes" className="block text-lg font-medium text-gray-700 mb-2">Notes:</label>
            <textarea id="notes" name="notes" rows={5} className="border border-gray-300 p-2 w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
            <button type="submit" className="mt-4 p-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Check Out</button>
          </form>
        </div>
      )
    } else {
      const inklokres = await inklok({ presensieid: presensie.id, divisieid: divisie, lidid: lid, tipe: 'uit', scan_time: new Date().toISOString() }) // Changed to 'uit'
      if ("error" in inklokres) return <h1>Uitklok failed: {inklokres.error}</h1>
      redirect(`success/${inklokres.inklok.id}`)
    }
  }

  return <h1>Multiple lede found (unsupported)</h1>
}
