import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

// Server Component: roda no servidor. Checa a sessão antes de renderizar
// e manda quem já está logado para o dashboard.
export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Comece a controlar as compras da sua casa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
