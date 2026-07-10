import Link from "next/link";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createList } from "@/actions/shopping-lists";
import { LIST_STATUS_LABELS } from "@/lib/lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function ListasPage() {
  const { householdId } = await requireHousehold();
  const lists = await prisma.shoppingList.findMany({
    where: { householdId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Listas de compra</h1>

      {/* createList é uma Server Action usada direto como action do form. */}
      <form action={createList} className="flex gap-2">
        <Input
          name="name"
          placeholder="Nome da lista (opcional)"
          className="max-w-xs"
        />
        <Button type="submit">Nova lista</Button>
      </form>

      {lists.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma lista ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lists.map((l) => (
            <li key={l.id}>
              <Link
                href={`/listas/${l.id}`}
                className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{l.name ?? "Lista sem nome"}</span>
                  <span className="text-sm text-muted-foreground">
                    {l._count.items} {l._count.items === 1 ? "item" : "itens"} ·{" "}
                    {l.createdAt.toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <Badge
                  variant={
                    l.status === "COMPLETED"
                      ? "secondary"
                      : l.status === "ACTIVE"
                        ? "default"
                        : "outline"
                  }
                >
                  {LIST_STATUS_LABELS[l.status]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
