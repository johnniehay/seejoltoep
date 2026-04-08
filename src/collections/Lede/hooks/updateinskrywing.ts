import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from "payload";
import type { Inskrywing, Lede } from "@/payload-types";
import pick  from "lodash/pick";

/**
 * Synchronizes changes from Lede fields to the linked Inskrywing document.
 * Refactored to a collection hook to prevent race conditions when multiple fields update at once.
 */
export function syncInskrywingHookGenerator(inheritedFieldNames: string[]): CollectionBeforeChangeHook<Lede> {
  return async ({ data, req, originalDoc, operation }) => {
    // Only run on update. Creation is handled by ledeAfterChangeGenerator.
    if (operation !== 'update' || !originalDoc) return data

    const inskrywingOrId = data.huidige_inskrywing || originalDoc.huidige_inskrywing
    const inskrywingId = inskrywingOrId && typeof inskrywingOrId === 'object' ? inskrywingOrId.id : inskrywingOrId

    if (!inskrywingId) return data

    const updateData: Record<string, any> = {}
    let hasChanges = false

    // Identify which inherited fields actually changed compared to the original document
    inheritedFieldNames.forEach((fieldName) => {
      if (
        Object.prototype.hasOwnProperty.call(data, fieldName) &&
        data[fieldName as keyof Lede] !== originalDoc[fieldName as keyof Lede]
      ) {
        updateData[fieldName] = data[fieldName as keyof Lede]
        hasChanges = true
      }
    })

    if (hasChanges) {
      try {
        await req.payload.update({
          collection: 'inskrywings',
          id: inskrywingId,
          data: updateData,
          req,
          // Propagate overrideAccess to ensure internal sync works even for non-privileged users/imports
          overrideAccess: req.context?.internalSync as boolean|undefined ?? false,
        })
      } catch (e: any) {
        req.payload.logger.error(`Failed to sync bulk fields to Inskrywing ${inskrywingId}: ${e.message}`)
      }
    }

    return data
  }
}

export function ledeAfterChangeGenerator(inheritedFieldNames: string[]): CollectionAfterChangeHook<Lede> {
  return async ({req, data, doc, previousDoc, operation})=> {
    // req.payload.logger.error(`ledeAfterChange operation:${JSON.stringify(operation)} data:${JSON.stringify(data)}`);
    // req.payload.logger.error(`ledeAfterChange operation:${JSON.stringify(operation)} doc:${JSON.stringify(doc)} `);
    if (doc.huidige_inskrywing != previousDoc.huidige_inskrywing) {
      // req.payload.logger.error(`ledeAfterChange huidige_inskrywing changed operation:${JSON.stringify(operation)} data:${data.huidige_inskrywing} doc:${doc.huidige_inskrywing} `);
      return doc
    }
    const inskrywingsData = pick(data, inheritedFieldNames) as Partial<Inskrywing>
    // const ledeData = omit(data, inheritedFieldNames)
    const inskrywingOrId = doc.huidige_inskrywing
    const inskrywingId = inskrywingOrId && typeof inskrywingOrId === "object" ? inskrywingOrId.id : inskrywingOrId
    if (!inskrywingId && Object.keys(inskrywingsData).length > 0) {
      const inskrywing = await req.payload.create({collection:"inskrywings",data:{...inskrywingsData, lid:doc.id},draft:false,req})
      return await req.payload.update({collection:"lede",id:doc.id,data:{huidige_inskrywing:inskrywing.id},req})
    }
    return data
  }
}
