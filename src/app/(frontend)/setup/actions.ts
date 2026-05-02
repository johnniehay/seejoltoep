'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { SettingsSchema, LidFormSchema } from './schema'
import { Lede } from '@/payload-types'
import { getUpdatedRole } from "@/collections/Lede/hooks/updateuser";
import { hasPermission } from "@/lib/permissions";

type LedeLookupResult = {
  found: boolean
  id?: string
  name?: string
  lid?: Lede
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
  const dateE = new Date(dob)
  const startOfDay = new Date(date.setUTCHours(-3, 0, 0, 0)).getTime()
  const endOfDay = new Date(dateE.setUTCHours(23, 59, 59, 999)).getTime()
  const lidDate = new Date(lid.geboortedatum).getTime()

  if (lidDate >= startOfDay && lidDate <= endOfDay) {
    const nameParts = [lid.noemnaam || lid.naam, lid.van].filter(Boolean)
    return { found: true, id: lid.id, name: lid.vertoonnaam || nameParts.join(' '), lid: lid }
  }

  return { found: false, reason: 'invalid_dob' }
}

export async function updateSettings(data: z.infer<typeof SettingsSchema>) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return { success: false, message: 'Nie gemagtig nie' }
  }

  const validation = SettingsSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, message: 'Ongeldige data', errors: validation.error.flatten().fieldErrors }
  }

  const { tipe, hasYouth, isSelfMember } = validation.data
  const updateData: any = {}

  // 'tipe' will be undefined if the field was disabled on the form
  if (tipe && !user.tipe) {
    updateData.tipe = tipe
    if (!user.role) {
      if (tipe === 'Jeuglid') {
        updateData.role = 'kanidaat-jeuglid'
      } else if (tipe === 'Offisier') {
        updateData.role = 'kanidaat-offisier'
      } else if (tipe === 'Ouer') {
        updateData.role = 'ouer'
      }
    }
  }
  if (user.self_lid) {
    if (typeof user.self_lid === "string") throw "updateSettings user.self_lid is string"
    const userRoleUpdate = getUpdatedRole(user.self_lid, updateData.role)
    payload.logger.warn(`userRoleUpdate: ${JSON.stringify(userRoleUpdate)}`)
    if ("role" in userRoleUpdate) {
      updateData.role = userRoleUpdate.role
    }
  }

  const currentTipe = user.tipe || tipe

  if (currentTipe === 'Offisier') updateData.hasYouth = hasYouth
  if (currentTipe === 'Ouer') updateData.isSelfMember = isSelfMember

  try {
    await payload.update({ collection: 'users', id: user.id, data: updateData })
    revalidatePath('/setup')
    return { success: true, message: 'Instellings gestoor' }
  } catch (error) {
    return { success: false, message: 'Kon nie instellings stoor nie' }
  }
}

export async function updateSelfLid(data: z.infer<typeof LidFormSchema>) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return { success: false, message: 'Nie gemagtig nie' }

  const validation = LidFormSchema.safeParse(data)
  if (!validation.success) return { success: false, message: 'Ongeldige data', errors: validation.error.flatten().fieldErrors }

  const lookup = await findLede(payload, data.lid_nommer, data.dob)
  const updateData: any = {}

  if (lookup.found && lookup.lid) {
    updateData.self_lid = lookup.id
    if (lookup.name) updateData.name = lookup.name
    updateData.candidate_self_lid_nommer = null
    updateData.candidate_self_lid_dob = null
    updateData.candidate_self_lid_invalid_dob = null

    // const userRoleUpdate = getUpdatedRole(lookup.lid, user.role)
    // payload.logger.warn(`userRoleUpdate: ${JSON.stringify(userRoleUpdate)}`)
    // if ("role" in userRoleUpdate) {
    //   updateData.role = userRoleUpdate.role
    // }

  } else {
    updateData.self_lid = null
    updateData.candidate_self_lid_nommer = data.lid_nommer
    updateData.candidate_self_lid_dob = data.dob
    updateData.candidate_self_lid_invalid_dob = lookup.reason === 'invalid_dob'
  }

  try {
    await payload.update({ collection: 'users', id: user.id, data: updateData })
    revalidatePath('/setup')
    return { success: true, message: 'Self lid gestoor' }
  } catch (error) {
    return { success: false, message: 'Fout met stoor' }
  }
}

