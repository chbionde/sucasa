import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  formatBRL,
  formatQuantity,
  formatPricePerBaseUnit,
  BASE_UNIT_LABELS,
} from "@/lib/units";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProdutoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { householdId } = await requireHousehold();

  const product = await prisma.product.findFirst({ where: { id, householdId } });
  if (!product) notFound();

  // Itens de compra deste produto, do mais antigo ao mais novo.
  const items = await prisma.purchaseItem.findMany({
    where: { productId: id, purchase: { householdId } },
    include: { purchase: { select: { id: true, date: true, establishment: true } } },
    orderBy: { purchase: { date: "asc" } },
  });

  // Estatísticas descritivas (média simples; a previsão da Fase 5 é mais rigorosa).
  const count = items.length;
  const avgBaseQuantity =
    count > 0 ? items.reduce((a, i) => a + i.baseQuantity, 0) / count : 0;

  let avgIntervalDays: number | null = null;
  if (count >= 2) {
    const dates = items.map((i) => i.purchase.date.getTime());
    let sum = 0;
    for (let k = 1; k < dates.length; k++) {
      sum += (dates[k] - dates[k - 1]) / (1000 * 60 * 60 * 24);
    }
    avgIntervalDays = sum / (dates.length - 1);
  }

  const lastPricePerBaseUnit =
    count > 0 ? items[count - 1].pricePerBaseUnit.toNumber() : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/produtos"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Produtos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
        <p className="text-muted-foreground">
          {product.category} · {BASE_UNIT_LABELS[product.baseUnit]} · embalagem
          atual {formatQuantity(product.packageSize, product.baseUnit)}
        </p>
      </div>

      {count < 3 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {count === 0
            ? "Sem compras registradas ainda."
            : `Apenas ${count} ${count === 1 ? "compra" : "compras"} — poucas para uma previsão confiável (mínimo 3).`}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compras registradas</CardDescription>
            <CardTitle className="text-3xl">{count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Intervalo médio entre compras</CardDescription>
            <CardTitle className="text-3xl">
              {avgIntervalDays === null
                ? "—"
                : `${Math.round(avgIntervalDays)} dias`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quantidade média por compra</CardDescription>
            <CardTitle className="text-3xl">
              {count > 0
                ? formatQuantity(avgBaseQuantity, product.baseUnit)
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {lastPricePerBaseUnit !== null ? (
        <p className="text-sm text-muted-foreground">
          Último preço por unidade:{" "}
          <span className="font-medium text-foreground">
            {formatPricePerBaseUnit(lastPricePerBaseUnit, product.baseUnit)}
          </span>
        </p>
      ) : null}

      {count > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Estabelecimento</TableHead>
                <TableHead className="text-right">Emb.</TableHead>
                <TableHead className="text-right">Tamanho</TableHead>
                <TableHead className="text-right">Preço/unidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Do mais novo ao mais antigo na exibição. */}
              {[...items].reverse().map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    <Link
                      href={`/historico/${it.purchase.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {it.purchase.date.toLocaleDateString("pt-BR")}
                    </Link>
                  </TableCell>
                  <TableCell>{it.purchase.establishment ?? "—"}</TableCell>
                  <TableCell className="text-right">{it.packages}</TableCell>
                  <TableCell className="text-right">
                    {formatQuantity(it.packageSizeSnapshot, product.baseUnit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPricePerBaseUnit(
                      it.pricePerBaseUnit.toNumber(),
                      product.baseUnit,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        O gráfico da evolução do preço por unidade-base chega na Fase 6.
      </p>
    </div>
  );
}
