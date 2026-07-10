"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { BaseUnit } from "@prisma/client";
import {
  toggleItemChecked,
  updateItemPlannedPackages,
  removeItem,
} from "@/actions/shopping-lists";
import { formatQuantity } from "@/lib/units";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  checked: boolean;
  plannedPackages: number;
  productName: string;
  baseUnit: BaseUnit;
  packageSize: number;
};

export function ShoppingListItemRow({
  item,
  readOnly = false,
}: {
  item: Item;
  readOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  // Estado local do input para digitar sem ida-e-volta a cada tecla; salva no blur.
  const [qty, setQty] = useState(item.plannedPackages);

  function toggle() {
    startTransition(async () => {
      const r = await toggleItemChecked(item.id);
      if (r?.error) toast.error(r.error);
    });
  }

  function saveQty(next: number) {
    if (next === item.plannedPackages || next < 1) return;
    startTransition(async () => {
      const r = await updateItemPlannedPackages(item.id, next);
      if (r?.error) toast.error(r.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const r = await removeItem(item.id);
      if (r?.error) toast.error(r.error);
      else toast.success("Item removido.");
    });
  }

  const totalPlanned = item.packageSize * qty;

  return (
    <li className="flex items-center gap-3 p-3">
      <Checkbox
        checked={item.checked}
        onCheckedChange={toggle}
        disabled={pending || readOnly}
        aria-label={`Marcar ${item.productName} como pego`}
      />

      <div className="flex flex-1 flex-col">
        <span
          className={
            item.checked ? "text-muted-foreground line-through" : "font-medium"
          }
        >
          {item.productName}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatQuantity(item.packageSize, item.baseUnit)} / embalagem · total{" "}
          {formatQuantity(totalPlanned, item.baseUnit)}
        </span>
      </div>

      {readOnly ? (
        <span className="w-16 text-center text-sm">{item.plannedPackages}×</span>
      ) : (
        <Input
          type="number"
          min={1}
          step={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          onBlur={(e) => saveQty(Number(e.target.value))}
          className="w-16"
          aria-label="Embalagens planejadas"
          disabled={pending}
        />
      )}

      {!readOnly ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={remove}
          disabled={pending}
          aria-label={`Remover ${item.productName}`}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </li>
  );
}
