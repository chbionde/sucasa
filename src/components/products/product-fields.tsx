"use client";

import type { BaseUnit } from "@prisma/client";
import { BASE_UNITS, PRODUCT_CATEGORIES } from "@/lib/validations";
import { BASE_UNIT_LABELS } from "@/lib/units";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Defaults = {
  name?: string;
  category?: string;
  baseUnit?: BaseUnit;
  packageSize?: number;
};

// Campos compartilhados do formulário de produto (usado no cadastro e no
// "criar inline" da lista). idPrefix evita ids duplicados quando dois
// formulários coexistem na página.
export function ProductFields({
  defaults,
  idPrefix = "",
}: {
  defaults?: Defaults;
  idPrefix?: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}name`}>Nome</Label>
        <Input
          id={`${idPrefix}name`}
          name="name"
          defaultValue={defaults?.name}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}category`}>Categoria</Label>
        <Input
          id={`${idPrefix}category`}
          name="category"
          list="sucasa-categorias"
          defaultValue={defaults?.category}
          required
        />
        <datalist id="sucasa-categorias">
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}baseUnit`}>Unidade base</Label>
          {/* radix Select com `name` participa do submit do form via input oculto. */}
          <Select name="baseUnit" defaultValue={defaults?.baseUnit ?? "G"}>
            <SelectTrigger id={`${idPrefix}baseUnit`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASE_UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {BASE_UNIT_LABELS[u]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}packageSize`}>Tamanho da embalagem</Label>
          <Input
            id={`${idPrefix}packageSize`}
            name="packageSize"
            type="number"
            step="any"
            min="0"
            defaultValue={defaults?.packageSize}
            required
          />
          <p className="text-xs text-muted-foreground">
            Quanto vem em 1 embalagem (ex.: 5000 = 5 kg).
          </p>
        </div>
      </div>
    </>
  );
}
