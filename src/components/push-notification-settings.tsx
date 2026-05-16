import PushNotificationSettingsClient from "@/components/push-notification-settings-client";
import { getRoleFromUser } from "@/lib/get-role";
import { defaultNotifcationTopics, roleToNotificationTopicsMap } from "@/lib/role-to-notificationtopics";
import { auth } from "@/auth";

export default async function PushNotificationSettings({compact}: {compact?: boolean}) {
  const penv = process.env
  if (!penv['NEXT_PUBLIC_VAPID_PUBLIC_KEY']) throw "VAPID Key not defined"
  const vapid_public_key = penv['NEXT_PUBLIC_VAPID_PUBLIC_KEY']
  const session = await auth()
  let notificationtopics = defaultNotifcationTopics
  const userRole = getRoleFromUser(session?.user)
  if (userRole) {
    notificationtopics = roleToNotificationTopicsMap[userRole]
  }
  return (<PushNotificationSettingsClient visibleTopics={notificationtopics} vapidPublicKey={vapid_public_key} compact={compact}/>)
}
