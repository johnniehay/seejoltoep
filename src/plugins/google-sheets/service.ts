import { GoogleAuth } from 'google-auth-library'
import { google } from 'googleapis'
import type { CollectionSlug, Payload, Field } from 'payload'
import type { SyncChange, SyncResult, GoogleSheetsCollectionConfig } from './types'

type SheetRow = Record<string, any>

export class GoogleSheetsService {
  private auth
  private sheetId: string

  constructor(sheetId: string) {
    this.sheetId = sheetId
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  }

  private async getSheetsClient() {
    return google.sheets({ version: 'v4', auth: this.auth })
  }

  /**
   * Get value from document using dot notation path
   */
  private getDocValue(doc: any, path: string): any {
    return path.split('.').reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined
    }, doc)
  }

  /**
   * Set value in document object using dot notation path
   */
  private setDocValue(doc: any, path: string, value: any) {
    const keys = path.split('.')
    let current = doc

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (i === keys.length - 1) {
        current[key] = value
      } else {
        current[key] = current[key] || {}
        current = current[key]
      }
    }
  }

  /**
   * Casts a sheet value to the specific type required by the Payload Field
   */
  private castValue(value: any, field: Field): any {
    if (value === '' || value === undefined || value === null) return null

    // Handle complex types that were stringified during export
    if (['array', 'blocks', 'group', 'richText', 'json', 'geometry'].includes(field.type)) {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        // If parsing fails, return original (might be intended raw data or error)
        return value
      }
    }

    switch (field.type) {
      case 'number':
        const num = Number(value)
        return isNaN(num) ? null : num
      case 'checkbox':
        if (typeof value === 'boolean') return value
        const str = String(value).toLowerCase()
        return str === 'true' || str === '1' || str === 'yes'
      case 'relationship':
      case 'upload':
        // If hasMany is true, it might be a JSON array string
        if ('hasMany' in field && field.hasMany === true && typeof value === 'string') {
           try { return JSON.parse(value) } catch { return [] }
        }
        return value
      case 'date':
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toISOString()
        }
        return value
      default:
        // text, textarea, email, date, select, radio, etc.
        return value
    }
  }

  /**
   * Helper to extract error message from Google API error
   */
  private getErrorMessage(error: any): string {
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message
    }
    return error instanceof Error ? error.message : String(error)
  }

  /**
   * Build a map of fields for easy lookup
   */
  private getFieldMap(fields: Field[]): Map<string, Field> {
    const fieldMap = new Map<string, Field>()
    const traverse = (fields: Field[]) => {
      fields.forEach(field => {
        if ('name' in field && !('virtual' in field && field.virtual && 'readonly' in field && field.readonly)) {
          fieldMap.set(field.name, field)
        } else if ('fields' in field) {
          traverse(field.fields)
        } else if (field.type === 'tabs') {
          field.tabs.forEach(tab => traverse(tab.fields))
        }
      })
    }
    traverse(fields)
    return fieldMap
  }

  /**
   * Syncs Payload Collection -> Google Sheet
   * ONLY updates cells that have changed.
   */
  async exportToSheet(payload: Payload, collectionSlug: CollectionSlug, tabName: string, mapping?: Record<string, string>, keyField: string = 'id', dryRun: boolean = true, onlySyncIds?: string[]): Promise<SyncResult> {
    const sheets = await this.getSheetsClient()
    const sheetKeyHeader = mapping?.[keyField] || keyField

    // 1. Fetch all data from Payload
    const { docs } = await payload.find({
      collection: collectionSlug,
      limit: 10000, // Adjust based on needs
      depth: 1, // Increased depth to allow accessing related fields (e.g. user.email)
    })

    const collectionConfig = payload.config.collections.find(c => c.slug === collectionSlug)
    const defaultColumns = collectionConfig?.admin?.defaultColumns || ['id']
    const fieldMap = collectionConfig ? this.getFieldMap(collectionConfig.fields) : new Map<string, Field>()

    // 2. Fetch current data from Sheets
    let sheetData: string[][] = []
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: tabName,
      })
      sheetData = response.data.values || []
    } catch (e) {
      const msg = this.getErrorMessage(e)
      payload.logger.error({ msg: `Google Sheets Export Error: ${msg}`, err: e })
      return { success: false, error: `Google Sheets Error: ${msg}` }
    }

    // 3. Analyze Headers
    if (sheetData.length === 0) {
      // Initialize headers if empty
      let headers: string[]
      if (mapping) {
        const mappedValues = Object.values(mapping).filter(h => h !== sheetKeyHeader)
        headers = [sheetKeyHeader, ...mappedValues]
      } else {
        headers = [sheetKeyHeader, ...Object.keys(docs[0] || {}).filter(k => k !== keyField)]
      }
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetId,
        range: `${tabName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      })
      sheetData = [headers]
    }

    const headers = sheetData[0]
    const keyIndex = headers.indexOf(sheetKeyHeader)

    if (keyIndex === -1) return { success: false, error: `Sheet must have an "${sheetKeyHeader}" column` }

    // 4. Diffing Logic
    const updates: { range: string; values: any[][] }[] = []
    const appendRows: any[][] = []
    const changesList: SyncChange[] = []

    // Map existing sheet rows by ID for fast lookup
    const sheetMap = new Map<string, { rowIndex: number; row: string[] }>()
    sheetData.slice(1).forEach((row, index) => {
      const keyVal = row[keyIndex]
      if (keyVal) sheetMap.set(keyVal, { rowIndex: index + 2, row }) // +2 because 1-based + header
    })

    for (const doc of docs) {
      const docKey = String(this.getDocValue(doc, keyField) ?? '')

      // Filter if specific IDs are requested
      if (onlySyncIds && !onlySyncIds.includes(docKey)) continue

      if (docKey && sheetMap.has(docKey)) {
        // Row exists - Check for cell changes
        const { rowIndex, row: existingRow } = sheetMap.get(docKey)!
        const rowChanges: Record<string, { old: any; new: any }> = {}

        headers.forEach((header, colIndex) => {
          let fieldName = header
          if (mapping) {
             // Find field name for this header
             const found = Object.keys(mapping).find(key => mapping[key] === header)
             if (found) fieldName = found
          }
          if (header === sheetKeyHeader) fieldName = keyField
          const field = fieldMap.get(fieldName)

          let rawValue = this.getDocValue(doc, fieldName)

          if (typeof rawValue === 'object' && rawValue !== null) {
            rawValue = JSON.stringify(rawValue)
          }

          const newValue = (rawValue !== undefined && rawValue !== null) ? String(rawValue) : ''
          const oldValue = existingRow[colIndex] || ''

          let isDiff = newValue !== oldValue
          if (isDiff && field?.type === 'date') {
             const d1 = new Date(newValue).getTime()
             const d2 = new Date(oldValue).getTime()
             if (!isNaN(d1) && !isNaN(d2) && d1 === d2) isDiff = false
          }

          if (isDiff) {
            // Calculate A1 notation for the specific cell
            const colLetter = this.getColumnLetter(colIndex)
            updates.push({
              range: `${tabName}!${colLetter}${rowIndex}`,
              values: [[newValue]],
            })
            rowChanges[header] = { old: oldValue, new: newValue }
          }
        })

        if (Object.keys(rowChanges).length > 0) {
          changesList.push({
            id: docKey,
            action: 'update',
            changes: rowChanges,
            row: rowIndex,
            data: doc
          })
        }
      } else {
        // Update syncedData on export so the next import knows this state is "known"
        if (!dryRun) {
          // We can't easily update the doc here without a separate update call or hook,
          // but for efficiency in export, we might skip this or do a bulk update later.
          // However, strictly speaking, if we export, the Sheet matches Payload,
          // so the next Import check (Sheet vs Synced) will show a diff if we don't update Synced.
          // But (Sheet vs Payload) will be identical, so no change will happen regardless.
          // So we can skip updating syncedData on export for now to save API calls.
        }

        // New Row - Prepare for append
        const newRow = headers.map(header => {
          let fieldName = header
          if (mapping) {
             const found = Object.keys(mapping).find(key => mapping[key] === header)
             if (found) fieldName = found
          }
          if (header === sheetKeyHeader) fieldName = keyField

          let rawValue = this.getDocValue(doc, fieldName)
          if (typeof rawValue === 'object' && rawValue !== null) {
            rawValue = JSON.stringify(rawValue)
          }

          return rawValue ?? ''
        })
        appendRows.push(newRow)
        changesList.push({
          id: docKey,
          action: 'create',
          changes: { row: { old: null, new: newRow } },
          data: doc
        })
      }
    }

    if (dryRun) {
      return { success: true, changes: changesList, stats: { updated: updates.length, created: appendRows.length, total: docs.length }, defaultColumns }
    }

    // 5. Execute Updates (Batch)
    const promises = []

    if (updates.length > 0) {
      // Google Sheets API limits batch updates, but handles reasonably large batches
      promises.push(
        sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.sheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updates,
          },
        })
      )
    }

    if (appendRows.length > 0) {
      promises.push(
        sheets.spreadsheets.values.append({
          spreadsheetId: this.sheetId,
          range: tabName,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: appendRows },
        })
      )
    }

    await Promise.all(promises)

    return {
      success: true,
      changes: changesList,
      stats: {
        updated: updates.length,
        created: appendRows.length,
        total: docs.length,
      },
      defaultColumns
    }
  }

  /**
   * Helper to convert 0-index to A, B, C... AA, AB column letters
   */
  private getColumnLetter(colIndex: number): string {
    let temp, letter = ''
    while (colIndex >= 0) {
      temp = (colIndex) % 26
      letter = String.fromCharCode(temp + 65) + letter
      colIndex = Math.floor((colIndex) / 26) - 1
    }
    return letter
  }

  /**
   * Import from Sheet -> Payload
   * Checks for changes and only updates modified fields.
   */
  async importFromSheet(payload: Payload, collectionSlug: CollectionSlug, tabName: string, mapping?: Record<string, string>, keyField: string = 'id', dryRun: boolean = true, onlySyncRows?: number[]): Promise<SyncResult> {
    const sheets = await this.getSheetsClient()
    const sheetKeyHeader = mapping?.[keyField] || keyField

    // 1. Fetch Sheet Data
    let sheetData: string[][] = []
    payload.logger.warn({msg:"preSheetdata",obj:sheets.spreadsheets})
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: tabName,
      })
      payload.logger.warn("response")
      sheetData = response.data.values || []
      payload.logger.warn("Sheetdata")
      payload.logger.error({msg:"sheetdata", obj:sheetData})
    } catch (e: any) {
      const msg = this.getErrorMessage(e)
      payload.logger.error({ msg: `Google Sheets Import Error: ${msg}`, err: e })
      return { success: false, error: `Google Sheets Error: ${msg}` }
    }

    if (sheetData.length < 2) return { success: true, changes: [], stats: { updated: 0, created: 0, total: 0 } }

    const headers = sheetData[0]
    const keyIndex = headers.indexOf(sheetKeyHeader)
    if (keyIndex === -1) return { success: false, error: `Sheet missing "${sheetKeyHeader}" column` }

    // 2. Fetch Payload Data
    const { docs } = await payload.find({
      collection: collectionSlug,
      limit: 10000,
      depth: 1,
    })

    // 2.1 Get Collection Config to map fields
    const collectionConfig = payload.config.collections.find(c => c.slug === collectionSlug)
    if (!collectionConfig) return { success: false, error: 'Collection config not found' }
    const defaultColumns = collectionConfig.admin?.defaultColumns || ['id']

    // Build a map of top-level fields matching the document structure
    const fieldMap = this.getFieldMap(collectionConfig.fields)

    const payloadMap = new Map(docs.map(d => [String(this.getDocValue(d, keyField)), d]))
    const changesList: SyncChange[] = []
    let updateCount = 0
    let createCount = 0

    // 3. Iterate Sheet Rows
    for (let i = 1; i < sheetData.length; i++) {
      // Filter if specific rows are requested (1-based index matching the 'row' property in SyncChange)
      if (onlySyncRows && !onlySyncRows.includes(i + 1)) continue

      const row = sheetData[i]
      const keyVal = row[keyIndex]
      const rowData: Record<string, any> = {}

      headers.forEach((h, idx) => {
        let fieldName = h
        if (mapping) {
           const found = Object.keys(mapping).find(key => mapping[key] === h)
           if (found) fieldName = found
        }

        // if (fieldName !== 'id') {
          const field = fieldMap.get(fieldName)
          // Only process fields that actually exist in the config
          if (field) {
            this.setDocValue(rowData, fieldName, this.castValue(row[idx], field))
          }
        // }
      })

      if (keyVal && payloadMap.has(keyVal)) {
        // Update existing
        const existingDoc = payloadMap.get(keyVal)! as Record<string, any>
        const lastSynced = (existingDoc?.syncedData as Record<string, any>)?.googleSheets || {}

        const changes: Record<string, { old: any; new: any }> = {}
        const updateData: Record<string, any> = {}
        let hasChanges = false

        Object.keys(rowData).forEach(key => {
          const newVal = this.getDocValue(rowData, key)
          const oldSyncedVal = this.getDocValue(lastSynced, key)
          const currentVal = this.getDocValue(existingDoc, key)

          // 3-Way Merge Logic:
          // Only update if the Sheet value is different from the LAST SYNCED value.
          // If Sheet == LastSynced, then Upstream hasn't changed, so we preserve Local (currentVal).

          const upstreamChanged = JSON.stringify(newVal) !== JSON.stringify(oldSyncedVal)

          if (upstreamChanged) {
            // Upstream has changed. We must update Payload.
            // (Optionally: We could check for conflicts here if currentVal != oldSyncedVal)

            if (JSON.stringify(newVal) !== JSON.stringify(currentVal)) {
               if (!newVal && !currentVal) return
               changes[key] = { old: currentVal, new: newVal }
               this.setDocValue(updateData, key, newVal)
               hasChanges = true
            }
          }
        })

        // Always update the syncedData baseline to match the current Sheet state
        // This ensures future imports compare against THIS version
        updateData['syncedData'] = { ...(existingDoc.syncedData as Record<string, any> || {}), googleSheets: rowData }

        if (hasChanges) {
          changesList.push({ id: existingDoc.id, action: 'update', changes, row: i + 1, data: existingDoc })
          if (!dryRun) {
            await payload.update({
              collection: collectionSlug,
              id: existingDoc.id,
              data: updateData,
            })
          }
          updateCount++
        } else if (!hasChanges && JSON.stringify(lastSynced) !== JSON.stringify(rowData)) {
          // Even if no visible fields changed (e.g. local matched upstream),
          // we must update syncedData if it's stale, so we don't re-evaluate this next time.
          await payload.update({
            collection: collectionSlug,
            id: existingDoc.id,
            data: { syncedData: { ...(existingDoc.syncedData as Record<string, any> || {}), googleSheets: rowData } },
          })
        }
      } else {
        // Check if we should create
        // If keyField is 'id', we only create if keyVal is empty (new record)
        // If keyField is custom, we create if keyVal is present (new unique record)
        if ((keyField === 'id' && !keyVal) || (keyField !== 'id' && keyVal)) {
          // Add syncedData to new record
          const snapshot = { googleSheets: { ...rowData } }
          rowData['syncedData'] = snapshot
          changesList.push({ action: 'create', changes: { row: { old: null, new: rowData } }, row: i + 1, data: rowData })
          if (!dryRun) {
            await payload.create({
              collection: collectionSlug,
              data: rowData,
            })
          }
          createCount++
        }
      }
    }

    return {
      success: true,
      changes: changesList,
      stats: { updated: updateCount, created: createCount, total: sheetData.length - 1 },
      defaultColumns
    }
  }

  /**
   * Analyzes local changes (Difference between Current Payload Data and Last Synced Data)
   */
  async analyzeLocalChanges(payload: Payload, collectionSlug: CollectionSlug): Promise<SyncResult> {
    const collectionConfig = payload.config.collections.find(c => c.slug === collectionSlug)
    const customConfig = collectionConfig?.custom?.googleSheets as GoogleSheetsCollectionConfig | undefined

    // Gather all fields to check from all targets to ensure we catch any relevant change
    const fieldsToCheck = new Set<string>()

    const targets = customConfig?.targets || []
    if (customConfig?.mapping) {
       // Legacy/Default target
       Object.keys(customConfig.mapping).forEach(k => fieldsToCheck.add(k))
    }
    targets.forEach(t => {
       if (t.mapping) Object.keys(t.mapping).forEach(k => fieldsToCheck.add(k))
    })

    if (fieldsToCheck.size === 0) {
       return { success: true, changes: [], stats: { updated: 0, created: 0, total: 0 } }
    }

    const { docs } = await payload.find({
      collection: collectionSlug,
      limit: 10000,
      depth: 1,
      showHiddenFields: true, // Ensure we can read syncedData
    })

    const changesList: SyncChange[] = []
    let updated = 0
    let created = 0

    for (const doc of docs) {
       const docRecord = doc as Record<string, any>
       const syncedData = (docRecord['syncedData'] as Record<string, any>)?.googleSheets || null
       const docChanges: Record<string, { old: any, new: any }> = {}

       // If no syncedData, it's a new local record (or never synced)
       const isNew = !syncedData

       fieldsToCheck.forEach(path => {
          const currentVal = this.getDocValue(doc, path)
          const syncedVal = isNew ? undefined : this.getDocValue(syncedData, path)

          // Normalize for comparison
          const currentJson = JSON.stringify(currentVal)
          const syncedJson = JSON.stringify(syncedVal)

          if (currentJson !== syncedJson) {
             // Ignore if both are effectively empty
             if ((!currentVal && !syncedVal)) return

             docChanges[path] = { old: syncedVal, new: currentVal }
          }
       })

       if (Object.keys(docChanges).length > 0) {
          changesList.push({
             id: doc.id,
             action: isNew ? 'create' : 'update',
             changes: docChanges,
             data: doc
          })
          if (isNew) created++
          else updated++
       }
    }

    return {
       success: true,
       changes: changesList,
       stats: { updated, created, total: docs.length },
       defaultColumns: collectionConfig?.admin?.defaultColumns || ['id']
    }
  }
}
