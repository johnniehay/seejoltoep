import type { NextAuthConfig } from "next-auth";
import type { CredentialsConfig } from "next-auth/providers";
import { AuthenticationError, AuthOperationsFromCollectionSlug, getPayload } from "payload";
import payloadConfig from "@payload-config";
import { getAuthjsInstance, PayloadAdapter } from "payload-authjs";
import { encode as defaultEncode } from "next-auth/jwt"

export const credentialsConfig: CredentialsConfig = {
  type: "credentials",
  id: "payload-local",
  name: "Payload Local Auth",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  authorize: async credentials => {
    const payload = await getPayload({ config: payloadConfig });
    payload.logger.warn(`attempting login of ${credentials.email}`)
    try {
      const { user, exp, token } = await payload.login({
        collection: "users",
        data: {
          email: credentials.email,
          password: credentials.password,
        } as AuthOperationsFromCollectionSlug<"users">["login"],
      });
      payload.logger.warn(`succesful login of ${user.email} exp ${exp} token ${token}`)
      return user;
    } catch (e) {
      if (e instanceof AuthenticationError){
        return null
      } else {
        throw e
      }
    }
  },
}
export const credentialsNextAuthConfig : Partial<NextAuthConfig> = {
  callbacks: {
    async jwt({ token, user, account })
    {
      (await getPayload({ config: payloadConfig })).logger.warn(`jwt callback ${token} ${user} ${account?.provider}`)
      if (account?.provider === "payload-local") {
        token.credentials = true
      }
      return token
    }
  ,
  }
,
  jwt: {
    encode: async function (params) {
      const payload = await getPayload({ config: payloadConfig })
      payload.logger.warn(`in jwt encode beforecheck ${JSON.stringify(params)}`)
      if (params.token?.credentials) {
        const sessionToken = crypto.randomUUID()
        payload.logger.warn("in jwt encode")
        const adapter = PayloadAdapter({ //TODO: get adapter instance instead of recreating
            payload,
            userCollectionSlug: "users",
          });
        if (!params.token.sub) {
          throw new Error("No user ID found in token")
        }

        const createdSession = await adapter?.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        })

        if (!createdSession) {
          throw new Error("Failed to create session")
        }

        return sessionToken
      }
      return defaultEncode(params)
    }
  ,
  }
,
}
