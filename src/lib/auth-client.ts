import { createAuthClient } from "better-auth/react";

// Client do better-auth para uso no browser (ex.: hook useSession na navbar).
// O login/cadastro em si passa por Server Actions (ver src/actions/auth.ts).
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
