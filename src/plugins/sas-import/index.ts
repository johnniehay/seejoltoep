import type { CollectionSlug, Config, Plugin } from 'payload'
import { SasImportSettingsGlobals } from './SasImportSettingsGlobals'
import { getSyncEndpoint } from './endpoints'
import type { SasImportCollectionConfig, SasImportPluginConfig } from './types'

export const sasImportPlugin =
  (pluginConfig: SasImportPluginConfig): Plugin =>
  (config: Config): Config => {
    if (pluginConfig.enabled === false) return config



    return {
      ...config,
      globals: [...(config.globals || []), SasImportSettingsGlobals],
      endpoints: [...(config.endpoints || []), getSyncEndpoint()],
      collections: (config.collections || []).map(collection => {
        const customConfig = collection.custom?.sasImport as SasImportCollectionConfig | undefined
        const enabled = customConfig?.enabled !== false && (
          (!!customConfig?.mapping && Object.keys(customConfig?.mapping).length > 0) ||
          !!pluginConfig.collections?.includes(collection.slug as CollectionSlug)
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
                    path: '@/plugins/sas-import/components/ImportButton',
                    exportName: 'ImportButton',
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
