import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Lê a sessão atual no servidor (Server Components, layouts e Server Actions).
// Encapsula o boilerplate de passar os headers da request para o better-auth.
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

// Exige usuário logado E com household. Usado por páginas e Server Actions
// para escopar tudo ao household do usuário (a fronteira de segurança do app).
// Retorna os ids já com tipo garantido (não-nulo) graças ao redirect.
export async function requireHousehold() {
  const session = await getSession();
  if (!session?.user.householdId) redirect("/login");
  return { userId: session.user.id, householdId: session.user.householdId };
}
