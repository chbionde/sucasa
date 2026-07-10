"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createProductAndAddToList,
  type CreateProductInListState,
} from "@/actions/shopping-lists";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductFields } from "@/components/products/product-fields";

const initialState: CreateProductInListState = {};

// Cria um produto novo E já o adiciona à lista atual (uma transação no servidor).
// defaultName vem do texto digitado na busca do combobox.
export function InlineCreateProductDialog({
  listId,
  defaultName,
}: {
  listId: string;
  defaultName?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createProductAndAddToList,
    initialState,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      toast.success("Produto criado e adicionado à lista.");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">Criar novo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>
            Cria o produto e já adiciona à lista. <strong>UN</strong> só para itens
            sem massa/volume relevantes (esponja, pilha).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="listId" value={listId} />

          <ProductFields idPrefix="inline-" defaults={{ name: defaultName }} />

          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Criar e adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
