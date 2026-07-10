import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatQuantity, formatPricePerBaseUnit } from "@/lib/units";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CompraDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { householdId } = await requireHousehold();

  const purchase = await prisma.purchase.findFirst({
    where: { id, householdId },
    include: {
      items: { include: { product: true }, orderBy: { product: { name: "asc" } } },
      shoppingList: true,
    },
  });
  if (!purchase) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/historico"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Histórico
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          {purchase.date.toLocaleDateString("pt-BR")}
        </h1>
        <p className="text-muted-foreground">
          {purchase.establishment ?? "sem estabelecimento"} · total{" "}
          <span className="font-semibold text-foreground">
            {formatBRL(purchase.total.toNumber())}
          </span>
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Emb.</TableHead>
              <TableHead className="text-right">Preço/emb.</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Preço/unidade</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchase.items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/produtos/${it.productId}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {it.product.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {formatQuantity(it.packageSizeSnapshot, it.product.baseUnit)}/emb.
                  </span>
                </TableCell>
                <TableCell className="text-right">{it.packages}</TableCell>
                <TableCell className="text-right">
                  {formatBRL(it.unitPrice.toNumber())}
                </TableCell>
                <TableCell className="text-right">
                  {formatQuantity(it.baseQuantity, it.product.baseUnit)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPricePerBaseUnit(
                    it.pricePerBaseUnit.toNumber(),
                    it.product.baseUnit,
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatBRL(it.subtotal.toNumber())}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
