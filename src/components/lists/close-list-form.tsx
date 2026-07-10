"use client";

import { useActionState } from "react";
import type { BaseUnit } from "@prisma/client";
import { closeShoppingList, type CloseListState } from "@/actions/purchases";
import { formatQuantity } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CheckedItem = {
  id: string;
  productName: string;
  baseUnit: BaseUnit;
  packageSize: number;
  plannedPackages: number;
};

const initialState: CloseListState = {};

export function CloseListForm({
  listId,
  items,
  today,
}: {
  listId: string;
  items: CheckedItem[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    closeShoppingList,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="listId" value={listId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Data da compra</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="establishment">Estabelecimento (opcional)</Label>
          <Input id="establishment" name="establishment" placeholder="Ex.: Atacadão" />
        </div>
      </div>

      <div className="divide-y rounded-md border">
        {items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-end gap-4 p-3">
            <div className="min-w-[140px] flex-1">
              <p className="font-medium">{it.productName}</p>
              <p className="text-xs text-muted-foreground">
                {formatQuantity(it.packageSize, it.baseUnit)} / embalagem
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`packages_${it.id}`} className="text-xs">
                Embalagens
              </Label>
              <Input
                id={`packages_${it.id}`}
                name={`packages_${it.id}`}
                type="number"
                min={1}
                step={1}
                defaultValue={it.plannedPackages}
                className="w-24"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`unitPrice_${it.id}`} className="text-xs">
                Preço/embalagem (R$)
              </Label>
              <Input
                id={`unitPrice_${it.id}`}
                name={`unitPrice_${it.id}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                className="w-32"
                required
              />
            </div>
          </div>
        ))}
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar compra"}
        </Button>
      </div>
    </form>
  );
}
