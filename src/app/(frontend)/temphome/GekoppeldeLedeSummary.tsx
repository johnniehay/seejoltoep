import React from "react";
import { auth } from "@/auth";
import { IconLogin2, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from '@/components/ui/button'
import { AlertParagraph } from "@/app/(frontend)/temphome/ConstructionButton";
import { Lede, Divisie } from "@/payload-types";
import { getDocNotID } from "@/utilities/getDocNotID";
import { getID } from "@/utilities/getID";
import { cn } from "@/utilities/ui";

export default async function GekoppeldeLedeSummary() {
  const session = await auth()

  if (!session || !(session.user)) {
    return <></>
  }

  let members: Array<{
    name: string
    lidnommer: string
    status: string
    stage?: string | null
    button: "skryfin" | "betaal" | ""
    divisieId: string | null
    divisieNaam: string | null
    colorClass: string
  }> = []

  const user = session.user

  // Helper to add member
  const addMember = (lid: Lede|string, isCandidate: boolean, candidateStatus?: string) => {
    if (isCandidate) {
      const isInvalidDob = candidateStatus === 'invalid_dob'
      members.push({
        name: 'Kandidaat',
        lidnommer: lid.lid_nommer || lid.candidate_self_lid_nommer || '',
        button: (!isInvalidDob) ? 'skryfin' : '',
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
      const button = (!lid.huidige_inskrywing)? 'skryfin' : (lid.stage === 'Wag vir Betaling') ? 'betaal' : ''
      const divisie = getDocNotID(lid.divisie)
      members.push({
        name: `${lid.noemnaam || lid.naam} ${lid.van}`,
        lidnommer: lid.id,
        status: 'Gekoppel',
        button: button,
        stage: lid.stage ?? "Nog nie ingeskryf vir Seejol 2026",
        divisieId: lid.divisie ? getID(lid.divisie) : null,
        divisieNaam: divisie?.naam || null,
        colorClass: 'bg-green-100 text-green-800 border-green-200',
      })
    }
  }

  // Process Self
  if (user.self_lid) {
    addMember(user.self_lid, false)
  } else if (user.candidate_self_lid_nommer) {
    addMember({ candidate_self_lid_nommer: user.candidate_self_lid_nommer }, true, user.candidate_self_lid_invalid_dob ? 'invalid_dob' : 'unknown')
  }

  // Process Linked
  user.gekoppelde_lede?.forEach((lid) => addMember(lid, false))
  user.candidate_gekoppelde_lede?.forEach((cand) =>
    addMember(cand, true, cand.invalid_dob ? 'invalid_dob' : 'unknown')
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
                  {m.divisieId && (
                    <Button size="sm" variant="outline" className="rounded-xl border-current opacity-70 hover:opacity-100" asChild title={m.divisieNaam || 'Divisie'}>
                      <Link href={`/divisie/${m.divisieId}`}>
                        <IconUsers size={16} />
                        <span className="ml-1 hidden sm:inline">{m.divisieNaam}</span>
                      </Link>
                    </Button>
                  )}
                  { m.button && (
                    <Button className={cn("text-l rounded-xl border-2", m.colorClass)} variant="ghost" asChild>
                      <Link href={m.button === "skryfin" ? "https://skryfin.voortrekkers.co.za/?kampID=2105" : "/shop?category=69f10615968a4281948d78c6"}>
                        <IconLogin2 size={12} />
                        <span>{m.button === "skryfin" ? "Skryf in" : "Betaal" }</span>
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
