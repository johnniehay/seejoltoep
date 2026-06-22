import type { BasePayload, PayloadRequest, Where } from 'payload'
import type { Groepe, Lede } from '@/payload-types'
import { getID } from '@/utilities/getID'

/**
 * Synchronizes lede membership in groepe based on their add_lede_where filters.
 * 
 * For each groep with add_lede_where defined:
 * 1. Finds all lede matching the filter and ensures they have this groep
 * 2. If remove_lede_not_in_where is true, removes the groep from non-matching lede
 * 
 * Runs as a Payload Job Task with transaction safety.
 */
export const syncGroepeWhereFilterTask = async ({
  req,
}: {
  req: PayloadRequest
}) => {
  const { payload } = req

  try {
    // Fetch all groepe with add_lede_where configured
    const groepeWithFilter = await payload.find({
      collection: 'groepe',
      where: {
        add_lede_where: {
          not_equals: {},
        },
      },
      limit: 0,
      depth: 0,
      overrideAccess: false,
      req, // Maintain transaction safety
    })

    if (groepeWithFilter.totalDocs === 0) {
      payload.logger.info('syncGroepeWhereFilter: No groepe with add_lede_where found')
      return
    }

    payload.logger.info(
      `syncGroepeWhereFilter: Processing ${groepeWithFilter.totalDocs} groepe`
    )

    for (const groep of groepeWithFilter.docs as Groepe[]) {
      if (!groep.add_lede_where) continue

      const groepId = getID(groep)
      const whereFilter = groep.add_lede_where as Where

      try {
        // Step 1: Find all lede matching the filter
        const matchingLede = await payload.find({
          collection: 'lede',
          where: whereFilter,
          limit: 0,
          depth: 0,
          select: { id: true, groepe: true },
          overrideAccess: false,
          req, // Maintain transaction safety
        })

        const matchingLedeIds = new Set(
          matchingLede.docs.map((lid) => getID(lid))
        )

        payload.logger.info(
          `syncGroepeWhereFilter: Groep "${groep.naam}" (${groepId}): Found ${matchingLedeIds.size} matching lede`
        )

        // Step 2: Add groep to matching lede
        for (const lid of matchingLede.docs as Lede[]) {
          const lidId = getID(lid)
          const currentGroepeIds = (lid.groepe || []).map((g) =>
            typeof g === 'string' ? g : getID(g)
          )

          // Only update if groep is not already in the list
          if (!currentGroepeIds.includes(groepId)) {
            const updatedGroepeIds = [...currentGroepeIds, groepId]

            await payload.update({
              collection: 'lede',
              id: lidId,
              data: {
                groepe: updatedGroepeIds,
              },
              overrideAccess: false,
              req, // Maintain transaction safety - atomic with outer task
            })

            payload.logger.debug(
              `syncGroepeWhereFilter: Added groep ${groepId} to lede ${lidId}`
            )
          }
        }

        // Step 3: Remove groep from non-matching lede (if enabled)
        if (groep.remove_lede_not_in_where) {
          // Find all lede that have this groep
          const ledeWithGroep = await payload.find({
            collection: 'lede',
            where: {
              groepe: {
                equals: groepId,
              },
            },
            limit: 0,
            depth: 0,
            select: { id: true, groepe: true },
            overrideAccess: false,
            req, // Maintain transaction safety
          })

          payload.logger.info(
            `syncGroepeWhereFilter: Groep "${groep.naam}": Found ${ledeWithGroep.totalDocs} lede with this groep`
          )

          for (const lid of ledeWithGroep.docs as Lede[]) {
            const lidId = getID(lid)

            // If this lede doesn't match the filter, remove the groep
            if (!matchingLedeIds.has(lidId)) {
              const currentGroepeIds = (lid.groepe || []).map((g) =>
                typeof g === 'string' ? g : getID(g)
              )

              const updatedGroepeIds = currentGroepeIds.filter(
                (id) => id !== groepId
              )

              await payload.update({
                collection: 'lede',
                id: lidId,
                data: {
                  groepe: updatedGroepeIds,
                },
                overrideAccess: false,
                req, // Maintain transaction safety - atomic with outer task
              })

              payload.logger.debug(
                `syncGroepeWhereFilter: Removed groep ${groepId} from lede ${lidId}`
              )
            }
          }

          payload.logger.info(
            `syncGroepeWhereFilter: Completed removal for groep ${groepId}`
          )
        }

        payload.logger.info(
          `syncGroepeWhereFilter: Completed groep "${groep.naam}" (${groepId})`
        )
      } catch (error) {
        payload.logger.error(
          `syncGroepeWhereFilter: Error processing groep ${groepId}:`,
          error
        )
        // Continue with next groep rather than failing entire task
      }
    }

    payload.logger.info(
      'syncGroepeWhereFilter: Task completed successfully'
    )
  } catch (error) {
    payload.logger.error('syncGroepeWhereFilter: Fatal error:', error)
    throw error
  }
}
