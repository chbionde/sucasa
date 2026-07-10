import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Dashboard (rota "/"). O layout (app) já garantiu sessão + household;
// a checagem abaixo também estreita os tipos para o TypeScript.
export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user.householdId) redirect("/login");

  const household = await prisma.household.findUnique({
    where: { id: session.user.householdId },
    include: { _count: { select: { users: true, products: true } } },
  });
  if (!household) redirect("/setup");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{household.name}</h1>
        <p className="text-muted-foreground">
          Bem-vindo(a), {session.user.name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pessoas ativas</CardDescription>
            <CardTitle className="text-3xl">
              {household.activeMemberCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/config"
              className="text-sm underline underline-offset-4"
            >
              Editar
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Membros com login</CardDescription>
            <CardTitle className="text-3xl">{household._count.users}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Produtos cadastrados</CardDescription>
            <CardTitle className="text-3xl">
              {household._count.products}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Listas, produtos, histórico e previsão chegam nas próximas fases.
      </p>
    </div>
  );
}
