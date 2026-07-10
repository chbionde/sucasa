import type { BaseUnit } from "@prisma/client";

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

// Formata uma quantidade guardada na unidade-base para EXIBIÇÃO.
// O banco só conhece G/ML/UN; a conversão para kg/L acontece só aqui.
// Ex.: formatQuantity(5000, "G") => "5 kg"; formatQuantity(500, "ML") => "500 ml".
export function formatQuantity(value: number, unit: BaseUnit): string {
  if (unit === "G") {
    return value >= 1000 ? `${nf.format(value / 1000)} kg` : `${nf.format(value)} g`;
  }
  if (unit === "ML") {
    return value >= 1000 ? `${nf.format(value / 1000)} L` : `${nf.format(value)} ml`;
  }
  return `${nf.format(value)} un`; // UN
}

export const BASE_UNIT_LABELS: Record<BaseUnit, string> = {
  G: "Gramas (g)",
  ML: "Mililitros (ml)",
  UN: "Unidade (un)",
};

export const BASE_UNIT_SHORT: Record<BaseUnit, string> = {
  G: "g",
  ML: "ml",
  UN: "un",
};

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Formata um valor monetário em reais. Recebe number (Decimal deve virar
// number com .toNumber() antes — só para exibição).
export function formatBRL(value: number): string {
  return brl.format(value);
}

// pricePerBaseUnit é R$ por unidade-base (R$/g, R$/ml, R$/un) — número minúsculo.
// Para exibição, escalamos para a unidade "grande": R$/kg, R$/L, R$/un.
// É o número comparável entre marcas ao longo do tempo.
export function formatPricePerBaseUnit(value: number, unit: BaseUnit): string {
  if (unit === "G") return `${formatBRL(value * 1000)}/kg`;
  if (unit === "ML") return `${formatBRL(value * 1000)}/L`;
  return `${formatBRL(value)}/un`;
}
