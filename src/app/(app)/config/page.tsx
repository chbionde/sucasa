import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MemberCountForm } from "@/components/config/member-count-form";

export default async function ConfigPage() {
  const session = await getSession();
  if (!session?.user.householdId) redirect("/login");

  const household = await prisma.household.findUnique({
    where: { id: session.user.householdId },
  });
  if (!household) redirect("/setup");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>{household.name}</CardTitle>
          <CardDescription>
            Pessoas ativas é o divisor das previsões de consumo. Inclui quem não
            tem login (crianças, visitas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberCountForm current={household.activeMemberCount} />
        </CardContent>
      </Card>
    </div>
  );
}
