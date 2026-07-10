"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type HouseholdState = { error?: string; success?: boolean };

const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome para a casa"),
  activeMemberCount: z.coerce
    .number()
    .int("Use um número inteiro")
    .min(1, "Pelo menos 1 pessoa"),
});

export async function createHouseholdAction(
  _prev: HouseholdState,
  formData: FormData,
): Promise<HouseholdState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.householdId) redirect("/"); // já configurou

  const parsed = createHouseholdSchema.safeParse({
    name: formData.get("name"),
    activeMemberCount: formData.get("activeMemberCount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // connect no user já grava o householdId (FK) do usuário logado.
  await prisma.household.create({
    data: {
      name: parsed.data.name,
      activeMemberCount: parsed.data.activeMemberCount,
      users: { connect: { id: session.user.id } },
    },
  });

  redirect("/");
}

const memberCountSchema = z.object({
  activeMemberCount: z.coerce
    .number()
    .int("Use um número inteiro")
    .min(1, "Pelo menos 1 pessoa"),
});

export async function updateActiveMemberCountAction(
  _prev: HouseholdState,
  formData: FormData,
): Promise<HouseholdState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.householdId) redirect("/login");

  const parsed = memberCountSchema.safeParse({
    activeMemberCount: formData.get("activeMemberCount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.household.update({
    where: { id: session.user.householdId },
    data: { activeMemberCount: parsed.data.activeMemberCount },
  });

  // Invalida o cache da rota para a próxima leitura mostrar o valor novo.
  revalidatePath("/config");
  revalidatePath("/");
  return { success: true };
}
