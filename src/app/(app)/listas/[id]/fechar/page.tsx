import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CloseListForm } from "@/components/lists/close-list-form";

export default async function FecharListaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { householdId } = await requireHousehold();

  const list = await prisma.shoppingList.findFirst({
    where: { id, householdId },
    include: {
      items: {
        where: { checked: true },
        include: { product: true },
        orderBy: { product: { name: "asc" } },
      },
    },
  });
  if (!list) notFound();
  if (list.status === "COMPLETED") redirect(`/listas/${id}`);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Fechar lista</h1>
        <p className="text-muted-foreground">
          {list.name ?? "Lista sem nome"} — informe o que realmente comprou de
          cada item pego.
        </p>
      </div>

      {list.items.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted-foreground">
            Nenhum item marcado como pego. Volte e marque os itens que você
            comprou.
          </p>
          <Link href={`/listas/${id}`}>
            <Button variant="outline">Voltar à lista</Button>
          </Link>
        </div>
      ) : (
        <CloseListForm
          listId={list.id}
          today={today}
          items={list.items.map((i) => ({
            id: i.id,
            productName: i.product.name,
            baseUnit: i.product.baseUnit,
            packageSize: i.product.packageSize,
            plannedPackages: i.plannedPackages,
          }))}
        />
      )}
    </div>
  );
}
