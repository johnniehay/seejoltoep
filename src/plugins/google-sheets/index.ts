import type { CollectionSlug, Config, Payload, Plugin } from 'payload'
import { GoogleSheetsService } from './service'
import type { GoogleSheetsPluginConfig, GoogleSheetsSettings } from './types'
import { GoogleSheetsSettingsGlobal } from './settings'
import { LEDE_INITIAL_CONFIG } from "./initial";

const getSettings = async (payload: Payload): Promise<GoogleSheetsSettings> => {
  const settings = (await payload.findGlobal({
    slug: 'google_sheets_settings',
  }))

  if (!settings.sheetId) {
    // Bootstrap with env and Lede config if empty
    const defaultsettings: GoogleSheetsSettings = {
      sheetId: process.env.GOOGLE_SHEET_ID || '',
      collections: [LEDE_INITIAL_CONFIG],
    }
    return payload.updateGlobal({slug: 'google_sheets_settings', data: defaultsettings})
  }

  return settings
}

export const googleSheetsPlugin =
  (pluginConfig: GoogleSheetsPluginConfig): Plugin =>
    (config: Config): Config => {
      if (pluginConfig.enabled === false) return config

      return {
        ...config,
        globals: [...(config.globals || []), GoogleSheetsSettingsGlobal],
        endpoints: [
          ...(config.endpoints || []),
          {
            path: '/google-sheets/targets/:collectionSlug',
            method: 'get',
            handler: async (req) => {
              if (!req.user || !req.user.role?.includes('admin')) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 })
              }
              const { collectionSlug } = req.routeParams as { collectionSlug: CollectionSlug }
              const settings = await getSettings(req.payload)
              const collectionSettings = settings.collections.find((c) => c.slug === collectionSlug)

              if (!collectionSettings) return Response.json({ targets: [] })

              const targets = collectionSettings.targets

              return Response.json({ targets })
            }
          },
          {
            path: '/google-sheets/local-changes/:collectionSlug',
            method: 'get',
            handler: async (req) => {
              if (!req.user || !req.user.role?.includes('admin')) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 })
              }

              const { collectionSlug } = req.routeParams as { collectionSlug: CollectionSlug }

              try {
                const settings = await getSettings(req.payload)
                const collectionSettings = settings.collections.find((c) => c.slug === collectionSlug)
                const fieldsToCheck = new Set<string>()

                collectionSettings?.targets.forEach((t) => {
                  Object.keys(t.mapping).forEach((fieldName) => fieldsToCheck.add(fieldName))
                })

                if (fieldsToCheck.size === 0) return Response.json({ changes: [] })

                const service = new GoogleSheetsService(settings.sheetId)
                const result = await service.analyzeLocalChanges(
                  req.payload,
                  collectionSlug,
                  Array.from(fieldsToCheck),
                )
                return Response.json(result)
              } catch (error: any) {
                return Response.json({ error: error.message }, { status: 500 })
              }
            },
          },
          {
            path: '/google-sheets/sync/:collectionSlug',
            method: 'post',
            handler: async (req) => {
              // Security: Ensure user is authenticated and has admin role
              if (!req.user || !req.user.role?.includes('admin')) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 })
              }

              const { collectionSlug } = req.routeParams as { collectionSlug: CollectionSlug }
              const {
                direction = 'export',
                mode = 'analyze',
                selection,
                target,
              } = ((await req.json?.().catch(() => ({}))) || {}) as {
                direction: 'export' | 'import'
                mode: 'analyze' | 'execute'
                selection?: string[] | number[]
                target?: string
              }

              const settings = await getSettings(req.payload)
              const collectionSettings = settings.collections.find((c) => c.slug === collectionSlug)
              const selectedTarget = collectionSettings?.targets.find((t) => t.name === target)

              if (!selectedTarget) {
                return Response.json({ error: 'Sync target not found in settings' }, { status: 400 })
              }

              const tabName = selectedTarget.tabName
              const mapping = selectedTarget.mapping
              const keyField = selectedTarget.keyField || 'id'
              const where = selectedTarget.where

              try {
                const service = new GoogleSheetsService(settings.sheetId)
                let result
                const dryRun = mode === 'analyze'

                if (direction === 'export') {
                  result = await service.exportToSheet(req.payload, collectionSlug, tabName, mapping, keyField, dryRun, selection as string[], where)
                } else {
                  result = await service.importFromSheet(req.payload, collectionSlug, tabName, mapping, keyField, dryRun, selection as number[])
                }

                if (!result.success) {
                  return Response.json(result, { status: 400 })
                }

                return Response.json(result)
              } catch (error: any) {
                const msg = error?.response?.data?.error?.message || error?.message || 'Unknown error'
                req.payload.logger.error({ msg: `Google Sheets Sync Error: ${msg}`, err: error })
                return Response.json({ error: msg }, { status: 500 })
              }
            },
          },
        ],
        collections: (config.collections || []).map((collection) => {
          const isConfigured = pluginConfig.collections.includes(collection.slug as CollectionSlug)

          if (isConfigured) {
            return {
              ...collection,
              admin: {
                ...collection.admin,
                components: {
                  ...collection.admin?.components,
                  beforeList: [
                    ...(collection.admin?.components?.beforeList || []),
                    {
                      path: '@/plugins/google-sheets/components/SyncButton',
                      exportName: 'SyncButton',
                      serverProps: {
                        collectionSlug: collection.slug,
                      },
                    },
                  ],
                },
              },
            }
          }
          return collection
        }),
      }
    }
