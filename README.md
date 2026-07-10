# sucasa

Controle de compras domésticas: listas de compra, histórico de preços e **previsão de consumo** por produto — para saber *quando* e *quanto* comprar, e estimar o gasto do mês.

Projeto de uso pessoal (uma casa com 2 pessoas) e também portfólio. Não é comercial.

---

## Objetivo

O coração do app é comparar preços e prever consumo **de forma confiável ao longo do tempo**, mesmo trocando de marca e de tamanho de embalagem. Para isso:

- Tudo é armazenado na **menor unidade** (gramas, mililitros ou unidade) — nunca kg/L. A conversão para kg/L é só na exibição.
- O número comparável entre marcas é o **preço por unidade-base** (`pricePerBaseUnit`, ex.: R$/g), nunca o preço da embalagem.
- Uma **compra** só nasce de uma **lista de compras concluída** — é o que mantém o histórico e a previsão confiáveis.
- A **previsão** é uma função pura e transparente (média de intervalos e de quantidade), **não** é machine learning.

---

## Funcionalidades (por fase)

| Fase | Escopo | Status |
|---|---|---|
| 1 | Infra (Docker + Prisma), autenticação e criação da casa (household) | ✅ Concluída |
| 2 | Produtos + CRUD de listas de compra | ⏳ A fazer |
| 3 | Fechamento de lista → gera Compra (com derivações e snapshot de embalagem) | ⏳ |
| 4 | Histórico de compras + página por produto | ⏳ |
| 5 | Previsão de consumo + simulador "e se fôssemos X pessoas" + testes | ⏳ |
| 6 | Dois gráficos (gasto/mês e evolução do preço por unidade-base) | ⏳ |
| 7 | PWA + build de produção + `docker-compose.prod.yml` | ⏳ |

---

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Prisma 6** + **PostgreSQL 16**
- **better-auth** (e-mail/senha, sem OAuth)
- **Tailwind CSS v4** + **shadcn/ui** (primitivos Radix)
- **Zod** (validação) · **Recharts** (gráficos, a partir da Fase 6) · **Vitest** (testes, a partir da Fase 5)
- **Docker Compose** para o ambiente de desenvolvimento

---

## Pré-requisitos

- [Node.js](https://nodejs.org) 22+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para o PostgreSQL)

---

## Como rodar (desenvolvimento)

### 1. Variáveis de ambiente
Copie o exemplo e ajuste se quiser:
```bash
cp .env.example .env
```
Os valores padrão já funcionam para dev local.

### 2. Instalar dependências
```bash
npm install
```

### 3. Subir o banco de dados
```bash
docker compose up -d db
```

### 4. Aplicar as migrations e popular dados de exemplo
```bash
npm run db:migrate   # cria as tabelas
npm run db:seed      # 2 usuários + 15 produtos de exemplo
```

### 5. Rodar a aplicação
```bash
npm run dev
```
Abra **http://localhost:3000**.

**Login de teste:** `ana@sucasa.dev` / `senha1234` (ou `bruno@sucasa.dev` / `senha1234`).

> **Dois modos de ambiente.** O recomendado no Windows é o **híbrido** acima (banco no Docker, app no host — hot reload mais rápido). Para rodar **tudo em Docker** (mais parecido com a VPS), use `docker compose up` — a primeira subida é lenta porque instala as dependências dentro do container.

---

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o app em modo desenvolvimento (hot reload) |
| `npm run build` / `npm start` | Build e execução de produção |
| `npm run lint` | ESLint |
| `npm run db:up` / `npm run db:down` | Sobe / derruba os containers |
| `npm run db:migrate` | Cria e aplica uma migration a partir do `schema.prisma` |
| `npm run db:seed` | Popula o banco com dados de exemplo (recria do zero) |
| `npm run db:studio` | Abre o Prisma Studio (navegador visual do banco) |
| `npm run db:reset` | Zera o banco e reaplica todas as migrations |

---

## Estrutura de pastas

```
prisma/
  schema.prisma        # modelos do banco (fonte da verdade)
  migrations/          # SQL versionado gerado pelo Prisma
  seed.ts              # dados de exemplo
src/
  app/
    (auth)/            # área pública: login, cadastro
    setup/             # criação da casa (logado, mas ainda sem household)
    (app)/             # área protegida: dashboard, configurações, ...
    api/auth/[...all]/ # único Route Handler: endpoints do better-auth
  actions/             # Server Actions ("use server") — as mutações
  components/
    ui/                # componentes do shadcn/ui
  lib/
    prisma.ts          # cliente Prisma (singleton)
    auth.ts            # config do better-auth (servidor)
    session.ts         # helper de leitura de sessão
docker-compose.yml     # banco (+ app opcional) para desenvolvimento
```

---

## Notas de arquitetura

- **Server Components** (padrão): `page.tsx`/`layout.tsx` rodam **no servidor**, acessam o banco direto e enviam HTML pronto. A guarda de autenticação vive no `src/app/(app)/layout.tsx`.
- **Client Components** (`"use client"`): rodam no navegador, para interatividade (formulários).
- **Server Actions** (`"use server"`): funções de servidor chamadas pelos formulários — substituem rotas de API para mutações. Todo input é validado com **Zod**.
- **Unidades:** sempre `G`, `ML` ou `UN` no banco; `packageSize` é o quanto de unidade-base vem em uma embalagem; `packages` é o número de embalagens compradas.

---

## Convenções

- Código e textos de interface em **português** (sem i18n).
- Sem OAuth, sem upload de imagens, sem notificações push.
- Testes automatizados apenas na lógica de previsão (`src/lib/forecast.ts`, a partir da Fase 5).
