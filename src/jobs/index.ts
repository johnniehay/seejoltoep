import { JobsConfig, PayloadRequest } from "payload";

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
  tasks: [],
  autoRun: [{cron: '* * * * *'}],
}
