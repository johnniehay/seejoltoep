import type { CollectionSlug, Endpoint } from 'payload'
import { SasImportService } from './service'
import type { SasImportCollectionConfig } from './types'
import { invalidateSASCache } from "@/plugins/sas-import/actions";

export const getSyncEndpoint = (): Endpoint => ({
  path: '/sas-import/sync/:collectionSlug',
  method: 'post',
  handler: async (req) => {
    if (!req.user || req.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { collectionSlug } = req.routeParams as { collectionSlug: CollectionSlug }
    const { mode = 'analyze', selection, forceRefreshAfter } = await req.json?.()

    try {
      const collectionConfig = req.payload.config.collections.find(c => c.slug === collectionSlug)
      if (!collectionConfig) {
        return Response.json({ error: 'Collection not found' }, { status: 404 })
      }

      const customConfig = collectionConfig.custom?.sasImport as SasImportCollectionConfig | undefined
      if (!customConfig?.enabled) {
        return Response.json(
          { error: 'SAS Import is not enabled for this collection.' },
          { status: 400 },
        )
      }

      const settings = await req.payload.findGlobal({ slug: 'sas_import_settings' })
      if (!settings.webhookUrl) {
        return Response.json(
          { error: 'SAS Import Webhook URL is not configured in Globals.' },
          { status: 500 },
        )
      }

      const service = new SasImportService(settings.webhookUrl, settings, collectionConfig)
      const dryRun = mode === 'analyze'

      const result = await service.importFromSas(req, collectionSlug, dryRun, selection)

      if (forceRefreshAfter) {
        await invalidateSASCache()
      }

      if (!result.success) return Response.json(result, { status: 400 })

      return Response.json(result)
    } catch (error: any) {
      req.payload.logger.error({ msg: `SAS Import Error: ${error.message}`, err: error })
      return Response.json({ error: error.message }, { status: 500 })
    }
  },
})
