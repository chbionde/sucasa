import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

// Layout do grupo (app): guarda de autenticação de TODAS as rotas internas.
// Roda no servidor a cada navegação; se não há sessão vai para /login, e se
// há sessão mas ainda não há household, vai para /setup.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.householdId) redirect("/setup");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="font-semibold">
              sucasa
            </Link>
            <Link
              href="/produtos"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Produtos
            </Link>
            <Link
              href="/listas"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Listas
            </Link>
            <Link
              href="/historico"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Histórico
            </Link>
            <Link
              href="/config"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Configurações
            </Link>
            {/* A navegação cresce nas próximas fases: Gráficos, Previsão. */}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <form action={signOutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4">{children}</main>
    </div>
  );
}
