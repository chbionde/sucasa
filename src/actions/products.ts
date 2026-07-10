"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireHousehold } from "@/lib/session";
import { productSchema } from "@/lib/validations";

export type ProductState = { error?: string; success?: boolean };

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    baseUnit: formData.get("baseUnit"),
    packageSize: formData.get("packageSize"),
  });
}

// P2002 = violação de índice único (aqui: nome de produto repetido no household).
function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

export async function createProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const { householdId } = await requireHousehold();

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.product.create({ data: { ...parsed.data, householdId } });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: "Já existe um produto com esse nome nesta casa." };
    }
    throw err;
  }

  revalidatePath("/produtos");
  return { success: true };
}

export async function updateProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const { householdId } = await requireHousehold();

  const id = String(formData.get("id") ?? "");
  // Escopo de segurança: o produto tem que ser DESTE household.
  const existing = await prisma.product.findFirst({ where: { id, householdId } });
  if (!existing) return { error: "Produto não encontrado." };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.product.update({ where: { id }, data: parsed.data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: "Já existe um produto com esse nome nesta casa." };
    }
    throw err;
  }

  revalidatePath("/produtos");
  return { success: true };
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  const { householdId } = await requireHousehold();

  const existing = await prisma.product.findFirst({
    where: { id, householdId },
    include: {
      _count: { select: { shoppingListItems: true, purchaseItems: true } },
    },
  });
  if (!existing) return { error: "Produto não encontrado." };

  // Protege o histórico/listas: não apaga produto já referenciado.
  if (existing._count.shoppingListItems > 0 || existing._count.purchaseItems > 0) {
    return {
      error: "Não dá para excluir: o produto está em alguma lista ou no histórico.",
    };
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/produtos");
  return {};
}
