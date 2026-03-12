import type { CollectionAfterChangeHook, Field, FieldHook } from "payload";
import type { Inskrywing, Lede } from "@/payload-types";
import pick  from "lodash/pick";
import omit  from "lodash/omit";

// const createInskrywingAndAddAsHuidige = async (req: PayloadRequest, lidid: string) => {
//   const huidigeInskrywing = (await req.payload.findByID({collection:"lede",id:lidid,depth:1,req})).huidige_inskrywing
//   if (huidigeInskrywing) {
//     const huidigeInskrywingId = typeof huidigeInskrywing === "object"? huidigeInskrywing.id : huidigeInskrywing
//     req.payload.logger.warn(`createInskrywingAndAddAsHuidige called multiple times for lid ${lidid} returing existing ${huidigeInskrywingId}`);
//     return huidigeInskrywingId
//   }
//   const inskrywing = await req.payload.create({collection:"inskrywings",data:{lid:lidid}})
//   await req.payload.update({collection:"lede",id:lidid,data:{huidige_inskrywing:inskrywing.id}})
//   return inskrywing.id
// }

//TODO: optimize inskrywing update from Lede
export function updateHuidigeInskrywingFieldGenerator(field: Field): FieldHook<Lede, any, Lede> {
  return async ({ value, req, siblingData, originalDoc, operation }) => {
    if (!("name" in field)) throw `Attempting to update unnamed field ${JSON.stringify(field)}`
    // if (field.name in siblingData && value === siblingData[field.name as keyof typeof siblingData]) return value
    if (originalDoc && field.name in originalDoc && value === originalDoc[field.name as keyof typeof originalDoc]) return value

    // const value = field.name in siblingData && siblingData[field.name as keyof typeof siblingData] || inputvalue
    // if (previousDoc && field.name in previousDoc && value === previousDoc[field.name as keyof typeof previousDoc]) return value
    // req.payload.logger.error(`updateInskr ${field.name} value:${value} siblingData:${JSON.stringify(siblingData)} operation:${JSON.stringify(operation)}`);
    if (operation !== 'create' && operation !== 'update') return value;
    const inskrywingOrId = siblingData?.huidige_inskrywing || originalDoc?.huidige_inskrywing //|| await createInskrywingAndAddAsHuidige(req, originalDoc!.id);
    const inskrywingId = inskrywingOrId && typeof inskrywingOrId === "object" ? inskrywingOrId.id : inskrywingOrId
    if (inskrywingId && value !== undefined) {
      try {
        const originalInskrywing = await req.payload.findByID({
          collection: 'inskrywings',
          id: inskrywingId,
          depth: 0,
          req
        });
        if (originalInskrywing && originalInskrywing[field.name as keyof typeof originalInskrywing] !== value) {
          await req.payload.update({
            collection: 'inskrywings',
            id: inskrywingId,
            data: { [field.name]: value },
            req,
            overrideAccess: false
          });
        }
      } catch (e: any) {
        req.payload.logger.error(`Error updating inskrywing from Lede virtual field ${field.name}: ${e.message}`);
      }
    }
    return value;
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
