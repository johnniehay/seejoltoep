"use server";

import { z } from "zod";
import { authActionClient, optionalAuthActionClient } from "@/lib/safe-action";
import webpush from 'web-push'
import { NotificationSubscription } from "@/payload-types";
import { PaginatedDocs } from "payload";
import { NotificationTopics } from "@/lib/types";
// import { prisma } from "@/prisma";
// import { NotificationSubscription } from "@prisma/client";

// This schema is used to validate input from client.


webpush.setVapidDetails(
  'https://www.seejol.voortrekkers.co.za/',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)
const schemaPushSubscription = z.object({
  endpoint: z.string(),
  expirationTime: z.number().nullable(),
  keys: z.object({
    p256dh: z.string().length(87),
    auth: z.string().length(22),
  }),
})
// type zPushSubscription = z.infer<typeof schemaPushSubscriptionMan>
// const schemaPushSubscription = z.custom<webpush.PushSubscription>
const schemaPushSubscriptionTopic = z.object({
  sub: schemaPushSubscription,
  topics: z.custom<NotificationTopics>(),
});

export const subscribeUser = optionalAuthActionClient
  .metadata({ actionName: "subscribeUser" })
  .schema(schemaPushSubscriptionTopic)
  .action(async ({ parsedInput: { sub, topics }, ctx: { session, payload } }) => {
    // .action(async ({ parsedInput: {sub, topic}, ctx: {session}}) =>
    //     subscribeUser(sub,topic,session))
// async function subscribeUser(sub: webpush.PushSubscription, topic: string, session) {
    // subscription = sub
    console.log('Subscribe user: ', JSON.stringify(sub))
    // const session = await auth()
    console.log('Session: ', JSON.stringify(session))
    await payload.create({
      collection: 'notificationSubscription',
      data: {
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime ? new Date(sub.expirationTime * 1000).toISOString() : null,
        keys: sub.keys,
        topics: topics as NotificationTopics,
        user: session?.user
      },
    });
    // In a production environment, you would want to store the subscription in a database
    // For example: await db.subscriptions.create({ data: sub })
    return { success: true }
  })
export const unsubscribeUser = optionalAuthActionClient
  .metadata({ actionName: "unsubscribeUser" })
  .schema(z.object({ sub: schemaPushSubscription }))
  .action(async ({ parsedInput: { sub }, ctx: { session, payload } }) => {
// export async function unsubscribeUser(sub: webpush.PushSubscription | null) {
    console.log('Unsubscribe user: ', JSON.stringify(sub))
    const userId = session?.user?.id

    const dbsubscription: PaginatedDocs<NotificationSubscription> = await payload.find({
      collection:'notificationSubscription',
      limit: 1,
      pagination: false,
      where: { endpoint: {equals: sub.endpoint} } })
    if (dbsubscription.totalDocs > 0 && dbsubscription.docs[0]?.user && typeof dbsubscription.docs[0].user !== "string" ) {
      if (dbsubscription.docs[0].user.id !== userId) {
        // allow deletion of subscription with userid only by that user
        return { success: false }
      }
    }

    await payload.delete({
      collection:'notificationSubscription',
      where: { endpoint: {equals:sub.endpoint }} })
    // subscription = null

    // In a production environment, you would want to remove the subscription from the database
    // For example: await db.subscriptions.delete({ where: { ... } })
    return { success: true }
  })

export const getSubscriptionTopics = optionalAuthActionClient
  .metadata({ actionName: "getSubscriptionTopics" })
  .schema(z.object({ sub: schemaPushSubscription }))
  .action(async ({ parsedInput: { sub }, ctx: { session, payload } }) => {
    // const userId = session?.user?.id

    const dbsubscription: PaginatedDocs<NotificationSubscription> = await payload.find({
      collection:'notificationSubscription',
      limit: 1,
      pagination: false,
      where: { and: [{endpoint: {equals: sub.endpoint} },{keys: {equals: sub.keys} }]}})
    if (dbsubscription.totalDocs > 0 ) {
      return dbsubscription.docs[0].topics
    } else {
      return null
    }
  })

export const setSubscriptionTopics = optionalAuthActionClient
  .metadata({ actionName: "setSubscriptionTopics" })
  .schema(schemaPushSubscriptionTopic)
  .action(async ({ parsedInput: { sub , topics }, ctx: { session, payload } }) => {
    // const userId = session?.user?.id

    const dbsubscription = await payload.update({
      collection:'notificationSubscription',
      limit: 1,
      where: { and: [{endpoint: {equals: sub.endpoint} },{keys: {equals: sub.keys} }]},
      data: {topics: topics }}) //TODO: handle case where endpoint changed
    if (dbsubscription.errors.length === 0 ) {
      return {success: topics}
    } else {
      return {failed: dbsubscription.errors}
    }
  })



export const sendNotification = authActionClient
  .metadata({ actionName: "sendNotification: " })
  .schema(z.object({ message: z.string() }))
  .action(async ({ parsedInput: { message }, ctx:{payload} }) => {
// export async function sendNotification(message: string) {
    // if (!subscription) {
    //     throw new Error('No subscription available')
    // }
    const notifySubscriptions = (await payload.find({
      collection:'notificationSubscription',
      pagination: false,
      where: { topics: { in: "test" } }
    })).docs
    console.log("notifySubscriptions", notifySubscriptions)
    const failedSubcriptions: webpush.PushSubscription[] = []
    for (const dbsubscription of notifySubscriptions) {
      const subscription: webpush.PushSubscription = {
        endpoint: dbsubscription.endpoint,
        keys: dbsubscription.keys
      }

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: 'Toets Kennisgewing',
            body: message,
            icon: '/icon-192.png',
            url: '/'
          })
        )
        // return {success: true}
      } catch (error) {
        failedSubcriptions.push(subscription)
        console.error('Error sending push notification:', error, subscription)
        await payload.delete({
          collection:'notificationSubscription',
          where: { endpoint: { equals: subscription.endpoint } } })
      }
    }
    if (failedSubcriptions.length > 0) {
      return { success: false, error: 'Failed to send some notification(s)' }
    } else {
      return { success: true }
    }
  })
