"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";

export type AuthState = { error?: string };

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome"),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa de ao menos 8 caracteres"),
});

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await auth.api.signUpEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (err) {
    // APIError = erro esperado do better-auth (ex.: e-mail já cadastrado).
    if (err instanceof APIError) {
      return { error: err.message };
    }
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  // redirect() lança uma exceção interna tratada pelo Next; por isso fica
  // FORA do try/catch (senão o catch a engoliria).
  redirect("/setup");
}

const signInSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (err) {
    if (err instanceof APIError) {
      // Mensagem genérica de propósito: não revelar se o e-mail existe.
      return { error: "E-mail ou senha inválidos." };
    }
    return { error: "Não foi possível entrar. Tente novamente." };
  }

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
