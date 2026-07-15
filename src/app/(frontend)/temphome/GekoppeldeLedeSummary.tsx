import React from "react";
import { auth } from "@/auth";
import { IconCertificate, IconLogin2, IconUsers, IconWallet } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from '@/components/ui/button'
import { AlertParagraph } from "@/app/(frontend)/temphome/ConstructionButton";
import { Lede, Divisie } from "@/payload-types";
import { getDocNotID } from "@/utilities/getDocNotID";
import { getID } from "@/utilities/getID";
import { cn } from "@/utilities/ui";
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function GekoppeldeLedeSummary() {
  const session = await auth()

  if (!session || !(session.user)) {
    return <></>
  }

  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({
    slug: 'sas_import_settings',
  })
  const inskrywings_link = settings.inskrywings_link

  let members: Array<{
    name: string
    lidnommer: string
    status: string
    stage?: string | null
    button: "skryfin" | "beursie" | ""
    beursieId?: string | null
    beursieBalans?: number | null
    divisieId: string | null
    divisieNaam: string | null
    colorClass: string
  }> = []

  const user = session.user

  // Helper to add member
  const addMember = (lid?: Lede, candidate_lid?: { candidate_self_lid_nommer?: string, lid_nommer?: string|null }, isCandidate?: boolean, candidateStatus?: string) => {
    if (isCandidate && candidate_lid) {
      const isInvalidDob = candidateStatus === 'invalid_dob'
      members.push({
        name: 'Kandidaat',
        lidnommer: candidate_lid.lid_nommer || candidate_lid.candidate_self_lid_nommer || '',
        button: (!isInvalidDob && inskrywings_link) ? 'skryfin' : '',
        status: isInvalidDob
          ? 'Verkeerde geboortedatum'
          : 'Onbekende lid nog nie hierdie jaar of voorheen ingeskry vir Seejol nie. Mag tot 4 dae vat om op te dateer.',
        colorClass: isInvalidDob
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-orange-100 text-orange-800 border-orange-200',
        divisieId: null,
        divisieNaam: null,
      })
    } else if (lid && typeof lid !== 'string') {
      const beursie = lid.beursie
      const balance = typeof beursie === 'object' ? (beursie)?.balance : null
      const button = (!lid.huidige_inskrywing) ? (inskrywings_link ? 'skryfin' : '') : 'beursie'
      const divisie = getDocNotID(lid.divisie)
      members.push({
        name: `${lid.noemnaam || lid.naam} ${lid.van}`,
        lidnommer: lid.id,
        status: 'Gekoppel',
        button: button,
        stage: lid.stage ?? "Nog nie ingeskryf vir Seejol 2026",
        divisieId: lid.divisie ? getID(lid.divisie) : null,
        divisieNaam: divisie?.naam || null,
        beursieId: beursie ? getID(beursie) : null,
        beursieBalans: balance,
        colorClass: 'bg-green-100 text-green-800 border-green-200',
      })
    }
  }

  // Process Self
  if (user.self_lid && typeof user.self_lid !== "string") {
    addMember(user.self_lid, undefined,false)
  } else if (user.candidate_self_lid_nommer) {
    addMember(undefined, { candidate_self_lid_nommer: user.candidate_self_lid_nommer }, true, user.candidate_self_lid_invalid_dob ? 'invalid_dob' : 'unknown')
  }

  // Process Linked
  user.gekoppelde_lede?.forEach((lid) => addMember(getDocNotID(lid), undefined, false))
  user.candidate_gekoppelde_lede?.forEach((cand) =>
    addMember(undefined, cand, true, cand.invalid_dob ? 'invalid_dob' : 'unknown')
  )
  return (<>
    {members.length > 0 && (
        <div className="w-full max-w-4xl">
          {/*<h2 className="text-2xl font-bold mb-4">Gekoppelde Lede</h2>*/}
          <div className="grid gap-4">
            {members.map((m, i) => (
              <div key={i} className={`p-4 rounded-lg border ${m.colorClass}`}>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex-grow">
                    <p className="font-bold">{m.name}</p>
                    <p className="text-sm opacity-80">{m.lidnommer}</p>
                  </div>
                  <div className="flex gap-2">
                  {m.status === 'Gekoppel' && (
                    <Button size="sm" variant="outline" className="rounded-xl border-current opacity-70 hover:opacity-100" asChild title="Sertifikaat">
                      <Link href={`/lid/${m.lidnommer}/sertifikaat`}>
                        <IconCertificate size={16} />
                        <span className="ml-1 hidden sm:inline">Sertifikaat</span>
                      </Link>
                    </Button>
                  )}
                  {m.divisieId && (
                    <Button size="sm" variant="outline" className="rounded-xl border-current opacity-70 hover:opacity-100" asChild title={m.divisieNaam || 'Divisie'}>
                      <Link href={`/divisie/${m.divisieId}`}>
                        <IconUsers size={16} />
                        <span className="ml-1 hidden sm:inline">{m.divisieNaam}</span>
                      </Link>
                    </Button>
                  )}
                  { m.button && (
                    <Button
                      className={cn(
                        "rounded-xl border-2 h-auto py-1",
                        m.button === "beursie" && (m.beursieBalans || 0) < 0
                          ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                          : m.colorClass
                      )}
                      variant="ghost"
                      asChild
                    >
                      <Link href={m.button === "skryfin" ? (inskrywings_link || '#') : `/beursie/${m.beursieId}`}>
                        {m.button === "skryfin" ? <IconLogin2 size={16} /> : <IconWallet size={16} />}
                        <div className="flex flex-col items-center ml-1">
                          <span className="text-xs font-bold leading-tight">{m.button === "skryfin" ? "Skryf in" : "Beursie" }</span>
                          {m.button === "beursie" && m.beursieBalans && (
                            <span className="text-[10px] leading-tight">R {m.beursieBalans.toFixed(2)}</span>
                          )}
                          {m.button === "beursie" && m.beursieBalans === null && (
                            <span className="text-[10px] leading-tight">R ---</span>
                          )}
                        </div>
                      </Link>
                    </Button>
                  ) }
                  </div>
                  <div className="text-right flex-grow">
                    <p className="font-medium">{m.status}</p>
                    {m.stage && (
                      <AlertParagraph className="text-sm mt-1 font-semibold" alertMessage="SAS Status mag tot 4 dae vat om op te dateer." >
                      {/*<p className="text-sm mt-1 font-semibold" onClick={ () => alert("SAS Status mag tot 4 dae vat om op te dateer.") } >*/}
                        SAS Statusⓘ: {m.stage}
                      {/*</p>*/}
                      </AlertParagraph>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
