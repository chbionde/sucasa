import type { ListStatus } from "@prisma/client";

export const LIST_STATUS_LABELS: Record<ListStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Comprando",
  COMPLETED: "Concluída",
};
