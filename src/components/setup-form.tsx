"use client";

import { useActionState } from "react";
import { createHouseholdAction, type HouseholdState } from "@/actions/household";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: HouseholdState = {};

export function SetupForm() {
  const [state, formAction, pending] = useActionState(
    createHouseholdAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome da casa</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Ex.: Casa da Praia"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="activeMemberCount">Pessoas ativas na casa</Label>
        <Input
          id="activeMemberCount"
          name="activeMemberCount"
          type="number"
          min={1}
          step={1}
          defaultValue={1}
          required
        />
        <p className="text-xs text-muted-foreground">
          Quantas pessoas consomem os itens da casa — inclui crianças e visitas
          frequentes, mesmo sem login. É o divisor das previsões e pode ser
          alterado depois.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Criar casa"}
      </Button>
    </form>
  );
}