export async function upsertChild(data: z.infer<typeof LidFormSchema> & { row_id?: string, original_id?: string, original_type?: 'linked' | 'candidate' }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return { success: false, message: 'Nie gemagtig nie' }

  const validation = LidFormSchema.safeParse(data)
  if (!validation.success) return { success: false, message: 'Ongeldige data', errors: validation.error.flatten().fieldErrors }

  // Fetch fresh user data to get current arrays
  const currentUser = await payload.findByID({ collection: 'users', id: user.id, depth: 0 })

  let gekoppelde = (currentUser.gekoppelde_lede as string[]) || []
  let candidates = (currentUser.candidate_gekoppelde_lede as any[]) || []

  const lookup = await findLede(payload, data.lid_nommer, data.dob)
  const newIsLinked = lookup.found && !!lookup.id

  if (data.original_type === 'linked' && data.original_id) {
    const index = gekoppelde.indexOf(data.original_id)
    if (index !== -1) {
      if (newIsLinked) {
        gekoppelde[index] = lookup.id!
      } else {
        gekoppelde.splice(index, 1)
        candidates.push({
          row_id: data.row_id || crypto.randomUUID(),
          lid_nommer: data.lid_nommer,
          dob: data.dob,
          invalid_dob: lookup.reason === 'invalid_dob'
        })
      }
    } else {
      // Fallback if original not found
      if (newIsLinked) {
        if (!gekoppelde.includes(lookup.id!)) gekoppelde.push(lookup.id!)
      } else {
        candidates.push({
          row_id: data.row_id || crypto.randomUUID(),
          lid_nommer: data.lid_nommer,
          dob: data.dob,
          invalid_dob: lookup.reason === 'invalid_dob'
        })
      }
    }
  } else if (data.original_type === 'candidate' && data.original_id) {
    const index = candidates.findIndex(c => c.row_id === data.original_id || c.id === data.original_id)
    if (index !== -1) {
      if (!newIsLinked) {
        candidates[index] = {
          ...candidates[index],
          lid_nommer: data.lid_nommer,
          dob: data.dob,
          invalid_dob: lookup.reason === 'invalid_dob'
        }
      } else {
        candidates.splice(index, 1)
        if (!gekoppelde.includes(lookup.id!)) {
          gekoppelde.push(lookup.id!)
        }
      }
    } else {
      // Fallback
      if (newIsLinked) {
        if (!gekoppelde.includes(lookup.id!)) gekoppelde.push(lookup.id!)
      } else {
        candidates.push({
          row_id: data.row_id || crypto.randomUUID(),
          lid_nommer: data.lid_nommer,
          dob: data.dob,
          invalid_dob: lookup.reason === 'invalid_dob'
        })
      }
    }
  } else {
    // New item
    if (newIsLinked) {
      if (!gekoppelde.includes(lookup.id!)) {
        gekoppelde.push(lookup.id!)
      }
    } else {
      candidates.push({
        row_id: data.row_id || crypto.randomUUID(),
        lid_nommer: data.lid_nommer,
        dob: data.dob,
        invalid_dob: lookup.reason === 'invalid_dob'
      })
    }
  }

  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        gekoppelde_lede: gekoppelde,
        candidate_gekoppelde_lede: candidates
      }
    })
    revalidatePath('/setup')
    return { success: true, message: 'Lid gestoor' }
  } catch (error) {
    return { success: false, message: 'Fout met stoor' }
  }
}

