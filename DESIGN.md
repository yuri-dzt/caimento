# Design: Caimento

Mundo visual: **parede de linhas do armarinho**. O expositor de carretéis que toda costureira conhece vira o sistema: fundo de expositor, tinta azul-marinho, linha carmim como costura ativa, carretéis coloridos identificando tecidos.

Modo: Operate (ferramenta de balcão). A foto é a protagonista; a interface se recolhe.

## Tokens (src/index.css, HSL, claro e escuro automático)

| Token | Papel |
|---|---|
| `background` | expositor: branco frio com furos de pegboard (radial-gradient 22px) |
| `foreground` / `primary` | tinta azul-marinho (`#1f2869`); no escuro vira lavanda clara |
| `stitch` | linha carmim (`#c41b3b`): item ativo do menu, costura em andamento. Nunca decoração |
| `accent` | azul muito claro: seleção, painéis de destaque |
| `wall` | azul-marinho profundo do painel do login |
| `thread-*` | 13 cores de carretel, uma por tipo de tecido (`FABRIC_TYPE_THREAD` em `src/types/labels.ts`) |
| `spool-cap` / `spool-core` | madeira do carretel nas ilustrações |

Regra: nunca hex solto em componente; só tokens.

## Tipografia

Inter (400/500/600/700). Escala compacta de produto: 12, 13, 15, 17, 22, 26 px. Títulos com tracking -0.02em. Sem fonte display.

## Formas

- Raio card 14px (`rounded-card`), controle 10px (`rounded-control`), chips e ações flutuantes em pílula.
- Sombras `shadow-lift` (repouso) e `shadow-float` (folhas, resultado).
- Alvo de toque mínimo 40 a 44px.

## Assinaturas do mundo

- **Pesponto** (`.stitch-frame`): borda tracejada de áreas vazias de foto, estados vazios e botão de "novo".
- **Amostra picotada** (`Swatch`, `PINKED_CLIP`): todo tecido aparece com borda de tesoura de picotar.
- **Carretel** (`Spool`, `FabricTypeChip`): cor da linha = tipo de tecido.
- **Costura em andamento** (`StitchingOverlay`): o único movimento autoral. Linha carmim pesponta a moldura enquanto a IA gera, com carretel enrolando.
- **Parede de linhas** (`ThreadWall`): ilustração do login.

## Layout

- Celular: topo com logo + avatar; abas na base (Bancada, Histórico, Tecidos, Peças, Clientes); ação principal fixa acima das abas.
- Desktop: sidebar de 232px com marcador carmim no item ativo; conteúdo até 6xl.
- Folhas (`Dialog` nativo) sobem de baixo no celular e centralizam no desktop.

## Movimento

150 a 250ms para estado. `prefers-reduced-motion` desliga tudo. Nada de animação de entrada de página.

## Honestidade

Todo resultado mostra o selo "Simulação por IA" e a bancada avisa que cores e caimento podem variar.
