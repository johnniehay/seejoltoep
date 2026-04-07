import type { Field, CollectionConfig, CollectionSlug, PayloadRequest } from 'payload'
import type { SyncChange, SyncResult, SasImportCollectionConfig } from './types'
import { unstable_cache } from "next/cache";

const INSKRYWING_SHORTCODE = 'T96'
const ADD_OPTIONS_SHORTCODE = 'T90'
const CAMP_SHORTCODE = 'Ta0'
const FIELD_EXCEPTION_LIST = [
  'ufCrm39_1666185425607',
  'contactIds',
  'createdBy',
  'updatedBy',
  'opened',
  'webformId',
  'companyId',
  'contacts',
  'observers',
  'categoryId',
  'movedTime',
  'movedBy',
  'isManualOpportunity',
  'taxValue',
  'mycompanyId',
  'xmlId',
]

/**
 * A TypeScript port of the BatchRequest class from camp_export.html
 */
class BatchRequest {
  private batch: Record<string, string> | string[] = []
  private batchCount = 0
  private batchType: 'array' | 'object' = 'array'
  private webhookUrl: string

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl
  }

  private setBatchCount() {
    if (this.batchType === 'array') {
      this.batchCount = (this.batch as string[]).length
    } else if (this.batchType === 'object') {
      this.batchCount = Object.keys(this.batch).length
    }
  }

  addReqToBatch(reqString: string, key: string | null = null) {
    if (key != null && this.batchType === 'array' && this.batchCount === 0) {
      this.setBatchTypeObj()
    } else if (key != null && this.batchType === 'array' && this.batchCount > 0) {
      console.error(
        'Cannot mix key values into batch of type array. Clear batch or send batch before adding key value pairs',
      )
      return
    }

    if (this.batchType === 'array') {
      ;(this.batch as string[]).push(reqString)
    } else if (this.batchType === 'object' && key != null) {
      ;(this.batch as Record<string, string>)[key] = reqString
    }
    this.setBatchCount()
  }

  async sendBatchTo() {
    const reqJson = {
      halt: 0,
      cmd: this.batch,
    }
    const result = await this.Post('batch', reqJson)
    this.clearBatch()
    return result
  }

  clearBatch() {
    this.batch = []
    this.batchType = 'array'
    this.setBatchCount()
  }

  setBatchTypeObj() {
    this.batch = {}
    this.batchType = 'object'
  }

  private delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time))
  }

  async Post(method: string, reqJson: any, key: string | null = null, type = 'post') {
    const response = await fetch(this.webhookUrl + method, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqJson),
    })

    const result = await response.json()
    if (result.error) {
      console.error('Batch API Error:', result)
      throw new Error(result.error_description || 'An error occurred with the Batch API.')
    }

    await this.delay(500) // Respect API rate limits

    if (type === 'post') {
      return key == null ? result.result : result.result[key]
    }
    return result
  }

  async PostList(method: string, reqJson: any, key: string | null = null) {
    reqJson.start = 0
    let result: any = { next: 0 }
    let list: any[] = []

    while (result.hasOwnProperty('next')) {
      result = await this.Post(method, reqJson, key, 'list')
      const resultData = key == null ? result.result : result.result[key]
      if (Array.isArray(resultData)) {
        list = [...list, ...resultData]
      }
      if (result.hasOwnProperty('next')) {
        reqJson.start = result.next
      }
    }
    return list
  }
}

async function fetchAddOptionsCamp(batchreq: BatchRequest, kampId: string) {
  const reqJson = {
    entityTypeId: 144,
    select: ['id', 'title', 'ufCrm45_1665999802'],
    filter: {
      parentId160: kampId,
    },
  }
  return await batchreq.PostList('crm.item.list', reqJson, 'items')
}

async function fetchCoursesCamp(batchreq: BatchRequest, kampId: string) {
  const reqJson = {
    entityTypeId: 171,
    select: ['id', 'title'],
    filter: {
      parentId160: kampId,
    },
  }
  return await batchreq.PostList('crm.item.list', reqJson, 'items')
}

async function fetchInskrywings(batchreq: BatchRequest, kampId: string) {
  const reqJson = {
    entityTypeId: 150,
    select: ['*'],
    filter: {
      parentId160: kampId,
      '!=stageId': 'DT150_39:FAIL',
    },
  }
  return await batchreq.PostList('crm.item.list', reqJson, 'items')
}

