import { JobsConfig, PayloadRequest } from "payload";
import { syncGroepeWhereFilterTask } from "./syncGroepeWhereFiler";

export const jobsConfig: JobsConfig = {
  access: {
    run: ({ req }: { req: PayloadRequest }): boolean => {
      // Allow logged in users to execute this endpoint (default)
      if (req.user) return true

      // If there is no logged in user, then check
      // for the Vercel Cron secret to be present as an
      // Authorization header:
      const authHeader = req.headers.get('authorization')
      return authHeader === `Bearer ${process.env.CRON_SECRET}`
    },
  },
  tasks: [
    {
      slug: 'sync-groepe-where-filter',
      label: 'Sync Groepe Where Filter',

      //description: 'Synchronizes lede membership in groepe based on their add_lede_where filters. Adds matching lede to groups and optionally removes non-matching lede.',
      handler: syncGroepeWhereFilterTask,
      schedule: [{cron: '*/5 * * * *', queue: "5min"}]
    },
  ],
  autoRun: [{cron: '*/5 * * * *', queue:"5min"}, {cron: '* * * * *'}], // Every 5 minutes
}
