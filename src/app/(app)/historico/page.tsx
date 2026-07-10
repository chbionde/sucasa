import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/units";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// searchParams no Next 15 é uma Promise; os valores podem vir como string[]
// (parâmetros repetidos), então normalizamos para string única.
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { householdId } = await requireHousehold();
  const sp = await searchParams;
  const from = one(sp.from);
  const to = one(sp.to);
  const establishment = one(sp.establishment);

  // Estabelecimentos distintos do household, para o select do filtro.
  const estRows = await prisma.purchase.findMany({
    where: { householdId, establishment: { not: null } },
    distinct: ["establishment"],
    select: { establishment: true },
    orderBy: { establishment: "asc" },
  });
  const establishments = estRows
    .map((r) => r.establishment)
    .filter((e): e is string => e !== null);

  // Monta o filtro da query a partir da URL.
  const dateFilter: Prisma.DateTimeFilter = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(`${to}T23:59:59`);

  const purchases = await prisma.purchase.findMany({
    where: {
      householdId,
      ...(from || to ? { date: dateFilter } : {}),
      ...(establishment ? { establishment } : {}),
    },
    orderBy: { date: "desc" },
    include: { _count: { select: { items: true } } },
  });

  const totalGasto = purchases.reduce((acc, p) => acc + p.total.toNumber(), 0);
  const hasFilter = Boolean(from || to || establishment);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Histórico</h1>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs text-muted-foreground">
            De
          </label>
          <Input id="from" type="date" name="from" defaultValue={from} className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs text-muted-foreground">
            Até
          </label>
          <Input id="to" type="date" name="to" defaultValue={to} className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="establishment" className="text-xs text-muted-foreground">
            Estabelecimento
          </label>
          <select
            id="establishment"
            name="establishment"
            defaultValue={establishment ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            <option value="">Todos</option>
            {establishments.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {hasFilter ? (
          <Link href="/historico" className="text-sm underline underline-offset-4">
            Limpar
          </Link>
        ) : null}
      </form>

      <p className="text-sm text-muted-foreground">
        {purchases.length} {purchases.length === 1 ? "compra" : "compras"} ·{" "}
        total {formatBRL(totalGasto)}
      </p>

      {purchases.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma compra no período.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {purchases.map((p) => (
            <li key={p.id}>
              <Link
                href={`/historico/${p.id}`}
                className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {p.date.toLocaleDateString("pt-BR")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {p.establishment ?? "sem estabelecimento"} · {p._count.items}{" "}
                    {p._count.items === 1 ? "item" : "itens"}
                  </span>
                </div>
                <span className="font-semibold">{formatBRL(p.total.toNumber())}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
