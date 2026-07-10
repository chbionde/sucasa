import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LIST_STATUS_LABELS } from "@/lib/lists";
import { formatBRL } from "@/lib/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddItemCombobox } from "@/components/lists/add-item-combobox";
import { ShoppingListItemRow } from "@/components/lists/shopping-list-item-row";
import { ListStatusControls } from "@/components/lists/list-status-controls";

// No Next 15, `params` é uma Promise — precisa de await.
export default async function ListaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { householdId } = await requireHousehold();

  const list = await prisma.shoppingList.findFirst({
    where: { id, householdId }, // findFirst com householdId = escopo de segurança
    include: {
      items: {
        include: { product: true },
        orderBy: { product: { name: "asc" } },
      },
      purchase: true, // existe quando a lista já foi fechada
    },
  });
  if (!list) notFound();

  // Produtos ainda não adicionados: alimentam o autocomplete.
  const products = await prisma.product.findMany({
    where: { householdId },
    orderBy: { name: "asc" },
  });
  const addedProductIds = new Set(list.items.map((i) => i.productId));
  const availableProducts = products
    .filter((p) => !addedProductIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      baseUnit: p.baseUnit,
      packageSize: p.packageSize,
    }));

  const checkedCount = list.items.filter((i) => i.checked).length;
  const readOnly = list.status === "COMPLETED";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {list.name ?? "Lista sem nome"}
          </h1>
          <Badge
            variant={
              list.status === "COMPLETED"
                ? "secondary"
                : list.status === "ACTIVE"
                  ? "default"
                  : "outline"
            }
          >
            {LIST_STATUS_LABELS[list.status]}
          </Badge>
        </div>
        <ListStatusControls id={list.id} status={list.status} />
      </div>

      {!readOnly ? (
        <AddItemCombobox listId={list.id} products={availableProducts} />
      ) : null}

      {list.items.length === 0 ? (
        <p className="text-muted-foreground">
          Nenhum item ainda. Adicione produtos acima.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {checkedCount}/{list.items.length} pegos
          </p>
          <ul className="flex flex-col divide-y rounded-md border">
            {list.items.map((item) => (
              <ShoppingListItemRow
                key={item.id}
                readOnly={readOnly}
                item={{
                  id: item.id,
                  checked: item.checked,
                  plannedPackages: item.plannedPackages,
                  productName: item.product.name,
                  baseUnit: item.product.baseUnit,
                  packageSize: item.product.packageSize,
                }}
              />
            ))}
          </ul>
        </div>
      )}

      {list.status === "COMPLETED" && list.purchase ? (
        <div className="rounded-md border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Compra registrada</p>
          <p className="text-lg font-semibold">
            {formatBRL(list.purchase.total.toNumber())}
          </p>
          <p className="text-sm text-muted-foreground">
            {list.purchase.date.toLocaleDateString("pt-BR")}
            {list.purchase.establishment
              ? ` · ${list.purchase.establishment}`
              : ""}
          </p>
        </div>
      ) : !readOnly && list.items.length > 0 ? (
        <div>
          <Link href={`/listas/${list.id}/fechar`}>
            <Button>Concluir compra</Button>
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">
            No fechamento você informa o preço e a quantidade realmente comprada
            de cada item marcado como pego.
          </p>
        </div>
      ) : null}
    </div>
  );
}
