"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireHousehold } from "@/lib/session";
import { productSchema, plannedPackagesSchema } from "@/lib/validations";

export type CreateProductInListState = { error?: string; success?: boolean };

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

// ---------------------------------------------------------------- Listas ----

export async function createList(formData: FormData): Promise<void> {
  const { householdId } = await requireHousehold();
  const name = String(formData.get("name") ?? "").trim();

  const list = await prisma.shoppingList.create({
    data: { householdId, name: name || null, status: "DRAFT" },
  });

  redirect(`/listas/${list.id}`);
}

export async function deleteList(id: string): Promise<{ error?: string }> {
  const { householdId } = await requireHousehold();
  const list = await prisma.shoppingList.findFirst({ where: { id, householdId } });
  if (!list) return { error: "Lista não encontrada." };

  await prisma.shoppingList.delete({ where: { id } }); // itens caem em cascata
  revalidatePath("/listas");
  return {};
}

export async function setListStatus(
  id: string,
  status: "DRAFT" | "ACTIVE",
): Promise<{ error?: string }> {
  const { householdId } = await requireHousehold();
  const list = await prisma.shoppingList.findFirst({ where: { id, householdId } });
  if (!list) return { error: "Lista não encontrada." };
  // COMPLETED só é atingido pelo fechamento (Fase 3) e não volta atrás.
  if (list.status === "COMPLETED") return { error: "Lista já concluída." };

  await prisma.shoppingList.update({ where: { id }, data: { status } });
  revalidatePath(`/listas/${id}`);
  revalidatePath("/listas");
  return {};
}

// ----------------------------------------------------------------- Itens ----

// Carrega o item já verificando que ele pertence ao household (via a lista mãe).
async function findOwnedItem(itemId: string, householdId: string) {
  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    include: { shoppingList: { select: { id: true, householdId: true } } },
  });
  if (!item || item.shoppingList.householdId !== householdId) return null;
  return item;
}

export async function addItemToList(
  listId: string,
  productId: string,
): Promise<{ error?: string }> {
  const { householdId } = await requireHousehold();

  const [list, product] = await Promise.all([
    prisma.shoppingList.findFirst({ where: { id: listId, householdId } }),
    prisma.product.findFirst({ where: { id: productId, householdId } }),
  ]);
  if (!list || !product) return { error: "Lista ou produto inválido." };

  try {
    await prisma.shoppingListItem.create({
      data: { shoppingListId: listId, productId, plannedPackages: 1 },
    });
  } catch (err) {
    // Já está na lista (índice único listId+productId): não é erro para o usuário.
    if (isUniqueViolation(err)) return {};
    throw err;
  }

  revalidatePath(`/listas/${listId}`);
  return {};
}

export async function updateItemPlannedPackages(
  itemId: string,
  value: number,
): Promise<{ error?: string }> {
  const { householdId } = await requireHousehold();

  const parsed = plannedPackagesSchema.safeParse(value);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const item = await findOwnedItem(itemId, householdId);
  if (!item) return { error: "Item não encontrado." };

  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { plannedPackages: parsed.data },
  });
  revalidatePath(`/listas/${item.shoppingList.id}`);
  return {};
}

export async function toggleItemChecked(
  itemId: string,
): Promise<{ error?: string }> {
  const { householdId } = await requireHousehold();
  const item = await findOwnedItem(itemId, householdId);
  if (!item) return { error: "Item não encontrado." };

  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { checked: !item.checked },
  });
  revalidatePath(`/listas/${item.shoppingList.id}`);
  return {};
}

export async function removeItem(itemId: string): Promise<{ error?: string }> {
  const { householdId } = await requireHousehold();
  const item = await findOwnedItem(itemId, householdId);
  if (!item) return { error: "Item não encontrado." };

  await prisma.shoppingListItem.delete({ where: { id: itemId } });
  revalidatePath(`/listas/${item.shoppingList.id}`);
  return {};
}

// ---------------------------------------- Criar produto e já adicionar à lista

export async function createProductAndAddToList(
  _prev: CreateProductInListState,
  formData: FormData,
): Promise<CreateProductInListState> {
  const { householdId } = await requireHousehold();

  const listId = String(formData.get("listId") ?? "");
  const list = await prisma.shoppingList.findFirst({ where: { id: listId, householdId } });
  if (!list) return { error: "Lista inválida." };

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    baseUnit: formData.get("baseUnit"),
    packageSize: formData.get("packageSize"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    // Transação: criar produto e adicionar o item são uma coisa só.
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { ...parsed.data, householdId },
      });
      await tx.shoppingListItem.create({
        data: { shoppingListId: listId, productId: product.id, plannedPackages: 1 },
      });
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        error: "Já existe um produto com esse nome. Use a busca para adicioná-lo.",
      };
    }
    throw err;
  }

  revalidatePath(`/listas/${listId}`);
  revalidatePath("/produtos");
  return { success: true };
}
