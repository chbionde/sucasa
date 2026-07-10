import { z } from "zod";

export const BASE_UNITS = ["G", "ML", "UN"] as const;

// Sugestões de categoria (a categoria é texto livre; isto só alimenta o datalist).
export const PRODUCT_CATEGORIES = [
  "Mercearia",
  "Limpeza",
  "Higiene",
  "Hortifrúti",
  "Bebidas",
  "Outros",
] as const;

// Regras da spec: packageSize > 0 e, para UN, deve ser inteiro.
export const productSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome"),
    category: z.string().trim().min(1, "Informe a categoria"),
    baseUnit: z.enum(BASE_UNITS),
    packageSize: z.coerce.number().positive("O tamanho deve ser maior que zero"),
  })
  .refine((d) => d.baseUnit !== "UN" || Number.isInteger(d.packageSize), {
    path: ["packageSize"],
    message: "Para unidade (UN), o tamanho da embalagem deve ser inteiro.",
  });

export type ProductInput = z.infer<typeof productSchema>;

// plannedPackages >= 1, inteiro.
export const plannedPackagesSchema = z.coerce
  .number()
  .int("Use um número inteiro")
  .min(1, "Mínimo de 1 embalagem");
