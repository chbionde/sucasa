import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

// Config do better-auth (lado servidor). Lê BETTER_AUTH_SECRET e BETTER_AUTH_URL
// do ambiente automaticamente.
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Não temos servidor de e-mail neste app: login liberado sem verificação.
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      // Coluna extra em User (não faz parte do núcleo do better-auth).
      // input:false => ninguém envia no signup; é definido no /setup.
      householdId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  // Deve ser o último plugin: permite que Server Actions gravem o cookie de sessão.
  plugins: [nextCookies()],
});
