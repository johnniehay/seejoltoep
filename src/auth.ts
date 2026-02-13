import payloadConfig from "@payload-config";
import { getAuthjsInstance } from "payload-authjs";
import { getPayload } from "payload";

const payload = await getPayload(
  { config: payloadConfig });
export const { handlers, signIn, signOut, auth } = getAuthjsInstance(payload);
