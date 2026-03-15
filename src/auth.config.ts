import type { NextAuthConfig } from "next-auth";
import Nodemailer from 'next-auth/providers/nodemailer';
import Credentials from 'next-auth/providers/credentials';
import Passkey from "next-auth/providers/passkey";
import { credentialsConfig, credentialsNextAuthConfig } from "@/auth.credentials.config";
import { PayloadAuthjsUser } from "@/lib/payload-authjs-custom/authjs/types";
import { User as PayloadUser } from "@/payload-types"
import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface User extends PayloadAuthjsUser<PayloadUser> {}
}

export const authConfig: NextAuthConfig = {
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    Google({}),
    Credentials(credentialsConfig),
    Passkey({}),
  ],
  session: {
    strategy: "database"
  },
  experimental: { enableWebAuthn: true },
  ...credentialsNextAuthConfig,
  pages:{
    signIn: "/signin",
  },
  debug: true,
};
