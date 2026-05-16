import type { CollectionAfterChangeHook } from 'payload'
import type { Kennisgewing } from '@/payload-types'
import { sendNotificationToSubscription } from '@/components/push-subscribe-actions'
import { getID } from '@/utilities/getID'

export const sendPushNotification: CollectionAfterChangeHook<Kennisgewing> = async ({
  doc:indoc,
  req,
  operation,
  context,
}) => {
  if (indoc._status === 'published' && !context.skipNotification) {
    const { payload } = req

    const doc = await payload.findByID({collection:"kennisgewings", id:indoc.id, depth:2})

    // Get the groups associated with the kennisgewing
    const groepe = doc.groepe

    if (groepe && groepe.length > 0) {
      const groupIds = groepe.map(groep => typeof groep === 'object' ? groep.id : groep)

      // Find all users associated with these groups
      const usersWithGroups = await payload.find({
        collection: 'users',
        where: {
          groepe: {
            in: groupIds,
          },
        },
        limit: 0,
        depth: 0, // We only need the user IDs
        req, // Pass req for transaction safety
      })

      // Find all lede associated with these groups
      const ledeWithGroups = await payload.find({
        collection: 'lede',
        where: {
          groepe: {
            in: groupIds,
          },
        },
        limit: 0,
        depth: 1, // We need the 'user' relationship to get user IDs
        req, // Pass req for transaction safety
      })

      const userIds = new Set<string>()

      // Add user IDs from direct user-group relationships
      usersWithGroups.docs.forEach(user => userIds.add(user.id))

      // Add user IDs from lede-user-group relationships
      ledeWithGroups.docs.forEach(lede => lede.user?.docs?.forEach(user => userIds.add(typeof user === 'object' ? user.id : user)))
      console.log(`kennisgewing stuur na users ${JSON.stringify(userIds)}`)
      if (userIds.size > 0) {
        const logsByUser = new Map<string,string>()
        let missinglogusers = new Set<string>(userIds)
        if (operation === 'update') {
          const existingLogs = await payload.find({
            collection: 'kennisgewingLogs',
            where: {
              kennisgewing: {
                equals: doc.id,
              },
            },
            select: { user: true},
            limit: 0,
            depth: 0
          })
          existingLogs.docs.forEach(log => logsByUser.set(getID(log.user), log.id))
          missinglogusers = userIds.difference(new Set(logsByUser.keys()))
        }
        if (missinglogusers.size > 0) {
          const createdLogsResult = await Promise.allSettled(missinglogusers.values().map(
            (missinguser) => payload.create({
              collection: 'kennisgewingLogs',
              data: {
                kennisgewing: doc.id,
                user: missinguser,
              }
            })))
          createdLogsResult.forEach((res) => {
            if (res.status === 'rejected') {
              payload.logger.error(`sendPushNotification creation of kennisgewingLog failed ${res.reason}`)
            } else {
              logsByUser.set(getID(res.value.user), res.value.id)
            }
          })
        }

        if (doc.notify) {
          // Find notification subscriptions for these users
          const subscriptions = await payload.find({
            collection: 'notificationSubscription',
            where: {
              user: {
                in: Array.from(userIds),
              },
            },
            limit: 0,
            depth: 0,
            req, // Pass req for transaction safety
          })

          const notificationPayload: SWNotificationOptions = {
            title: doc.title || 'Nuwe Kennisgewing',
            body: doc.body || 'U het \'n nuwe kennisgewing ontvang.',
            icon: typeof doc.icon === 'object' && doc.icon !== null && doc.icon.url !== null ? doc.icon.url : '/icon-192.png',
            image: typeof doc.image === 'object' && doc.image !== null && doc.image.url !== null ? doc.image.url : undefined,
            navigate: doc.navigate || '/',
            tag: doc.tag || doc.id,
            timestamp: doc.timestamp ? new Date(doc.timestamp).getTime() : Date.now(),
            //TODO: Add badge seejol logo
          }

          const sentToSubscriptionsByUsers = new Map<string,string[]>()
          // Send notifications
          for (const sub of subscriptions.docs) {
            if (sub.endpoint && sub.keys) {
              try {
                const sendres = await sendNotificationToSubscription( // Use the new function
                  sub.endpoint,
                  sub.keys,
                  notificationPayload,
                  payload,
                )
                if (sendres.success && sub.user) {
                  sentToSubscriptionsByUsers.set(getID(sub.user), [...(sentToSubscriptionsByUsers.get(getID(sub.user)) || []), sub.id])
                }
              } catch (error) {
                console.error(`Error sending notification to ${sub.endpoint}:`, error)
                // The sendNotificationToSubscription function already handles deleting invalid subscriptions,
                // so we don't need to do it here again.
              }
            }
          }
          if (sentToSubscriptionsByUsers.size > 0) {
            const logSentUpdateResult = await Promise.allSettled(sentToSubscriptionsByUsers.entries().map((entry) => {
              const [useridkey, sentsubs] = entry
              const userid = logsByUser.get(useridkey)
              if (userid === undefined) throw "sendPushNotification userid not found"
              return payload.update({
                collection: 'kennisgewingLogs',
                id: userid,
                data: {
                  sent_to_subscription: sentsubs
                }
              })
            }))
            logSentUpdateResult.forEach((res) => {
              if (res.status === 'rejected') {
                payload.logger.error(`sendPushNotification update of kennisgewingLog failed ${res.reason}`)
              }
            })
          }
        }
      }
    }
  }
  return indoc
}