async function fetchInskProductRows(batchreq: BatchRequest, inskArr: any[]) {
  let start = 0
  let step = inskArr.length < 50 ? inskArr.length : 50
  let inskProductRowObj: Record<string, any> = {}

  while (start < inskArr.length) {
    console.log(`Fetching products for inskrywings ${start} to ${start + step}`)
    for (let i = start; i < start + step; i++) {
      const insk = inskArr[i]
      if (!insk) continue
      const reqString = `crm.item.productrow.list?filter[${encodeURIComponent(
        '=ownerType',
      )}]=${INSKRYWING_SHORTCODE}&filter[${encodeURIComponent('=ownerId')}]=${insk.id}`

      batchreq.addReqToBatch(reqString, String(insk.id))
    }

    const result = await batchreq.sendBatchTo()

    // result.result contains the map of { [id]: { productRows: [...] } } or similar depending on batch response
    // The batch response 'result' key contains the data for each command key.
    if (result && result.result) {
      inskProductRowObj = { ...inskProductRowObj, ...result.result }
    }

    start = start + step
    if (inskArr.length - start < 50) {
      step = inskArr.length - start
    }
  }

  return inskProductRowObj
}

async function getSasData(kampId: string, kampNaam: string, webhookUrl: string): Promise<Record<string, any>[]> {
  const batchreq = new BatchRequest(webhookUrl)

  console.log(`Starting SAS Data Fetch for Camp ID: ${kampId}`)

  // 1. Batch Request for Fields and Statuses
  const addOptionsFieldsReq = `crm.item.fields?entityTypeId=144`
  batchreq.addReqToBatch(addOptionsFieldsReq, 'addOptFields')

  const coursesFieldsReq = `crm.item.fields?entityTypeId=171`
  batchreq.addReqToBatch(coursesFieldsReq, 'courseFields')

  const inskrywingFieldsReq = `crm.item.fields?entityTypeId=150`
  batchreq.addReqToBatch(inskrywingFieldsReq, 'inskFields')

  const statusListReq = `crm.status.list?filter[${encodeURIComponent(
    'ENTITY_ID',
  )}]=${encodeURIComponent('DYNAMIC_150_STAGE_39')}`
  batchreq.addReqToBatch(statusListReq, 'statusList')

  const allFields = await batchreq.sendBatchTo()

  // 2. Fetch Add Options
  const addOptions = await fetchAddOptionsCamp(batchreq, kampId)

  // 3. Fetch Products for Add Options (if applicable)
  for (let i = 0; i < addOptions.length; i++) {
    const addOption = addOptions[i]
    const addOptId = addOption.id

    if (addOption.ufCrm45_1665999802 == 1257) {
      const reqString = `crm.item.productrow.list?filter[${encodeURIComponent(
        '=ownerType',
      )}]=${ADD_OPTIONS_SHORTCODE}&filter[${encodeURIComponent('=ownerId')}]=${addOptId}`

      batchreq.addReqToBatch(reqString, addOption.title)
    }
  }

  const campAddOptionProductLists = await batchreq.sendBatchTo()

  // 4. Fetch Courses
  const campCourses = await fetchCoursesCamp(batchreq, kampId)

  // 5. Fetch Inskrywings
  const campInskrywings = await fetchInskrywings(batchreq, kampId)

  // 6. Fetch Products for Inskrywings
  const campInskrywingsProductObj = await fetchInskProductRows(batchreq, campInskrywings)

  // 7. Construct Data Array (Flattening)
  const dataArr: Record<string, any>[] = []

  for (let j = 0; j < campInskrywings.length; j++) {
    const inskrywing = campInskrywings[j]
    const inskrywingRow: Record<string, any> = {}

    // Map standard fields
    const inskFields = allFields.result.inskFields.fields
    Object.keys(inskFields).forEach(fieldRef => {
      if (FIELD_EXCEPTION_LIST.includes(fieldRef)) {
        return
      }

      const fieldConfig = inskFields[fieldRef]
      const fieldType = fieldConfig.type
      let fieldValue: any = ''

      if (fieldType == 'crm_status') {
        const statusObj = (allFields.result.statusList as any[]).find(
          status => status.STATUS_ID == inskrywing[fieldRef],
        )
        fieldValue = statusObj ? statusObj.NAME : inskrywing[fieldRef]
      } else if (fieldType == 'enumeration' && inskrywing[fieldRef] != null) {
        const fieldListItem = (fieldConfig.items as any[]).find(
          item => item.ID == inskrywing[fieldRef],
        )
        fieldValue = fieldListItem ? fieldListItem.VALUE : inskrywing[fieldRef]
      } else if (fieldType == 'boolean') {
        switch (inskrywing[fieldRef]) {
          case 0:
          case false:
            fieldValue = 'Nee'
            break
          case 1:
          case true:
            fieldValue = 'Ja'
            break
          default:
            break
        }
      } else {
        fieldValue = inskrywing[fieldRef] != null ? inskrywing[fieldRef] : ''
      }

      const fieldTitle = fieldConfig.title

      // Handle Special Parent ID Logic
      if (
        fieldRef == 'parentId171' &&
        fieldValue != '' &&
        fieldValue != null &&
        fieldValue != 0
      ) {
        const filterCourses = campCourses.filter((course: any) => course.id == fieldValue)
        if (filterCourses.length > 0) {
          fieldValue = filterCourses[0].title
        } else {
          fieldValue = 'Kursus nie gevind nie!'
        }
      }
      if (
        fieldRef == 'parentId160' &&
        fieldValue != '' &&
        fieldValue != null &&
        fieldValue != 0
      ) {
        fieldValue = kampNaam
      }

      inskrywingRow[fieldTitle] = fieldValue
    })

    // Handle Products and Additional Options
    addOptions.forEach((option: any) => {
      const fieldTitle = option.title
      let fieldValue: any = ''
      let selectedProduct: any = ''
      const productFull: string[] = []

      const inskProducts = campInskrywingsProductObj[inskrywing.id]
        ? campInskrywingsProductObj[inskrywing.id].productRows
        : []

      if (inskProducts) {
        for (let k = 0; k < inskProducts.length; k++) {
          const inskrywingProduct = inskProducts[k]
          productFull.push(inskrywingProduct.productName)
          if (inskrywingProduct.productName.includes(option.title)) {
            selectedProduct = inskrywingProduct
          }
        }
      }

      productFull.sort()
      inskrywingRow['Products'] = productFull.join(',')

      if (option.ufCrm45_1665999802 == 1257 && selectedProduct != '') {
        // Option is a list selection
        if (
          campAddOptionProductLists.result &&
          campAddOptionProductLists.result[option.title] &&
          campAddOptionProductLists.result[option.title].productRows
        ) {
          const optionProducts = campAddOptionProductLists.result[option.title].productRows
          for (let m = 0; m < optionProducts.length; m++) {
            const optionProduct = optionProducts[m]
            if (selectedProduct.productName.includes(`- ${optionProduct.productName}`)) {
              fieldValue = optionProduct.productName
            }
          }
        }
      } else if (option.ufCrm45_1665999802 == 1261 && selectedProduct != '') {
        // Option is a price/value
        fieldValue = selectedProduct.price
      }

      inskrywingRow[fieldTitle] = fieldValue
    })

    // Ensure ID is present for mapping
    inskrywingRow['ID'] = inskrywing.id

    dataArr.push(inskrywingRow)
  }

  return dataArr
}

