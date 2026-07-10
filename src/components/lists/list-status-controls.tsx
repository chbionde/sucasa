"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ListStatus } from "@prisma/client";
import { setListStatus, deleteList } from "@/actions/shopping-lists";
import { Button } from "@/components/ui/button";

export function ListStatusControls({
  id,
  status,
}: {
  id: string;
  status: ListStatus;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function changeStatus(next: "DRAFT" | "ACTIVE") {
    startTransition(async () => {
      const r = await setListStatus(id, next);
      if (r?.error) toast.error(r.error);
    });
  }

  function handleDelete() {
    if (!confirm("Excluir esta lista?")) return;
    startTransition(async () => {
      const r = await deleteList(id);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Lista excluída.");
        router.push("/listas");
      }
    });
  }

  if (status === "COMPLETED") {
    return <span className="text-sm text-muted-foreground">Lista concluída</span>;
  }

  return (
    <div className="flex gap-2">
      {status === "DRAFT" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeStatus("ACTIVE")}
          disabled={pending}
        >
          Iniciar compra
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeStatus("DRAFT")}
          disabled={pending}
        >
          Voltar a rascunho
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
      >
        Excluir
      </Button>
    </div>
  );
}
