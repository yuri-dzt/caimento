# CHANGELOG

## [26/09/2026 12:22]
### Adicionado
- `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.server.json`, `tsconfig.test.json`: projeto único (Fastify + Vite/React) com scripts de dev, build, testes e Prisma
- `vite.config.mts`, `vitest.config.mts`, `tailwind.config.cjs`, `postcss.config.cjs`: configuração de build, testes e Tailwind com tokens
- `scripts/dev.cjs`: sobe backend e frontend juntos (funciona no Windows)
- `.env.example`, `.gitignore`, `.dockerignore`: variáveis documentadas e arquivos ignorados
- `Dockerfile`, `docker-compose.yml`: 1 imagem, 1 processo servindo API + front, migração no boot
- `prisma/schema.prisma`, `prisma/migrations/20260926000000_init/migration.sql`, `prisma/migrations/migration_lock.toml`: tabelas accounts, users, fabrics, garments, customers, simulations
- `prisma/seed.ts`: cria o primeiro admin da plataforma
- `server/domain/*`: entidades, enums e erros de negócio
- `server/contracts/*`: contratos de repositórios, storage, hash de senha, IA de imagem e fila
- `server/app/policies/*`: usuário autenticado e regras de permissão/escopo de loja
- `server/app/shared/*`: validação de imagem, chaves de arquivo, log com contexto, limpeza de storage
- `server/app/use-cases/auth/*`: login, sessão (me) e troca de senha
- `server/app/use-cases/accounts/*`, `server/app/use-cases/users/*`: gestão de lojas e usuários
- `server/app/use-cases/fabrics/*`, `server/app/use-cases/garments/*`, `server/app/use-cases/customers/*`: acervos, com consentimento LGPD para foto de cliente
- `server/app/use-cases/simulations/*`: criar, processar, listar, detalhar, excluir e recuperar simulações; prompts de troca de tecido e provador
- `server/infra/config/*`: env validado com zod, fuso, Prisma e MinIO
- `server/infra/services/*`: hash scrypt, provedor Gemini via REST e fila em memória
- `server/infra/storage/minio-storage-provider.ts`: storage com criação automática do bucket
- `server/infra/repositories/prisma/*`: repositórios Prisma
- `server/infra/http/*`: controllers, rotas, middlewares (auth, permissão, CSRF), sessão em cookie, URLs de arquivo assinadas, presenters, multipart
- `server/infra/container.ts`, `server/app.ts`, `server/server.ts`: composition root, montagem do Fastify e bootstrap
- `test/helpers/factories.ts`, `test/use-cases/*.test.ts`, `test/infra/security.test.ts`: 71 testes
- `index.html`, `public/favicon.svg`, `src/main.tsx`, `src/App.tsx`, `src/index.css`: SPA e tokens visuais
- `src/components/ui/*`: Button, Field, Dialog, Feedback, PageHeader, Spinner, ImageInput, Thread (carretel, amostra picotada, costura em andamento)
- `src/components/layout/*`: AppLayout, Logo, UserMenu, RequireAuth, navegação, ThreadWall
- `src/components/catalog/*`: formulários, tiles e seletor de acervo
- `src/pages/*`: Login, Bancada, Simulação, Histórico, Tecidos, Peças, Clientes, Equipe, Lojas, Minha conta, 404
- `src/contexts/auth-context.tsx`, `src/services/*`, `src/types/*`, `src/utils/*`: sessão, cliente da API, tipos e utilitários (compressão de imagem no celular, polling)
- `PRODUCT.md`: registro do produto (itens inferidos marcados)
- `DESIGN.md`: sistema visual "parede de linhas do armarinho"
- `ROADMAP.md`, `CHANGELOG.md`
### Editado
- `CLAUDE.md`: login local no lugar do auth-service, remoção do gpr-ui e da exceção gpr-prototipo, domínio clínica trocado por loja (accountId), processamento assíncrono, LGPD, estrutura real de pastas e identidade visual apontando para DESIGN.md

## [26/09/2026 12:34]
### Adicionado
- `server/infra/services/openai-image-provider.ts`: geração pela OpenAI (gpt-image-1, várias imagens de entrada, input_fidelity, erros traduzidos)
- `test/infra/openai-image-provider.test.ts`: 8 testes do provedor OpenAI (fetch mockado)
### Editado
- `server/infra/config/env.ts`: IMAGE_PROVIDER (openai padrão), variáveis OPENAI_*, timeout padrão 180 s
- `server/infra/container.ts`: escolhe o provedor pela variável IMAGE_PROVIDER
- `server/server.ts`: aviso de chave vazia vale para qualquer provedor
- `.env.example`: variáveis da OpenAI e seleção de provedor
- `CLAUDE.md`, `PRODUCT.md`, `ROADMAP.md`: OpenAI como provedor padrão

## [26/09/2026 12:37]
### Editado
- `server/infra/config/env.ts`, `server/infra/config/minio.ts`, `server/infra/storage/minio-storage-provider.ts`, `server/infra/container.ts`: suporte a MINIO_REGION (cliente e criação do bucket)
- `.env.example`: MINIO_REGION


## [26/09/2026 12:43]
### Editado
- `src/pages/WorkbenchPage.tsx`: modo "Só provar" na bancada (peça + cliente, sem troca de tecido), com seletor de modo e cadastro de cliente na hora
- `src/pages/SimulationPage.tsx`: "Gerar variação" e "Tentar de novo" também para prova direta (volta para a bancada no modo provar)

## [26/09/2026 12:46]
### Editado
- `server/infra/storage/minio-storage-provider.ts`: falha de conexão ou credencial do MinIO vira erro 503 com mensagem clara (antes "Erro interno"), com log do detalhe
- `src/utils/image.ts`: PNG/WEBP com transparência ganham fundo branco na conversão (antes o fundo ficava preto)

## [26/09/2026 12:55]
### Editado
- `src/pages/SimulationPage.tsx`: quadro do resultado limitado pela altura da tela (cabe inteiro sem rolar) e coluna da imagem com largura própria