export class SasImportService {
  private webhookUrl: string
  private settings: any
  private fieldMap: Map<string, Field>
  private mapping: Record<string, string>
  private keyField: string
  private displayColumns: string[]

  constructor(
    webhookUrl: string,
    settings: any,
    collectionConfig: CollectionConfig,
  ) {
    this.webhookUrl = webhookUrl
    this.settings = settings
    this.fieldMap = this.getFieldMap(collectionConfig.fields)

    const customConfig = collectionConfig.custom?.sasImport as SasImportCollectionConfig | undefined
    this.mapping = customConfig?.mapping || {}
    this.keyField = (customConfig?.keyField || 'import_id')
    this.displayColumns = customConfig?.displayColumns || collectionConfig?.admin?.defaultColumns || ['id']
  }

  private getFieldMap(fields: Field[]): Map<string, Field> {
    const map = new Map<string, Field>()
    const traverse = (currentFields: Field[]) => {
      currentFields.forEach(field => {
        if ('name' in field) map.set(field.name, field)
        if ('fields' in field) traverse(field.fields)
        if (field.type === 'tabs') field.tabs.forEach(tab => traverse(tab.fields))
      })
    }
    traverse(fields)
    return map
  }

  private castValue(value: any, field: Field): any {
    if (value === '' || value === undefined || value === null) return null
    switch (field.type) {
      case 'textarea':
      case 'text':
        // Ensure the final value is a string.
        return String(value)
      case 'number':
        const num = Number(value)
        // Return null if the value is not a valid number to avoid storing NaN
        return isNaN(num) ? null : num
      case 'date':
        //  might send date as string.
        const date = new Date(value)
        // Return null for invalid dates
        return !isNaN(date.getTime()) ? date.toISOString() : null
      default:
        return value
    }
  }

