'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function createMissingBeursies() {
  const payload = await getPayload({ config })

  try {
    // 1. Find Lede who have a registration and no wallet
    const ledeResponse = await payload.find({
      collection: 'lede',
      depth: 1, // Get registration details to check 'stage'
      limit: 0,
      where: {
        and: [
          { huidige_inskrywing: { exists: true } },
          { beursie: { exists: false } },
          { stage: { not_equals: 'Gekanselleer' } }
        ],
      },
    })

    // 2. Filter out those where the registration is cancelled
    const eligibleLede = ledeResponse.docs

    if (eligibleLede.length === 0) {
      return { success: true, message: 'Geen nuwe beursies om te skep nie.' }
    }

    let createdCount = 0

    // 3. Create a Beursie for each and link it
    for (const lid of eligibleLede) {
      const newBeursie = await payload.create({
        collection: 'beursies',
        data: {
          name: `${lid.vertoonnaam} ${lid.id}`
        }
      })

      await payload.update({
        collection: 'lede',
        id: lid.id,
        data: {
          beursie: newBeursie.id,
        },
      })
      createdCount++
    }

    return { success: true, message: `${createdCount} beursies suksesvol geskep.` }
  } catch (error: any) {
    console.error('Error creating beursies:', error)
    return { success: false, message: `Fout: ${error.message || 'Kon nie beursies skep nie.'}` }
  }
}
