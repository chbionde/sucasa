"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireHousehold } from "@/lib/session";
import { derivePurchaseItem } from "@/lib/purchase-math";

export type CloseListState = { error?: string };

const headerSchema = z.object({
  date: z.coerce.date(),
  establishment: z.string().trim().optional(),
});

// packages >= 1 (inteiro); unitPrice > 0 (preço de UMA embalagem).
const itemSchema = z.object({
  packages: z.coerce.number().int("Quantidade inválida").min(1, "Mínimo 1"),
  unitPrice: z.coerce.number().positive("Preço inválido"),
});

export async function closeShoppingList(
  _prev: CloseListState,
  formData: FormData,
): Promise<CloseListState> {
  const { householdId } = await requireHousehold();
  const listId = String(formData.get("listId") ?? "");

  // Carrega a lista com os itens PEGOS (checked) — fonte autoritativa no servidor.
  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, householdId },
    include: { items: { where: { checked: true }, include: { product: true } } },
  });
  if (!list) return { error: "Lista não encontrada." };
  if (list.status === "COMPLETED") return { error: "Esta lista já foi concluída." };
  if (list.items.length === 0) {
    return { error: "Marque ao menos um item como pego antes de fechar." };
  }

  const header = headerSchema.safeParse({
    date: formData.get("date"),
    establishment: formData.get("establishment") || undefined,
  });
  if (!header.success) return { error: "Data inválida." };

  // Monta os itens com as derivações e soma o total (em Decimal).
  let total = new Prisma.Decimal(0);
  const itemsData: Prisma.PurchaseItemCreateManyPurchaseInput[] = [];

  for (const item of list.items) {
    const parsed = itemSchema.safeParse({
      packages: formData.get(`packages_${item.id}`),
      unitPrice: formData.get(`unitPrice_${item.id}`),
    });
    if (!parsed.success) {
      return {
        error: `Verifique quantidade e preço de "${item.product.name}".`,
      };
    }

    // Congela o tamanho da embalagem ATUAL do produto: se ele mudar depois
    // (troca de marca), este histórico não muda.
    const packageSizeSnapshot = item.product.packageSize;
    const derived = derivePurchaseItem({
      packages: parsed.data.packages,
      unitPrice: parsed.data.unitPrice,
      packageSizeSnapshot,
    });
    total = total.add(derived.subtotal);

    itemsData.push({
      productId: item.productId,
      packages: parsed.data.packages,
      unitPrice: derived.unitPrice,
      packageSizeSnapshot,
      baseQuantity: derived.baseQuantity,
      pricePerBaseUnit: derived.pricePerBaseUnit,
      subtotal: derived.subtotal,
    });
  }

  try {
    // Uma coisa só: criar a compra + seus itens e concluir a lista.
    await prisma.$transaction([
      prisma.purchase.create({
        data: {
          householdId,
          shoppingListId: list.id,
          date: header.data.date,
          establishment: header.data.establishment || null,
          total,
          items: { createMany: { data: itemsData } },
        },
      }),
      prisma.shoppingList.update({
        where: { id: list.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      }),
    ]);
  } catch (err) {
    // shoppingListId é único: se já houver compra para esta lista (duplo submit).
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "Esta lista já gerou uma compra." };
    }
    throw err;
  }

  revalidatePath("/listas");
  revalidatePath(`/listas/${list.id}`);
  redirect(`/listas/${list.id}`);
}
