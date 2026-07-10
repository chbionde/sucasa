"use client";

import { useActionState } from "react";
import {
  updateActiveMemberCountAction,
  type HouseholdState,
} from "@/actions/household";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: HouseholdState = {};

export function MemberCountForm({ current }: { current: number }) {
  const [state, formAction, pending] = useActionState(
    updateActiveMemberCountAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex max-w-xs flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="activeMemberCount">Pessoas ativas na casa</Label>
        <Input
          id="activeMemberCount"
          name="activeMemberCount"
          type="number"
          min={1}
          step={1}
          defaultValue={current}
          required
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-600 dark:text-green-500">Atualizado.</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
