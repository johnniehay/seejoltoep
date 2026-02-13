'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { SetupSchema } from './schema'

type LedeLookupResult = {
  found: boolean
  id?: string
  name?: string
  reason?: 'not_found' | 'invalid_dob'
}

async function findLede(payload: any, lidnommer: string, dob: string): Promise<LedeLookupResult> {
  if (!lidnommer || !dob) return { found: false }

  // 1. Find by ID first
  const lede = await payload.find({
    collection: 'lede',
    where: { id: { equals: lidnommer } },
    limit: 1,
  })

  if (lede.docs.length === 0) {
    return { found: false, reason: 'not_found' }
  }

  const lid = lede.docs[0]

  // 2. Check DOB
  const date = new Date(dob)
  const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0)).getTime()
  const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999)).getTime()
  const lidDate = new Date(lid.geboortedatum).getTime()

  if (lidDate >= startOfDay && lidDate <= endOfDay) {
    const nameParts = [lid.noemnaam || lid.naam, lid.van].filter(Boolean)
    return { found: true, id: lid.id, name: nameParts.join(' ') }
  }

  return { found: false, reason: 'invalid_dob' }
}

export async function submitSetup(data: z.infer<typeof SetupSchema>) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return { success: false, message: 'Nie gemagtig nie' }
  }

  // 1. Validate (Server-side double check)
  const validation = SetupSchema.safeParse(data)

  if (!validation.success) {
    const errors: Record<string, string[]> = {}

    validation.error.issues.forEach((issue) => {
      let key = issue.path[0].toString()

      // Map nested children errors to form field names
      // e.g., children[0].lid_nommer -> child_0_lid_nommer
      if (key === 'children' && issue.path.length >= 3) {
        const index = issue.path[1]
        const field = issue.path[2]
        key = `child_${String(index)}_${String(field)}`
      }

      if (!errors[key]) {
        errors[key] = []
      }
      errors[key].push(issue.message)
    })

    return { success: false, message: 'Kyk asseblief na die foute hieronder', errors }
  }

  const updateData: any = {
    tipe: data.tipe,
    role: data.tipe?.toLowerCase(),
  }

  // 3. Process Logic for Self Lid
  const isSelfLid = data.tipe === 'Verkenner' || data.tipe === 'Offisier' || (data.tipe === 'Ouer' && data.isSelfMember)

  if (isSelfLid && data.self_lid_nommer && data.self_lid_dob) {
    const lookup = await findLede(payload, data.self_lid_nommer, data.self_lid_dob)
    if (lookup.found) {
      updateData.self_lid = lookup.id
      if (lookup.name) updateData.name = lookup.name
      // Clear candidate fields if successfully linked
      updateData.candidate_self_lid_nommer = null
      updateData.candidate_self_lid_dob = null
      updateData.candidate_self_lid_invalid_dob = null
    } else {
      updateData.self_lid = null
      updateData.candidate_self_lid_nommer = data.self_lid_nommer
      updateData.candidate_self_lid_dob = data.self_lid_dob
      updateData.candidate_self_lid_invalid_dob = lookup.reason === 'invalid_dob'
    }
  } else {
    // Explicitly clear all self lid fields if not applicable
    updateData.self_lid = null
    updateData.candidate_self_lid_nommer = null
    updateData.candidate_self_lid_dob = null
    updateData.candidate_self_lid_invalid_dob = null
  }

  // Handle Children (Gekoppelde Lede)
  if (data.children && data.children.length > 0) {
    const gekoppeldeLedeIds: string[] = []
    const candidateChildren: any[] = []

    for (const child of data.children) {
      if (child.lid_nommer && child.dob) {
        const lookup = await findLede(payload, child.lid_nommer, child.dob)
        if (lookup.found && lookup.id) {
          gekoppeldeLedeIds.push(lookup.id)
        } else {
          child.invalid_dob = lookup.reason === 'invalid_dob'
          candidateChildren.push(child)
        }
      }
    }

    if (gekoppeldeLedeIds.length > 0) {
      updateData.gekoppelde_lede = gekoppeldeLedeIds
    }
    if (candidateChildren.length > 0) {
      updateData.candidate_gekoppelde_lede = candidateChildren
    }
  } else {
    // Explicitly clear children fields if empty
    updateData.gekoppelde_lede = []
    updateData.candidate_gekoppelde_lede = []
  }

  try {
    await payload.update({ collection: 'users', id: user.id, data: updateData })
    revalidatePath('/setup')
    return { success: true, message: 'Profiel suksesvol opgedateer' }
  } catch (error) {
    return { success: false, message: 'Kon nie profiel opdateer nie' }
  }
}