export async function removeChild(id: string, type: 'linked' | 'candidate') {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return { success: false, message: 'Nie gemagtig nie' }

  const currentUser = await payload.findByID({ collection: 'users', id: user.id, depth: 0 })

  let gekoppelde = (currentUser.gekoppelde_lede as string[]) || []
  let candidates = (currentUser.candidate_gekoppelde_lede as any[]) || []

  if (type === 'linked') {
    gekoppelde = gekoppelde.filter(lidId => lidId !== id)
  } else {
    candidates = candidates.filter(c => c.row_id !== id && c.id !== id)
  }

  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        gekoppelde_lede: gekoppelde,
        candidate_gekoppelde_lede: candidates
      }
    })
    revalidatePath('/setup')
    return { success: true, message: 'Lid verwyder' }
  } catch (error) {
    return { success: false, message: 'Kon nie verwyder nie' }
  }
}

export async function linkAllCandidateUsers() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || !await hasPermission("update:users")) {
    return { success: false, message: 'Nie gemagtig nie' }
  }

  const usersToProcess = await payload.find({
    collection: 'users',
    where: {
      or: [
        { candidate_self_lid_nommer: { exists: true } },
        { candidate_gekoppelde_lede: { exists: true } },
      ],
    },
    depth: 0,
    limit: 1000, // Limit to prevent overwhelming the server
  })

  let successfulLinks = 0
  let failedLinks = 0

  for (const currentUser of usersToProcess.docs) {
    const updateData: any = {}
    let userUpdated = false

    // Process candidate_self_lid
    if (currentUser.candidate_self_lid_nommer && currentUser.candidate_self_lid_dob) {
      const lookup = await findLede(payload, currentUser.candidate_self_lid_nommer, currentUser.candidate_self_lid_dob)
      if (lookup.found && lookup.id && lookup.lid) { // Ensure lookup.lid exists
        updateData.self_lid = lookup.id
        if (lookup.name) updateData.name = lookup.name
        updateData.candidate_self_lid_nommer = null
        updateData.candidate_self_lid_dob = null
        updateData.candidate_self_lid_invalid_dob = null

        const userRoleUpdate = getUpdatedRole(lookup.lid, currentUser.role)
        payload.logger.warn(`userRoleUpdate for user ${currentUser.id}: ${JSON.stringify(userRoleUpdate)}`)
        if ("role" in userRoleUpdate) {
          updateData.role = userRoleUpdate.role
        }

        userUpdated = true
        successfulLinks++
      } else {
        updateData.candidate_self_lid_invalid_dob = lookup.reason === 'invalid_dob'
        userUpdated = true
        failedLinks++
      }
    }

    // Process candidate_gekoppelde_lede
    if (currentUser.candidate_gekoppelde_lede && currentUser.candidate_gekoppelde_lede.length > 0) {
      let gekoppelde = (currentUser.gekoppelde_lede as string[]) || []
      let candidates = []

      for (const candidate of currentUser.candidate_gekoppelde_lede) {
        if (candidate.lid_nommer && candidate.dob) {
          const lookup = await findLede(payload, candidate.lid_nommer, candidate.dob)
          if (lookup.found && lookup.id) {
            if (!gekoppelde.includes(lookup.id)) {
              gekoppelde.push(lookup.id)
            }
            successfulLinks++
          } else {
            candidates.push({
              ...candidate,
              invalid_dob: lookup.reason === 'invalid_dob'
            })
            failedLinks++
          }
        } else {
          candidates.push(candidate) // Keep invalid candidates
          failedLinks++
        }
      }
      updateData.gekoppelde_lede = gekoppelde
      updateData.candidate_gekoppelde_lede = candidates
      userUpdated = true
    }

    if (userUpdated) {
      try {
        await payload.update({
          collection: 'users',
          id: currentUser.id,
          data: updateData,
          req: { user: user } as any, // Pass the admin user for access control
        })
      } catch (error) {
        console.error(`Error updating user ${currentUser.id}:`, error)
        // Handle error, maybe log it or add to a separate failed list
      }
    }
  }

  revalidatePath('/setup') // Revalidate relevant paths if needed
  return {
    success: true,
    message: `Linking process complete. Successful links: ${successfulLinks}, Failed links: ${failedLinks}.`,
  }
}
