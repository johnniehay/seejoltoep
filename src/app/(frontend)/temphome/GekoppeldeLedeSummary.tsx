import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconListCheck, IconSearch } from "@tabler/icons-react";
import React from "react";
import { auth } from "@/auth";


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
    colorClass: string
  }> = []

  const user = session.user

  // Helper to add member
  const addMember = (lid: any, isCandidate: boolean, candidateStatus?: string) => {
    if (isCandidate) {
      const isInvalidDob = candidateStatus === 'invalid_dob'
      members.push({
        name: 'Kandidaat',
        lidnommer: lid.lid_nommer || lid.candidate_self_lid_nommer || '',
        status: isInvalidDob
          ? 'Verkeerde geboortedatum'
          : 'Onbekende lid nog nie hierdie jaar of voorheen ingeskry vir Seejol nie.',
        colorClass: isInvalidDob
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-orange-100 text-orange-800 border-orange-200',
      })
    } else if (lid && typeof lid !== 'string') {
      members.push({
        name: `${lid.noemnaam || lid.naam} ${lid.van}`,
        lidnommer: lid.id,
        status: 'Gekoppel',
        stage: lid.stage,
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
        <div className="w-full max-w-4xl mt-8">
          <h2 className="text-2xl font-bold mb-4">Gekoppelde Lede</h2>
          <div className="grid gap-4">
            {members.map((m, i) => (
              <div key={i} className={`p-4 rounded-lg border ${m.colorClass}`}>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <p className="font-bold">{m.name}</p>
                    <p className="text-sm opacity-80">{m.lidnommer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{m.status}</p>
                    {m.stage && (
                      <p className="text-sm mt-1 font-semibold">
                        Stage: {m.stage}
                      </p>
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
