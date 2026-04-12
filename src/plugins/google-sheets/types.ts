import { CollectionSlug } from "payload";

export interface GoogleSheetsSyncTarget {
  name: string
  tabName: string
  mapping?: Record<string, string>
  keyField?: string
}

export interface GoogleSheetsSettings {
  sheetId: string
  collections: {
    slug: string
    targets: {
      name: string
      tabName: string
      keyField: string
      mapping: Record<string, string>
    }[]
  }[]
}

export interface GoogleSheetsCollectionConfig {
  enabled?: boolean
  tabName?: string
  mapping?: Record<string, string> // Payload Field Name -> Sheet Header
  keyField?: string // Field to use as unique identifier (default: 'id')
  targets?: GoogleSheetsSyncTarget[]
}

export interface GoogleSheetsPluginConfig {
  /**
   * Enable or disable the plugin
   */
  enabled?: boolean
  /**
   * Map Payload Collection Slugs to Google Sheet Tab Names
   * Example: { 'users': 'UsersTab', 'posts': 'Posts' }
   */
  collections: CollectionSlug[]
}

export interface SyncChange {
  id?: string | number
  action: 'create' | 'update'
  changes: Record<string, { old: any; new: any }>
  row?: number
  data?: Record<string, any>
}

export interface SyncResult {
  success: boolean
  changes?: SyncChange[]
  stats?: {
    updated: number
    created: number
    total: number
  }
  error?: string
  defaultColumns?: string[]
}
