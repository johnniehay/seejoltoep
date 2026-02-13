import { CollectionSlug } from "payload";

export interface GoogleSheetsSyncTarget {
  name: string
  tabName: string
  mapping?: Record<string, string>
  keyField?: string
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
   * The ID of the Google Sheet to sync with
   */
  sheetId: string
  /**
   * Map Payload Collection Slugs to Google Sheet Tab Names
   * Example: { 'users': 'UsersTab', 'posts': 'Posts' }
   */
  collections: Record<CollectionSlug, string>
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
