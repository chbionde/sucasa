import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Lê a sessão atual no servidor (Server Components, layouts e Server Actions).
// Encapsula o boilerplate de passar os headers da request para o better-auth.
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
