import type { CollectionConfig, PayloadRequest } from 'payload'
import { checkPermission, checkPermissionOrWhere } from "@/access/checkPermission"
import { updateKennisgewingLog } from "@/collections/KennisgewingLogs/endpoints/updateKennisgewingLog";

const whereMyself = (payloadreq: PayloadRequest)=> {
  if (payloadreq.user)
    return {"user.id": {equals: payloadreq.user.id}}
  else
    return false
}

export const KennisgewingLogs: CollectionConfig<"kennisgewingLogs"> = {
  slug: 'kennisgewingLogs',
  access: {
    create: checkPermission("create:kennisgewinglog"),
    delete: checkPermission("remove:kennisgewinglog"),
    read: checkPermissionOrWhere("view:kennisgewinglog",whereMyself),
    update: checkPermission("update:kennisgewinglog"),
  },
  admin: {
    useAsTitle: 'kennisgewing',
    defaultColumns: ['kennisgewing', 'user', 'shownToUser', 'acknowledgedByUser', 'viewedDetails', 'closedByUser', 'actionTaken', 'pushNotificationSent'],
  },
  endpoints: [updateKennisgewingLog],
  fields: [
    {
      name: 'kennisgewing',
      type: 'relationship',
      relationTo: 'kennisgewings',
      required: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'shown',
      type: 'checkbox',
      defaultValue: false,
      label: 'Shown to User',
    },
    {
      name: 'acknowledged',
      type: 'checkbox',
      defaultValue: false,
      label: 'Acknowledged by User',
    },
    {
      name: 'viewed_details',
      type: 'checkbox',
      defaultValue: false,
      label: 'Viewed Details',
    },
    {
      name: 'closed',
      type: 'checkbox',
      defaultValue: false,
      label: 'Closed by User',
    },
    // {
    //   name: 'actionTaken',
    //   type: 'text', // Could be a select if actions are predefined, or a richText for more details
    //   label: 'Action Taken',
    //   admin: {
    //     description: 'Describes the action taken by the user, if any.',
    //   },
    // },
    {
      name: 'sent_to_subscription',
      type: 'relationship',
      relationTo: 'notificationSubscription',
      hasMany: true,
      label: 'Sent to Subscription',
    },
  ],
}
