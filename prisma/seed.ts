import { PrismaClient, type BaseUnit } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

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

// ~15 produtos cobrindo G, ML e UN.
// Detergente (500ml) é o produto cuja embalagem MUDA entre compras na fase 3
// (500 -> 1000), para validar packageSizeSnapshot.
const PRODUCTS: SeedProduct[] = [
  // G — sólidos por massa
  { name: "Arroz", category: "Mercearia", baseUnit: "G", packageSize: 5000 },
  { name: "Feijão", category: "Mercearia", baseUnit: "G", packageSize: 1000 },
  { name: "Açúcar", category: "Mercearia", baseUnit: "G", packageSize: 1000 },
  { name: "Café", category: "Mercearia", baseUnit: "G", packageSize: 500 },
  { name: "Suco em pó", category: "Mercearia", baseUnit: "G", packageSize: 30 },
  { name: "Sal", category: "Mercearia", baseUnit: "G", packageSize: 1000 },
  { name: "Macarrão", category: "Mercearia", baseUnit: "G", packageSize: 500 },
  // ML — líquidos por volume
  { name: "Leite", category: "Mercearia", baseUnit: "ML", packageSize: 1000 },
  { name: "Óleo de soja", category: "Mercearia", baseUnit: "ML", packageSize: 900 },
  { name: "Detergente", category: "Limpeza", baseUnit: "ML", packageSize: 500 },
  { name: "Amaciante", category: "Limpeza", baseUnit: "ML", packageSize: 2000 },
  { name: "Água sanitária", category: "Limpeza", baseUnit: "ML", packageSize: 1000 },
  // UN — unidades sem massa/volume relevantes ao consumo
  { name: "Ovos", category: "Mercearia", baseUnit: "UN", packageSize: 12 },
  { name: "Papel higiênico", category: "Higiene", baseUnit: "UN", packageSize: 12 },
  { name: "Esponja de louça", category: "Limpeza", baseUnit: "UN", packageSize: 3 },
];

// Apaga tudo antes de recriar, para o seed ser reexecutável.
// Ordem respeita as foreign keys.
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

  console.log(
    `Seed OK: ${users.length} usuários, ${PRODUCTS.length} produtos em "${household.name}".`,
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
