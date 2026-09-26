# ROADMAP: Caimento

## Fase 0: Fundação
- [x] CLAUDE.md corrigido: login local, sem gpr-ui, domínio loja/ateliê: ✅ 26/09/2026 12:22
- [x] Projeto único Fastify + Vite/React, Prisma MySQL, MinIO, Docker: ✅ 26/09/2026 12:22
- [x] Login local (scrypt + JWT em cookie httpOnly + CSRF + rate limit): ✅ 26/09/2026 12:22
- [x] Lojas, usuários e permissões (admin, responsável, funcionária): ✅ 26/09/2026 12:22
- [x] Testes de casos de uso (71 testes): ✅ 26/09/2026 12:22

## Fase 1: MVP troca de tecido
- [x] Acervo de peças de referência e tecidos (foto + tipo de tecido): ✅ 26/09/2026 12:22
- [x] Bancada: peça + tecido + ajustes, geração assíncrona com fila: ✅ 26/09/2026 12:22
- [x] Provedor Gemini atrás do contrato IImageGenerationProvider: ✅ 26/09/2026 12:22
- [x] Histórico, compartilhar (WhatsApp via menu nativo) e baixar: ✅ 26/09/2026 12:22
- [ ] Rodar com MySQL, MinIO e chave de IA reais e calibrar os prompts com fotos de verdade
- [ ] Testar 2 ou 3 provedores de IA (Gemini, OpenAI gpt-image, FLUX Kontext) e comparar qualidade e custo
- [x] Provedor OpenAI (gpt-image-1) como padrão, Gemini opcional via IMAGE_PROVIDER: ✅ 26/09/2026 12:34
- [ ] Validar a chamada real da OpenAI com fotos de verdade (qualidade low para teste barato)

## Fase 2: Provador virtual
- [x] Cadastro de clientes com foto e consentimento LGPD: ✅ 26/09/2026 12:22
- [x] Prova da peça gerada na foto da cliente: ✅ 26/09/2026 12:22
- [x] Exclusão da cliente apaga foto e provas dela: ✅ 26/09/2026 12:22
- [ ] Avaliar API especializada de try-on (FASHN, Kling) se a OpenAI não preservar bem o corpo
- [ ] Retenção automática: apagar fotos de clientes sem uso há X meses
- [x] Modo "Só provar" na bancada (cliente veste a peça sem trocar tecido): ✅ 26/09/2026 12:43

## Fase 3: Escala e negócio
- [ ] Créditos por loja (limite de gerações por mês) e registro de custo por geração
- [ ] Trocar InProcessJobQueue por BullMQ + Redis para rodar mais de 1 instância
- [ ] Link público de compartilhamento com expiração
- [ ] Editar nome e observações de peça, tecido e cliente
- [ ] Paginação do histórico (hoje traz as 60 mais recentes)
- [ ] PWA (instalar na tela inicial do celular)
