# CLAUDE.md: Padrões do Projeto

Manual de padrões obrigatórios. Serve de blueprint para iniciar projetos novos
sem retrabalho de setup. Tudo aqui é **obrigatório**, salvo onde marcado opcional.

**Produto: Caimento.** Sistema para quem vende ou faz roupa (lojas, costureiras,
ateliês). A partir da foto de uma peça de referência e da foto de um tecido, a IA
gera a peça pronta com o tecido trocado. Depois, com a foto da cliente, gera uma
simulação dela vestindo a peça (provador virtual).

---

## 1. Comunicação (modo caveman)

- Responder sempre em **português**.
- Responder **só o que foi perguntado**. Sem enfeite, sem preâmbulo, sem resumo
  do que já é óbvio.
- Listas curtas > parágrafos longos.
- Nada de elogio, encheção ou repetir o pedido de volta.
- **Nada de travessão (—) nem meia-risca (–)** em texto de tela, mensagem, commit,
  CHANGELOG, ROADMAP ou resposta no chat: dá cara de IA. Usar dois pontos, vírgula,
  parênteses ou ponto final.

---

## 2. Regra de ouro: planejar antes de agir

Antes de **qualquer** implementação:

1. Listar o plano completo.
2. Explicar **o porquê de cada decisão** tomada (e, se houver opção melhor,
   recomendar e justificar).
3. Aguardar a mensagem **"pode começar"**.

Formato:
```
PLANO:
1. [arquivo/ação], [o que será feito], [por quê]
2. ...
```

Só iniciar após confirmação explícita. Sem exceções. Sempre planejar já pensando
em expansão e escalabilidade.

Se o pedido for ambíguo → perguntar antes de planejar.

---

## 3. Proibições absolutas

| Ação | Regra |
|------|-------|
| `git commit` | ❌ Nunca sem permissão explícita |
| `git push` / abrir PR / `git merge` | ❌ Nunca sem permissão explícita |
| Deletar arquivos/pastas | ❌ Confirmar antes |
| Instalar dependências | ❌ Listar o que precisa e aguardar OK |

Para dependências:
```
DEPENDÊNCIA NECESSÁRIA: <nome>
Motivo: <por quê>
Aguardando aprovação...
```

Quando o trabalho estiver pronto: avisar _"Pronto para commit!"_, e já recomende uma mensagem para o commit.

---

## 4. Stack e versões

**Projeto único**: backend (`server/`, Fastify) + frontend (`src/`, Vite/React
SPA) no mesmo `package.json`. Em produção o Fastify serve a API **e** os
estáticos do front (`@fastify/static`), **1 processo, 1 porta, 1 container**.
Em dev, o Vite roda noutra porta e faz `proxy` de `/api` para o backend.

### Backend (`server/`)
- `fastify ^5` + `@fastify/jwt ^10` + `@fastify/cookie ^11` + `@fastify/cors ^11` + `@fastify/multipart ^10` + `@fastify/rate-limit ^10` + `@fastify/static ^10`
- `prisma ^5` + `@prisma/client ^5` (MySQL)
- `zod ^4` (validação de input)
- `dayjs ^1.11` (datas/fuso)
- `minio ^8` (storage de imagens)
- `dotenv`
- Hash de senha: `crypto.scrypt` nativo do Node (sem dependência externa)
- IA de imagem: OpenAI (`gpt-image-1`, endpoint `/v1/images/edits`) via `fetch`
  nativo (sem SDK), atrás do contrato `IImageGenerationProvider`. Provedor
  escolhido por `IMAGE_PROVIDER` (`openai` padrão, `gemini` alternativo)
- Dev: `tsx`, `typescript ^5.6`, `vitest ^2`, `@types/node`

### Frontend (`src/`, Vite SPA)
- `vite ^5` + `@vitejs/plugin-react ^4` + `react ^18` + `react-dom ^18`
- `react-router-dom ^6` (rotas + guards)
- `tailwindcss 3.4` + `tailwindcss-animate` + `postcss` + `autoprefixer`
- Componentes de UI **próprios** em `src/components/ui/` (ver §8). Sem design
  system externo.
- `lucide-react` (ícones)

> O front é SPA: chama a API via `services/api.ts` (fetch com cookie de sessão
> same-origin). Não há SSR nem Server Actions.

---

## 5. Arquitetura backend: Clean Architecture / DDD / SOLID / TDD

