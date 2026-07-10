import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SetupForm } from "@/components/setup-form";

// /setup vive fora do grupo (app): exige login, mas ainda NÃO exige household
// (é justamente onde a casa é criada).
export default async function SetupPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.householdId) redirect("/"); // já tem casa

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configure sua casa</CardTitle>
          <CardDescription>
            Falta só um passo antes de começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetupForm />
        </CardContent>
      </Card>
    </div>
  );
}
