import type { CollectionSlug } from 'payload'

export interface SasImportPluginConfig {
  /**
   * Enable or disable the plugin
   * @default true
   */
  enabled?: boolean
  /**
   * Collections to enable SAS Import for
   */
  collections?: CollectionSlug[]
}

export interface SasImportCollectionConfig {
  enabled?: boolean
  keyField?: string
  mapping?: Record<string, string> // Payload Field Name -> SAS Field Key
  displayColumns: string[]
}

export interface SyncChange {
  id?: string | number
  action: 'create' | 'update'
  changes: Record<string, { old: any; new: any }>
  row?: number // Index from the source data array
  data?: Record<string, any>
}

export interface SyncResult {
  success: boolean
  changes?: SyncChange[]
  stats?: { updated: number; created: number; total: number }
  error?: string
  defaultColumns?: string[]
}
