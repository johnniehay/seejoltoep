import type { CollectionSlug, Config, Plugin } from 'payload'
import { GoogleSheetsService } from './service'
import type { GoogleSheetsPluginConfig, GoogleSheetsCollectionConfig } from './types'

export const googleSheetsPlugin =
  (pluginConfig: GoogleSheetsPluginConfig): Plugin =>
    (config: Config): Config => {
      if (pluginConfig.enabled === false) return config

      return {
        ...config,
        admin: {
          ...config.admin,
          components: {
            ...config.admin?.components,
            // Register the component for use in collections
            // Note: In a real package, this path needs to be resolvable
          },
        },
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
              const collectionConfig = req.payload.config.collections.find(c => c.slug === collectionSlug)
              const customConfig = collectionConfig?.custom?.googleSheets as GoogleSheetsCollectionConfig | undefined

              if (!customConfig) return Response.json({ targets: [] })

              const targets = customConfig.targets || []
              
              // Include default/legacy target if it exists
              if (customConfig.tabName) {
                targets.unshift({
                  name: 'Default',
                  tabName: customConfig.tabName,
                  mapping: customConfig.mapping,
                  keyField: customConfig.keyField
                })
              }

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
                const service = new GoogleSheetsService(pluginConfig.sheetId)
                const result = await service.analyzeLocalChanges(req.payload, collectionSlug)
                return Response.json(result)
              } catch (error: any) {
                return Response.json({ error: error.message }, { status: 500 })
              }
            }
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
              const { direction = 'export', mode = 'analyze', selection, target } = (await req.json?.().catch(() => ({})) || {}) as { 
                direction: 'export' | 'import', 
                mode: 'analyze' | 'execute',
                selection?: string[] | number[],
                target?: string // Name of the target to use
              }

              const collectionConfig = req.payload.config.collections.find(c => c.slug === collectionSlug)
              const customConfig = collectionConfig?.custom?.googleSheets as GoogleSheetsCollectionConfig | undefined

              let tabName = customConfig?.tabName || pluginConfig.collections?.[collectionSlug]
              let mapping = customConfig?.mapping
              let keyField = customConfig?.keyField || 'id'

              if (target && customConfig?.targets) {
                const selectedTarget = customConfig.targets.find(t => t.name === target)
                if (selectedTarget) {
                  tabName = selectedTarget.tabName
                  mapping = selectedTarget.mapping
                  keyField = selectedTarget.keyField || 'id'
                }
              }

              if (!tabName) {
                return Response.json({ error: 'Collection not configured for sync' }, { status: 400 })
              }

              try {
                const service = new GoogleSheetsService(
                  pluginConfig.sheetId
                )

                let result
                const dryRun = mode === 'analyze'

                if (direction === 'export') {
                  result = await service.exportToSheet(req.payload, collectionSlug, tabName, mapping, keyField, dryRun, selection as string[])
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
          const customConfig = collection.custom?.googleSheets as GoogleSheetsCollectionConfig | undefined
          const enabled = customConfig?.enabled !== false && (
            !!customConfig?.tabName ||
            (!!customConfig?.targets && customConfig.targets.length > 0) ||
            !!pluginConfig.collections?.[collection.slug as CollectionSlug]
          )

          if (enabled) {
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
                    {
                      path: '@/plugins/google-sheets/components/LocalChangesButton',
                      exportName: 'LocalChangesButton',
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
