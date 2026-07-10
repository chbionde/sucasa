import { PrismaClient } from "@prisma/client";

// Singleton do PrismaClient.
// Em dev o Next recarrega módulos a cada alteração (HMR); sem isto, cada reload
// abriria uma nova conexão e esgotaria o pool do Postgres. Guardamos a instância
// no globalThis e reusamos. Em produção o módulo carrega uma única vez.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
