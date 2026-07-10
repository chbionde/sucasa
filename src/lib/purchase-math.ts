import { Prisma } from "@prisma/client";

export type DerivedPurchaseItem = {
  unitPrice: Prisma.Decimal;
  baseQuantity: number;
  subtotal: Prisma.Decimal;
  pricePerBaseUnit: Prisma.Decimal;
};

// Deriva os campos calculados de um PurchaseItem, a partir do que o usuário
// informa (packages, unitPrice) e do snapshot do tamanho da embalagem.
//
// Dinheiro em Prisma.Decimal (evita erro de arredondamento de float);
// baseQuantity fica em number porque a coluna é Float e 0.0001g não importa.
//
// Regras da spec (calcular na criação, persistir — nunca recomputar na leitura):
//   baseQuantity      = packages × packageSizeSnapshot
//   subtotal          = packages × unitPrice
//   pricePerBaseUnit  = unitPrice / packageSizeSnapshot
export function derivePurchaseItem(input: {
  packages: number;
  unitPrice: number | string | Prisma.Decimal;
  packageSizeSnapshot: number;
}): DerivedPurchaseItem {
  const unitPrice = new Prisma.Decimal(input.unitPrice);
  return {
    unitPrice,
    baseQuantity: input.packages * input.packageSizeSnapshot,
    subtotal: unitPrice.mul(input.packages),
    pricePerBaseUnit: unitPrice.div(input.packageSizeSnapshot),
  };
}
