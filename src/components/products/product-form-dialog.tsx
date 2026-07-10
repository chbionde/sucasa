"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import type { BaseUnit } from "@prisma/client";
import { createProduct, updateProduct, type ProductState } from "@/actions/products";
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

type ProductInitial = {
  id: string;
  name: string;
  category: string;
  baseUnit: BaseUnit;
  packageSize: number;
};

const initialState: ProductState = {};

export function ProductFormDialog({
  mode = "create",
  product,
  trigger,
}: {
  mode?: "create" | "edit";
  product?: ProductInitial;
  trigger: React.ReactNode;
}) {
  const action = mode === "edit" ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [open, setOpen] = useState(false);

  // Dependemos do OBJETO state (não de state.success): cada submit devolve um
  // objeto novo, então o efeito roda a cada envio — inclusive em criações
  // seguidas (onde o valor `success` seria sempre `true`).
  useEffect(() => {
    if (state.success) {
      setOpen(false);
      toast.success(mode === "edit" ? "Produto atualizado." : "Produto criado.");
    }
  }, [state, mode]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar produto" : "Novo produto"}
          </DialogTitle>
          <DialogDescription>
            Guarde sempre na menor unidade. <strong>UN</strong> é exceção — use só
            quando o item não tem massa/volume relevantes (esponja, pilha). Teste:
            se trocar de marca muda o quanto você consome? Então não é UN.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {mode === "edit" && product ? (
            <input type="hidden" name="id" value={product.id} />
          ) : null}

          <ProductFields
            idPrefix={`${mode}-`}
            defaults={
              product
                ? {
                    name: product.name,
                    category: product.category,
                    baseUnit: product.baseUnit,
                    packageSize: product.packageSize,
                  }
                : undefined
            }
          />

          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
