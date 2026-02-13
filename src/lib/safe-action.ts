import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { z } from "zod";
import { getPayloadSession } from "payload-authjs";
import { getPayload } from "payload";
import config from '@payload-config'

class ActionError extends Error {
}

// Base client.
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);

    if (e instanceof ActionError) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  // Define logging middleware.
}).use(async ({ next, clientInput, metadata, bindArgsClientInputs }) => {
  console.log("LOGGING MIDDLEWARE");

  const startTime = performance.now();

  // Here we await the action execution.
  const result = await next();

  const endTime = performance.now();
  const durationInMs = endTime - startTime;

  const logObject: Record<string, unknown> = { durationInMs };

  logObject.clientInput = clientInput;
  logObject.bindArgsClientInputs = bindArgsClientInputs;
  logObject.metadata = metadata;
  const {ctx:resultctx, ...resultwithoutctx} = result
  const {payload:_, ...ctxwithoutpayload} = { payload: "", ...resultctx };
  const resultwithoutpayload = {ctx:ctxwithoutpayload, ...resultwithoutctx};
  logObject.result = resultwithoutpayload;

  console.dir(logObject, { depth: null });

  // And then return the result of the awaited action.
  return result;
});

// Optional Auth client defined by extending the base one.
// defines session but doesn't check validity
export const optionalAuthActionClient = actionClient
  // Define authorization session but don't check.
  .use(async ({ next }) => {
    const session = await getPayloadSession()
    const payload = await getPayload({config})
    return next({ ctx: { session, payload } });
  })

// Auth client defined by extending the base one.
// Note that the same initialization options and middleware functions of the base client
// will also be used for this one.
export const authActionClient = optionalAuthActionClient
  // Define authorization middleware.
  .use(async ({ next, ctx: { session } }) => {

    if (!session) {
      throw new Error("Session not found!");
    }

    const user = session.user;

    if (!user) {
      throw new Error("Session is not valid!");
    }

    // Return the next middleware with `userId` value in the context
    return next({ ctx: { user } });
  });
