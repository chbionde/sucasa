// Layout do grupo (auth): centraliza login e cadastro.
// Parênteses no nome da pasta = "route group": organiza arquivos e compartilha
// este layout, mas NÃO entra na URL (as rotas continuam /login e /signup).
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
