import Link from "next/link";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatQuantity, BASE_UNIT_SHORT } from "@/lib/units";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { DeleteProductButton } from "@/components/products/delete-product-button";

export default async function ProdutosPage() {
  const { householdId } = await requireHousehold();
  const products = await prisma.product.findMany({
    where: { householdId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-muted-foreground">
            {products.length} {products.length === 1 ? "cadastrado" : "cadastrados"}.
          </p>
        </div>
        <ProductFormDialog trigger={<Button>Novo produto</Button>} />
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">
          Nenhum produto ainda. Crie o primeiro no botão acima.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Embalagem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/produtos/${p.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{BASE_UNIT_SHORT[p.baseUnit]}</TableCell>
                  <TableCell>{formatQuantity(p.packageSize, p.baseUnit)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <ProductFormDialog
                        mode="edit"
                        product={{
                          id: p.id,
                          name: p.name,
                          category: p.category,
                          baseUnit: p.baseUnit,
                          packageSize: p.packageSize,
                        }}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        }
                      />
                      <DeleteProductButton id={p.id} name={p.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