Camadas isoladas, dependência só para dentro (`domain ← app ← infra`). O
backend vive em `server/` (o `src/` é o frontend).

```
server/
├── app.ts               # monta o Fastify (plugins, rotas, estáticos do front)
├── server.ts            # bootstrap (listen + fila de simulações)
├── domain/
│   ├── entities/        # entidades de negócio (sem dependência de infra)
│   ├── enums/           # enums do domínio
│   └── errors/          # AppError e derivados (mapeados para HTTP no app.ts)
├── app/
│   ├── use-cases/       # 1 caso de uso por arquivo, agrupados por subdomínio
│   ├── policies/        # regras de autorização (permissões, escopo de loja)
│   └── shared/          # helpers de aplicação (imagens, log, limpeza de storage)
├── contracts/
│   ├── repositories/    # interfaces IXxxRepository
│   ├── services/        # IPasswordHasher, IImageGenerationProvider, IJobQueue
│   └── storage.ts       # IStorageProvider
├── generated/           # client Prisma gerado (não versionar)
└── infra/
    ├── http/
    │   ├── controllers/ # orquestram use-cases; sem regra de negócio
    │   ├── routes/      # index.ts: rotas públicas e protegidas (middlewares + controllers)
    │   ├── middlewares/ # auth.ts, permission.ts, csrf.ts
    │   └── signing.ts   # URLs assinadas de arquivo
    ├── repositories/prisma/  # PrismaXxxRepository implementa IXxxRepository
    ├── services/        # serviços externos (IA de imagem, hash, fila)
    ├── storage/         # MinioStorageProvider
    ├── config/          # env.ts, datetime.ts, prisma.ts, minio.ts
    └── container.ts     # composition root (singletons + factories)
```

### Padrão de use-case
```ts
export interface CreateXxxInput { /* campos */ }
export type CreateXxxOutput = Xxx

export class CreateXxxUseCase {
  constructor(
    private readonly xxxRepository: IXxxRepository,
  ) {}

  async execute(input: CreateXxxInput): Promise<CreateXxxOutput> {
    // validações + regra de negócio
  }
}
```

### Padrão de controller + rota
- Controller valida input com **zod**, lê `request.user` (injetado pelo
  middleware), instancia o use-case com deps do `container.ts`, responde HTTP.
- Rota registra `authMiddleware` em `onRequest` e, quando preciso,
  `requireAdmin`/`requirePermission` em `preHandler`.

### Contratos
- Interface por repositório: `I<Entidade>Repository` em `contracts/repositories/`.
- Implementação Prisma: `Prisma<Entidade>Repository` em `infra/repositories/prisma/`.

### Composition root (`infra/container.ts`)
- Repositórios e serviços como **singletons** (stateless, compartilham o
  Prisma client).
- Use-cases com grafo complexo expostos via factory `makeXxxUseCase()`.

### Processamento assíncrono (geração de imagem)
- Gerar imagem leva de 10 a 60 s: a criação da simulação responde na hora com
  status `PENDING` e enfileira o id no `IJobQueue`.
- Implementação atual: `InProcessJobQueue` (memória, concorrência configurável).
  No boot, simulações `PENDING`/`PROCESSING` são reenfileiradas.
- O front acompanha por polling de `GET /api/simulations/:id`.
- Para escalar em mais de 1 instância: trocar a implementação do `IJobQueue`
  (ex.: BullMQ + Redis) sem mexer em use-case.

### TDD
- `vitest`. Testes em `test/use-cases/`.
- Mockar **contratos** (não Prisma): `vi.fn().mockResolvedValue(...)`.
- Antes de marcar tarefa como pronta: `npm run typecheck` + `npm run test` verdes.

---

## 6. Convenções de código (TypeScript)

- **Idioma: tudo em inglês**, nomes de componentes, arquivos, variáveis,
  funções, tipos, branches e mensagens de commit. **Português apenas no que o
  usuário vê** (textos de UI, labels, mensagens de erro exibidas, conteúdo de
  e-mail). Comentários podem ser em português.
- `strict: true`. Nunca usar `any` sem comentário justificando.
- Sempre tipar retorno de função e resposta de API.
- Backend: `tsconfig` com `module: NodeNext` + `type: commonjs`.
- **Datas/fuso**: centralizado em `infra/config/datetime.ts`. Usar SEMPRE
  `toTz()`, `nowInTz()`, `toDayString()`, `dayjs.tz(..., APP_TZ)`. **Nunca**
  `import dayjs from 'dayjs'` cru fora de `datetime.ts` (quebra em host com TZ
  diferente). Fuso da empresa em `APP_TIMEZONE` (`America/Sao_Paulo`).
