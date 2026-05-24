import type { PayloadRequest, Where } from "payload";
import { getlidgroepeinfo } from "@/collections/Groepe/access";

export const wherelidgroepeinfo = async (payloadreq: PayloadRequest) => {
  const lidgroepeinfo = getlidgroepeinfo(payloadreq)
  if (lidgroepeinfo.length === 0) return false
  return { 'lid.groepe': { in: lidgroepeinfo.join(",") } } as Where
}
