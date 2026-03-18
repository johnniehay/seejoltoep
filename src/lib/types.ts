// import { NotificationTopicsOptions } from "@/payload-types";

// export type NotificationTopics = Exclude<NotificationTopicsOptions,null>
// export type NotificationTopic = NotificationTopics[number]
export type NotificationTopics = string[]
export type NotificationTopic = NotificationTopics[number]
