"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { BaseUnit } from "@prisma/client";
import { addItemToList } from "@/actions/shopping-lists";
import { formatQuantity } from "@/lib/units";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { InlineCreateProductDialog } from "@/components/lists/inline-create-product-dialog";

type ProductOption = {
  id: string;
  name: string;
  baseUnit: BaseUnit;
  packageSize: number;
};

// Autocomplete sobre os produtos do household que ainda NÃO estão na lista.
// Ao lado, um botão "Criar novo" para cadastrar um produto inédito.
export function AddItemCombobox({
  listId,
  products,
}: {
  listId: string;
  products: ProductOption[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(productId: string) {
    startTransition(async () => {
      const res = await addItemToList(listId, productId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Item adicionado.");
        setOpen(false);
        setSearch("");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={pending}>
            <Plus className="mr-2 size-4" />
            Adicionar produto
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar produto..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {products.length === 0
                  ? "Todos os produtos já estão na lista."
                  : "Nada encontrado."}
              </CommandEmpty>
              <CommandGroup>
                {products.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.name}
                    onSelect={() => handleAdd(p.id)}
                  >
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatQuantity(p.packageSize, p.baseUnit)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <InlineCreateProductDialog listId={listId} defaultName={search} />
    </div>
  );
}