- Logar erro com contexto (função + parâmetros + mensagem): nunca só
  `console.error(e)`.
- Ao alterar uma função, verificar todos os chamadores.

---

## 7. Autenticação (login local)

A aplicação tem **login próprio**, sem nenhuma plataforma externa. Usuários e
senhas ficam no MySQL do projeto.

### Env
```env
JWT_SECRET=segredo_HS256_min_32_chars
JWT_EXPIRES_IN=7d
```

### Modelo
- `Account`: a loja ou ateliê (tenant). Todo dado de negócio pertence a uma
  `Account`.
- `User`: `email` único, `passwordHash`, `accountType`, `role`, `accountId`
  (nulo só para admin da plataforma), `active`.
- Senha com `crypto.scrypt` (salt aleatório de 16 bytes, formato
  `scrypt$<salt>$<hash>` em hex, comparação com `timingSafeEqual`). Contrato
  `IPasswordHasher`, implementação `ScryptPasswordHasher`.
- Senha mínima: 8 caracteres.
- Primeiro admin da plataforma criado pelo `prisma/seed.ts` (`ADMIN_NAME`,
  `ADMIN_EMAIL`, `ADMIN_PASSWORD`). Sem cadastro público: admin cria a loja e a
  dona; a dona cria as funcionárias.