  private transformSasObject(sasObject: Record<string, any>): Record<string, any> {
    const payloadObject: Record<string, any> = {}

    // Iterate over the configured mapping
    for (const [payloadKey, sasKey] of Object.entries(this.mapping)) {
      if (sasObject.hasOwnProperty(sasKey)) {
        const fieldConfig = this.fieldMap.get(payloadKey)
        if (fieldConfig) {
          payloadObject[payloadKey] = this.castValue(sasObject[sasKey], fieldConfig)
        } else {
          console.log(`fieldMap missing key ${payloadKey} ${JSON.stringify(this.fieldMap)}`)
          payloadObject[payloadKey] = sasObject[sasKey]
        }
      } else {
        console.log(`sasObject missing key ${sasKey} ${JSON.stringify(sasObject)}`)
      }
    }
    return payloadObject
  }

  public async importFromSas(
    req: PayloadRequest,
    collectionSlug: CollectionSlug,
    dryRun: boolean,
    selection: number[],
  ): Promise<SyncResult> {
    const payload = req.payload
    const kampId = this.settings.kampId
    const kampNaam = this.settings.kampNaam

    if (!kampId || !kampNaam) {
      throw new Error('Kamp ID and Kamp Naam must be configured in SAS Import Settings global.')
    }

    const sasData = await unstable_cache(getSasData, [], { revalidate: 300, tags: ['sas-import-func'] })(kampId, kampNaam, this.webhookUrl)

    const transformedSasData = sasData.map((obj, index) => ({
      ...this.transformSasObject(obj),
      originalIndex: index,
    }) as { originalIndex: number, geboortedatum: any, [key: string]: any })

    // Filter out items that didn't map to a key field
    const validData = transformedSasData.filter(d => d[this.keyField])
    const importIds = validData.map(d => d[this.keyField])

    const { docs: payloadDocs } = await payload.find({
      collection: collectionSlug,
      where: { [this.keyField]: { in: importIds } },
      limit: importIds.length || 1,
      depth: 0,
      req,
      pagination: false,
    })
    console.log( `payloadDocs ${JSON.stringify(payloadDocs)}`)
    const payloadMap = new Map(payloadDocs.map(d => [d[this.keyField as keyof typeof d], d])) //TODO fix typing
    const changesList: SyncChange[] = []
    let updateCount = 0
    let createCount = 0

    for (const sasRecord of validData) {
      const keyVal = sasRecord[this.keyField]

      if (dryRun === false && selection && !selection.includes(sasRecord.originalIndex)) continue

      if (payloadMap.has(keyVal)) {
        // UPDATE
        const existingDoc = payloadMap.get(keyVal)!
        const existingDocData = existingDoc as Record<string, any>
        const lastSynced = existingDocData.syncedData?.sasImport || {}

        const changes: Record<string, { old: any; new: any }> = {}
        const updateData: Record<string, any> = {}
        let hasChanges = false

        Object.keys(sasRecord).forEach(key => {
          if (key === 'originalIndex') return

          const newVal = sasRecord[key]
          const oldVal = existingDocData[key]
          const oldSyncedVal = lastSynced[key]

          // 3-way merge logic: Only update if SAS changed since last sync
          if (JSON.stringify(newVal) !== JSON.stringify(oldSyncedVal)) {
            if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
              changes[key] = { old: oldVal, new: newVal }
              updateData[key] = newVal
              hasChanges = true
            }
          }
        })

        if (hasChanges) {
          changesList.push({
            id: existingDoc.id,
            action: 'update',
            changes,
            row: sasRecord.originalIndex,
            data: { ...existingDocData, ...updateData },
          })

          if (!dryRun) {
            updateData.syncedData = { ...(existingDocData.syncedData || {}), sasImport: sasRecord }
            await payload.update({ collection: collectionSlug, id: existingDoc.id, data: updateData, req })
          }
          updateCount++
        }
      } else {
        // CREATE
        changesList.push({
          action: 'create',
          changes: { _new: { old: null, new: sasRecord } },
          row: sasRecord.originalIndex,
          data: sasRecord,
        })

        if (!dryRun) {
          const createData = { ...sasRecord, syncedData: { sasImport: sasRecord } }
          await payload.create({ collection: collectionSlug, data: createData, req })
        }
        createCount++
      }
    }

    const collectionConfig = payload.config.collections.find(c => c.slug === collectionSlug)

    return {
      success: true,
      changes: changesList,
      stats: { updated: updateCount, created: createCount, total: sasData.length },
      defaultColumns: this.displayColumns,
    }
  }
}
