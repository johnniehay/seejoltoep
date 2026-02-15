'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { SettingsSchema, LidFormSchema } from './schema'

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

  const updateData: any = {
    tipe: data.tipe,
    role: data.tipe?.toLowerCase(),
  }

  if (data.tipe === 'Offisier') updateData.hasYouth = data.hasYouth
  if (data.tipe === 'Ouer') updateData.isSelfMember = data.isSelfMember

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

  if (lookup.found) {
    updateData.self_lid = lookup.id
    if (lookup.name) updateData.name = lookup.name
    updateData.candidate_self_lid_nommer = null
    updateData.candidate_self_lid_dob = null
    updateData.candidate_self_lid_invalid_dob = null
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
