import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LIST_STATUS_LABELS } from "@/lib/lists";
import { Badge } from "@/components/ui/badge";
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

      <p className="text-sm text-muted-foreground">
        Concluir a lista para gerar a compra (com preços) chega na Fase 3.
      </p>
    </div>
  );
}
