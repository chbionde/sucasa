import { PrismaClient, Prisma, type BaseUnit } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { derivePurchaseItem } from "../src/lib/purchase-math";

const prisma = new PrismaClient();

// Instância do better-auth SÓ para o seed: sem o plugin nextCookies (que depende
// do runtime do Next e quebraria num script node puro). O hash de senha é
// independente do secret, então usuários criados aqui logam normalmente no app.
const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  secret: process.env.BETTER_AUTH_SECRET ?? "seed-secret-dev",
});

const USERS = [
  { name: "Ana", email: "ana@sucasa.dev", password: "senha1234" },
  { name: "Bruno", email: "bruno@sucasa.dev", password: "senha1234" },
];

type SeedProduct = {
  name: string;
  category: string;
  baseUnit: BaseUnit;
  packageSize: number;
};

// Detergente: packageSize ATUAL = 1000 (marca nova). O histórico abaixo compra
// 500 ml nas 4 primeiras compras — validando packageSizeSnapshot (o histórico
// não é reescrito quando o produto muda de embalagem).
const PRODUCTS: SeedProduct[] = [
  { name: "Arroz", category: "Mercearia", baseUnit: "G", packageSize: 5000 },
  { name: "Feijão", category: "Mercearia", baseUnit: "G", packageSize: 1000 },
  { name: "Açúcar", category: "Mercearia", baseUnit: "G", packageSize: 1000 },
  { name: "Café", category: "Mercearia", baseUnit: "G", packageSize: 500 },
  { name: "Suco em pó", category: "Mercearia", baseUnit: "G", packageSize: 30 },
  { name: "Sal", category: "Mercearia", baseUnit: "G", packageSize: 1000 },
  { name: "Macarrão", category: "Mercearia", baseUnit: "G", packageSize: 500 },
  { name: "Leite", category: "Mercearia", baseUnit: "ML", packageSize: 1000 },
  { name: "Óleo de soja", category: "Mercearia", baseUnit: "ML", packageSize: 900 },
  { name: "Detergente", category: "Limpeza", baseUnit: "ML", packageSize: 1000 },
  { name: "Amaciante", category: "Limpeza", baseUnit: "ML", packageSize: 2000 },
  { name: "Água sanitária", category: "Limpeza", baseUnit: "ML", packageSize: 1000 },
  { name: "Ovos", category: "Mercearia", baseUnit: "UN", packageSize: 12 },
  { name: "Papel higiênico", category: "Higiene", baseUnit: "UN", packageSize: 12 },
  { name: "Esponja de louça", category: "Limpeza", baseUnit: "UN", packageSize: 3 },
];

type ItemSpec = {
  product: string;
  packages: number;
  unitPrice: number;
  packageSize: number; // vira o packageSizeSnapshot desta compra
};
type PurchaseSpec = { date: string; establishment: string; items: ItemSpec[] };

// 8 compras ao longo de ~6 meses.
// Contagem por produto: Leite 8, Detergente 8, Arroz 6, Café 5, Ovos 5,
// Feijão 4, Papel higiênico 3, Óleo 3  (>=3 => previsão funciona);
// Amaciante 2 (=> "dados insuficientes"). Demais produtos: 0 compras.
const PURCHASES: PurchaseSpec[] = [
  {
    date: "2026-01-15",
    establishment: "Supermercado Bom Preço",
    items: [
      { product: "Arroz", packages: 1, unitPrice: 24.9, packageSize: 5000 },
      { product: "Leite", packages: 6, unitPrice: 4.2, packageSize: 1000 },
      { product: "Detergente", packages: 2, unitPrice: 2.4, packageSize: 500 },
      { product: "Café", packages: 1, unitPrice: 15.9, packageSize: 500 },
      { product: "Ovos", packages: 1, unitPrice: 11.5, packageSize: 12 },
      { product: "Feijão", packages: 2, unitPrice: 8.9, packageSize: 1000 },
    ],
  },
  {
    date: "2026-02-05",
    establishment: "Atacadão",
    items: [
      { product: "Leite", packages: 8, unitPrice: 4.1, packageSize: 1000 },
      { product: "Detergente", packages: 2, unitPrice: 2.3, packageSize: 500 },
      { product: "Arroz", packages: 1, unitPrice: 25.5, packageSize: 5000 },
      { product: "Café", packages: 1, unitPrice: 16.5, packageSize: 500 },
      { product: "Papel higiênico", packages: 1, unitPrice: 28.9, packageSize: 12 },
      { product: "Amaciante", packages: 1, unitPrice: 12.9, packageSize: 2000 },
    ],
  },
  {
    date: "2026-02-26",
    establishment: "Supermercado Bom Preço",
    items: [
      { product: "Leite", packages: 6, unitPrice: 4.3, packageSize: 1000 },
      { product: "Detergente", packages: 1, unitPrice: 2.5, packageSize: 500 },
      { product: "Ovos", packages: 2, unitPrice: 11.9, packageSize: 12 },
      { product: "Feijão", packages: 1, unitPrice: 9.2, packageSize: 1000 },
      { product: "Óleo de soja", packages: 2, unitPrice: 7.5, packageSize: 900 },
    ],
  },
  {
    date: "2026-03-19",
    establishment: "Mercadinho da Esquina",
    items: [
      { product: "Leite", packages: 6, unitPrice: 4.5, packageSize: 1000 },
      { product: "Detergente", packages: 2, unitPrice: 2.6, packageSize: 500 },
      { product: "Arroz", packages: 2, unitPrice: 26.9, packageSize: 5000 },
      { product: "Café", packages: 1, unitPrice: 17.2, packageSize: 500 },
      { product: "Ovos", packages: 1, unitPrice: 12.5, packageSize: 12 },
    ],
  },
  {
    date: "2026-04-12",
    establishment: "Atacadão",
    items: [
      { product: "Leite", packages: 8, unitPrice: 4.2, packageSize: 1000 },
      { product: "Detergente", packages: 1, unitPrice: 4.4, packageSize: 1000 },
      { product: "Arroz", packages: 1, unitPrice: 27.5, packageSize: 5000 },
      { product: "Papel higiênico", packages: 2, unitPrice: 29.9, packageSize: 12 },
      { product: "Óleo de soja", packages: 1, unitPrice: 7.9, packageSize: 900 },
    ],
  },
  {
    date: "2026-05-06",
    establishment: "Supermercado Bom Preço",
    items: [
      { product: "Leite", packages: 6, unitPrice: 4.4, packageSize: 1000 },
      { product: "Detergente", packages: 1, unitPrice: 4.5, packageSize: 1000 },
      { product: "Café", packages: 1, unitPrice: 18.0, packageSize: 500 },
      { product: "Ovos", packages: 2, unitPrice: 12.9, packageSize: 12 },
      { product: "Feijão", packages: 2, unitPrice: 9.5, packageSize: 1000 },
      { product: "Amaciante", packages: 1, unitPrice: 13.5, packageSize: 2000 },
    ],
  },
  {
    date: "2026-05-30",
    establishment: "Atacadão",
    items: [
      { product: "Leite", packages: 8, unitPrice: 4.3, packageSize: 1000 },
      { product: "Detergente", packages: 2, unitPrice: 4.3, packageSize: 1000 },
      { product: "Arroz", packages: 1, unitPrice: 28.9, packageSize: 5000 },
      { product: "Papel higiênico", packages: 1, unitPrice: 30.5, packageSize: 12 },
      { product: "Óleo de soja", packages: 1, unitPrice: 8.2, packageSize: 900 },
    ],
  },
  {
    date: "2026-06-25",
    establishment: "Supermercado Bom Preço",
    items: [
      { product: "Leite", packages: 6, unitPrice: 4.6, packageSize: 1000 },
      { product: "Detergente", packages: 1, unitPrice: 4.6, packageSize: 1000 },
      { product: "Arroz", packages: 1, unitPrice: 29.5, packageSize: 5000 },
      { product: "Café", packages: 1, unitPrice: 18.5, packageSize: 500 },
      { product: "Ovos", packages: 1, unitPrice: 13.2, packageSize: 12 },
      { product: "Feijão", packages: 1, unitPrice: 9.9, packageSize: 1000 },
    ],
  },
];

