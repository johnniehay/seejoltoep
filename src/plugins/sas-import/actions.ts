"use server"
import { revalidateTag } from "next/cache";

export async function invalidateSASCache() {
  revalidateTag('sas-import-func', { expire: 0 })
}
