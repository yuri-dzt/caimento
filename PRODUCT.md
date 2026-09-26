# Product

<!-- impeccable:product-schema 1 -->

> Registro inferido do briefing inicial do dono do projeto (sem rodada de entrevista, a pedido dele). Itens marcados _(inferido)_ precisam de confirmação.

## Platform

web

## Users

- **Costureira / ateliê**: atende a cliente no balcão, com o celular na mão. A cliente quer uma peça de um modelo, mas o tecido que ela queria acabou; a costureira precisa mostrar como fica com outro tecido parecido.
- **Vendedora de loja de roupa**: a cliente quer uma peça cujo número acabou, ou quer ver a peça em outra estampa; a vendedora simula na hora.
- **Dona da loja**: cadastra funcionárias, controla o acervo de tecidos e peças.
- **Admin da plataforma**: cadastra lojas e donas.

## Product Purpose

Tirar a dúvida "como vai ficar?" antes de cortar o tecido ou fechar a venda. A partir da foto de uma peça de referência e da foto de um tecido, a IA gera a peça pronta feita com aquele tecido. Depois, com a foto da cliente, gera a cliente vestindo a peça. Sucesso: a cliente decide com segurança e a costureira não refaz trabalho.

## Positioning

Não é um provador genérico de e-commerce: parte do **tecido físico que está no balcão**, fotografado na hora, e do modelo que a cliente trouxe (foto, print do Instagram). A troca de tecido é o mecanismo principal; o provador virtual é a etapa seguinte.

## Operating Context

- Uso principal no celular, em pé, no balcão ou no provador, com a cliente ao lado olhando a tela _(inferido)_.
- Fotos tiradas na hora com a câmera do celular: tecido esticado na mesa, peça no cabide ou print de rede social.
- A geração leva de 10 a 60 segundos: a tela precisa segurar a atenção da cliente durante a espera.
- O resultado é mostrado à cliente e pode ser enviado por WhatsApp _(inferido)_.

## Capabilities and Constraints

- Login local (e-mail e senha), sem cadastro público. Papéis: admin, dona, funcionária (permissões view/create/edit/delete).
- Acervos: peças de referência, tecidos (com tipo: linho, malha, cetim...), clientes (foto com consentimento LGPD).
- Simulações: troca de tecido e provador virtual, com histórico.
- O resultado é uma **simulação**, não uma promessa: a tela deve deixar isso claro.
- IA atual: OpenAI (gpt-image-1, edição com várias imagens). Gemini fica como alternativa por variável de ambiente; troca de provedor não muda a tela.

## Brand Commitments

- Nome: **Caimento** (termo de costura: como o tecido cai no corpo) _(inferido, nome provisório)_.
- Interface em português do Brasil. Sem travessão em textos de tela.

## Evidence on Hand

Nenhuma. Não há clientes, depoimentos, fotos reais ou métricas. Não inventar.

## Product Principles

1. A foto é a protagonista: a interface se recolhe e deixa peça, tecido e resultado ocuparem a tela.
2. Três toques até gerar: escolher peça, escolher tecido, gerar.
3. Honestidade: toda imagem gerada é rotulada como simulação.
4. Privacidade da cliente: foto só com consentimento, e some quando a cliente é excluída.

## Accessibility & Inclusion

- Alvo WCAG 2.1 AA _(inferido)_. Alvos de toque de 44px ou mais (uso em pé, com uma mão).
- Contraste suficiente sob luz forte de loja.