### Endpoints
| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/api/auth/login` | valida email/senha, grava o cookie de sessão |
| `POST` | `/api/auth/logout` | apaga o cookie |
| `GET` | `/api/me` | usuário logado |
| `PATCH` | `/api/me/password` | troca a própria senha (pede a atual) |

- Login com `rate-limit` (10 tentativas por minuto por IP).
- Erro de login sempre genérico ("E-mail ou senha inválidos"), sem dizer qual
  campo errou. Usuário ou loja inativos também não entram.

### JWT (payload)
`sub, email, name, accountType ('admin'|'owner'|'employee'), accountId?,
accountName?, role ('view,create,edit,delete'), iat, exp`.

### Validação (middleware, toda requisição autenticada)
1. Lê o JWT do cookie httpOnly `session`.
2. Verifica assinatura HS256 com `JWT_SECRET`.
3. Verifica expiração (`exp`).
4. Injeta o payload em `request.user`.

### Autorização
- `accountType` define **escopo de dados** (`admin` = tudo; `owner`/`employee` =
  só a loja do `accountId`).
- `role` (CSV de `view|create|edit|delete`) é a **única fonte de verdade de
  operação**. Helper `hasPermission(role, required)`.
- Admin da plataforma ignora a checagem de `role`.
- Registro de outra loja acessado por id: responder `404` (não revela que existe).
- Gestão de usuários: admin gerencia tudo; `owner` só cria/edita `employee` da
  própria loja; `employee` não gerencia usuários.

| Operação | Role |
|---|---|
| GET | `view` |
| Criação/upload | `create` |
| Edição | `edit` |
| Remoção | `delete` |

### Front (SPA)
- Login chama `POST /api/auth/login`; o servidor grava a sessão em **cookie
  httpOnly** (`session`, SameSite=Lax, Secure em produção). O JavaScript não
  lê nem guarda o token (nada de `localStorage`).
- Quem está logado vem de `GET /api/me`. Métodos que gravam enviam
  `X-Requested-With: caimento` (proteção CSRF, checada no backend para todo
  método que não seja GET/HEAD). Token nunca vai na URL.
- Menu e botões filtrados por `accountType` + `role` (mesma regra do backend).
- `401` do backend → `services/api.ts` redireciona para `/login`.

---

## 8. Frontend obrigatório (Vite SPA + UI própria)

Todo frontend novo deve nascer com estes itens. Tecnologia: **Vite + React +
react-router-dom + Tailwind**. UI com componentes próprios.

### Identidade visual (Caimento)
- **Fonte da verdade: `DESIGN.md`** (mundo "parede de linhas do armarinho").
  Ler antes de criar ou alterar tela.
- Tokens de cor em HSL no `src/index.css` (`:root` + bloco
  `prefers-color-scheme: dark`), mapeados no `tailwind.config.cjs`. Paleta:
  tinta azul-marinho (primária), linha carmim `stitch` (costura ativa), fundo de
  expositor com furos, cores de carretel `thread-*` por tipo de tecido.
- Dark mode automático (`prefers-color-scheme`, `darkMode: 'media'`).
- Fonte: Inter. Raios: card 14px (`rounded-card`), controle 10px (`rounded-control`).
- Assinaturas: `.stitch-frame` (pesponto), `Swatch` (borda picotada),
  `FabricTypeChip` (carretel), `StitchingOverlay` (geração em andamento).
- **Mobile first**: o uso principal é no celular, tirando foto na hora.
  Inputs de imagem com `accept="image/*"` e `capture` quando fizer sentido.
- Logo: componente `Logo` em `src/components/layout/Logo.tsx` (ícone + nome),
  usado no login e no layout.

### Tokens de cor (usar sempre, nunca hex solto)
- Fundo: `bg-background`, `bg-card`, `bg-muted`, `bg-accent`
- Texto: `text-foreground`, `text-muted-foreground`
- Borda: `border-border`, `border-input`
- Estado/ação: `text-primary`, `text-destructive`, `text-success`, `text-warning`

### Componentes obrigatórios
- **Login** (`/login`): tela própria, form email/senha e erro. Chama `login()`
  do `auth-context`. Sem "criar conta" nem "esqueci minha senha" (quem reseta
  senha é a dona da loja ou o admin).
- **Layout**: `AppLayout` com sidebar (desktop) / menu inferior (mobile),
  `UserMenu` com logout, e logo. Itens filtrados por `accountType` + `role`.
  Usado como layout das rotas protegidas (`Outlet`).
- **Guard de rota**: componente `RequireAuth` que manda para `/login` se não
  houver sessão.
- **Página not-found**: rota coringa `*` renderiza uma `NotFoundPage`.
- Componentes base em `src/components/ui/`: `Button`, `Input`, `Label`,
  `Textarea`, `Select`, `Card`, `Dialog`, `Badge`, `Spinner`, `EmptyState`,
  `PageHeader`, `ImageInput`.

### Estrutura (front, em `src/`)
```
src/
├── main.tsx             # BrowserRouter + AuthProvider + App
├── App.tsx              # rotas (react-router) + guards
├── index.css            # tokens + tailwind
├── components/
│   ├── layout/          # AppLayout, Logo, UserMenu, RequireAuth, navigation
│   ├── catalog/         # forms, tiles e LibraryPicker (peças, tecidos, clientes)
│   └── ui/              # componentes reutilizáveis do projeto
├── contexts/            # auth-context (sessão via GET /api/me, cookie httpOnly)
├── services/            # api.ts (fetch same-origin, CSRF header, 401 → /login)
├── pages/               # LoginPage, NotFoundPage, demais telas
├── types/               # enums, interfaces, helpers de formatação
└── utils/               # helpers diversos (compressão de imagem, permissões)
```

---

## 9. Banco de dados (Prisma)

- Schema em `prisma/schema.prisma`. Client gerado em **`server/generated/prisma`**
  (output customizado), importar de lá, não de `@prisma/client`.
- `tsconfig.server.json` exclui `server/generated`.
- Migrations SQL versionadas em `prisma/migrations/` (seguir estilo do `init`).
- Em produção: `prisma migrate deploy` (roda no `command` do container).
- Seed manual: `prisma/seed.ts` via `tsx` (`prisma:seed`).
- Timestamps grandes podem ser `BigInt` no banco → serializar para `Number` no
  repositório.

---

## 10. Storage (MinIO)

- Contrato `IStorageProvider` (`contracts/storage.ts`): `isConfigured()`,
  `upload({ key, buffer, mimeType })`, `download(key)`, `getObject(key)`,
  `delete(key)`, `fileUrl(key)`.
- `MinioStorageProvider` em `infra/storage/`. Bucket único (`MINIO_BUCKET`),
  separado por pasta: `fileKey` = `{pasta}/{accountId}/...`
  (ex.: `simulations/{accountId}/{id}.png`). Pastas: `garments`, `fabrics`,
  `customers`, `simulations`.
- **Nunca** entregar URL assinada do MinIO ao navegador: ela aponta para o
  endpoint interno do storage e quebra em produção. O front recebe uma URL
  **same-origin** `/api/files/<key>?exp=&sig=` (HMAC-SHA256 com
  `APP_SECRET`, TTL `FILE_URL_TTL_SECONDS`), servida por stream pelo
  `file-controller`. Só pastas liberadas em `SERVABLE_PREFIXES`
  (`infra/http/signing.ts`). MinIO fica privado.
- No banco, guardar o **fileKey** (não a URL pública).
- Ao excluir a entidade dona, apagar o arquivo no MinIO (best-effort, com log)
  **antes** do banco (MinIO não é transacional).
- **LGPD**: foto de cliente é dado pessoal. Só aceitar com consentimento
  registrado (`photoConsentAt`). Excluir a cliente apaga a foto dela **e** todas
  as simulações de provador virtual (resultado tem o rosto dela).

---

## 11. Testes

- `vitest`. `test/use-cases/*.test.ts`. `vitest.config`: `globals: true`,
  `environment: 'node'`.
- Mockar contratos com `vi.fn()`. Helper `makeDeps()` por suíte.
- Cobrir as regras de negócio (validações, bloqueios, edge cases), não só o
  caminho feliz.

---

## 12. Docker

**1 Dockerfile, 1 compose, 1 serviço** (projeto único). Regras: imagem `slim`;
`WORKDIR /app`; copiar manifesto de deps → instalar → copiar resto (cache de
layer); **`command` no compose, não no Dockerfile**; `restart: unless-stopped`;
porta com env + default; MySQL/MinIO externos via `host.docker.internal`. Build
compila client (`vite`) e server (`tsc`); runtime é **1 processo** que serve API
+ front.

### Dockerfile (multi-stage)
```dockerfile
# ---- base: Node + OpenSSL (Prisma) ----
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- build: devDeps + compila client (vite) e server (tsc) ----
FROM base AS build
COPY package.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate
COPY . .
RUN npm run build:client && npm run build:server

# ---- prod-deps: só dependências de runtime ----
FROM base AS prod-deps
COPY package.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate

# ---- production: 1 processo serve API + front ----
FROM base AS production
RUN apt-get update -y && apt-get install -y tzdata wget && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
COPY package.json ./
COPY prisma ./prisma/
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/generated ./dist/server/generated
EXPOSE ${PORT}
# CMD definido no docker-compose.yml
```

> Quando existir `package-lock.json` commitado, troque `npm install` por
> `npm ci` (build mais determinístico).

### docker-compose.yml
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: caimento
    restart: unless-stopped
    env_file: .env
    environment:
      - NODE_ENV=production
      - TZ=America/Sao_Paulo
      - PORT=${PORT:-3333}
    ports:
      - "${PORT:-3333}:${PORT:-3333}"
    # migra o banco e sobe o servidor (que serve API + front)
    command: ["sh", "-c", "npx prisma migrate deploy && node dist/server/server.js"]
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:${PORT:-3333}/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    # MySQL/MinIO rodam no host (fora do compose)
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

---

## 13. Variáveis de ambiente

- Nunca hardcodar o que deveria estar em `.env`.
- Nunca commitar `.env`/`.env.*`.
- Nova variável → adicionar só ao `.env.example` e avisar.
- `.env.example` é obrigatório e deve listar todas as variáveis usadas.
- Validação no boot com zod (`infra/config/env.ts`): variável obrigatória
  faltando derruba o processo com mensagem clara.

---

## 14. ROADMAP.md e CHANGELOG.md

### ROADMAP.md (criar na 1ª sessão)
- Tarefas: `- [ ] descrição` / `- [x] descrição: ✅ DD/MM/AAAA HH:MM`.
- Marcar concluído com data/hora; nunca remover itens; novas etapas vão ao fim
  da seção.

### CHANGELOG.md (append-only)
```
## [DD/MM/AAAA HH:MM]
### Adicionado
- `caminho/arquivo`: o que foi criado
### Editado
- `caminho/arquivo`: a mudança
### Removido
- `caminho/arquivo`: motivo
```
- Uma entrada por rodada de implementação. Registrar todo arquivo tocado. Omitir
  seções vazias. Nunca apagar entradas antigas.

---

## 15. Revisão pós-implementação

Ao final de cada rodada, responder (curto):
1. ✅ O que foi feito
2. ⚠️ Edge cases / riscos (se houver)
3. 🔲 Próximos passos (se houver)
