"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/products";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Excluir "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res?.error) toast.error(res.error);
      else toast.success("Produto excluído.");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
    >
      Excluir
    </Button>
  );
}