// Apaga tudo antes de recriar, para o seed ser reexecutável. Ordem respeita FKs.
async function wipe() {
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.shoppingListItem.deleteMany();
  await prisma.shoppingList.deleteMany();
  await prisma.product.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.household.deleteMany();
  await prisma.verification.deleteMany();
}

async function createPurchase(
  householdId: string,
  productIdByName: Map<string, string>,
  spec: PurchaseSpec,
) {
  const date = new Date(`${spec.date}T12:00:00`);

  // Toda compra nasce de uma ShoppingList concluída (regra central do app).
  const list = await prisma.shoppingList.create({
    data: {
      householdId,
      name: `Compra de ${date.toLocaleDateString("pt-BR")}`,
      status: "COMPLETED",
      createdAt: date,
      completedAt: date,
    },
  });

  let total = new Prisma.Decimal(0);
  const itemsData: Prisma.PurchaseItemCreateManyPurchaseInput[] = spec.items.map(
    (it) => {
      const productId = productIdByName.get(it.product);
      if (!productId) throw new Error(`Produto não encontrado: ${it.product}`);
      const d = derivePurchaseItem({
        packages: it.packages,
        unitPrice: it.unitPrice,
        packageSizeSnapshot: it.packageSize,
      });
      total = total.add(d.subtotal);
      return {
        productId,
        packages: it.packages,
        unitPrice: d.unitPrice,
        packageSizeSnapshot: it.packageSize,
        baseQuantity: d.baseQuantity,
        pricePerBaseUnit: d.pricePerBaseUnit,
        subtotal: d.subtotal,
      };
    },
  );

  await prisma.purchase.create({
    data: {
      householdId,
      shoppingListId: list.id,
      date,
      establishment: spec.establishment,
      total,
      items: { createMany: { data: itemsData } },
    },
  });
}

async function main() {
  await wipe();

  // 1) Usuários (via better-auth => hash de senha no formato correto).
  for (const u of USERS) {
    await seedAuth.api.signUpEmail({ body: u });
  }
  const users = await prisma.user.findMany({
    where: { email: { in: USERS.map((u) => u.email) } },
  });

  // 2) Household (activeMemberCount 2) conectando os dois usuários.
  const household = await prisma.household.create({
    data: {
      name: "Casa de exemplo",
      activeMemberCount: 2,
      users: { connect: users.map((u) => ({ id: u.id })) },
    },
  });

  // 3) Produtos.
  await prisma.product.createMany({
    data: PRODUCTS.map((p) => ({ ...p, householdId: household.id })),
  });
  const products = await prisma.product.findMany({
    where: { householdId: household.id },
  });
  const productIdByName = new Map(products.map((p) => [p.name, p.id]));

  // 4) Compras (cada uma fecha uma ShoppingList).
  for (const spec of PURCHASES) {
    await createPurchase(household.id, productIdByName, spec);
  }

  console.log(
    `Seed OK: ${users.length} usuários, ${PRODUCTS.length} produtos, ${PURCHASES.length} compras em "${household.name}".`,
  );
  console.log(
    "Casos de teste: Detergente com snapshot 500->1000 ml; Amaciante com 2 compras (dados insuficientes).",
  );
  console.log(`Login de teste: ${USERS[0].email} / senha1234`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
