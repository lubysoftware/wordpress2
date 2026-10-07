---
schemaVersion: 1
generatedAt: 2026-10-06T00:00:00-03:00
reversa:
  version: "1.0.0"
kind: screen_deviation_log
producedBy: screen-translator
mode: append-only
total: 5
pending: 5
approved: 0
rejected: 0
handoffToInspectorBlocked: true
hash: "sha256:1bc3c959f208d304d0b2c04384bfc97f0ec6882e14e8709cb05c29f66e29b125"
---

# Screen Deviation Log

> Registro de toda divergência entre o legado e a spec gerada em
> [`target_screens.md`](target_screens.md). Append-only. **Deviations
> pendentes bloqueiam o handoff ao Inspector.**
> Deviations aprovadas são propagadas para `parity_specs.md § Exceções` quando
> o Inspector rodar.

## Convenções

- **ID**: `DEV-NNN` (sequencial, três dígitos).
- **Tipo**:
  - `tecnica`: limitação técnica do alvo.
  - `modernizacao`: divergência intencional decorrente do modo modernizado.
  - `plataforma`: divergência forçada por incompatibilidade de plataforma.
  - `correcao`: bug visual do legado que o alvo corrige.
- **Aprovação**: `pendente` | `aprovado` | `rejeitado`.
- Deviation `aprovado` → também listada em `parity_specs.md § Exceções`.
- Deviation `pendente` → **bloqueia** handoff ao Inspector.
- Deviation `rejeitado` → arquivada com nota explícita; o agente regenera a
  tela em modo conformante.

## Resumo

| Medida | Valor |
|---|---|
| **Total** | **5** |
| Pendentes | **5** |
| Aprovadas | 0 |
| Rejeitadas | 0 |
| Telas afetadas por ao menos uma deviation | **113** (todas, por `DEV-001`) |
| Handoff ao Inspector | 🚫 **bloqueado** |

Duas das cinco são de **classe** (`DEV-001` e `DEV-002`): valem para um
conjunto de telas, não para uma. As outras três são pontuais. A razão de não
abrir 113 linhas idênticas está em § *Notas*, item 1.

---

## Entradas

### DEV-001

| Campo | Valor |
|---|---|
| Tela afetada | **todas as 113** (deviation de classe) |
| Tipo | `plataforma` |
| Descrição | O par origem→alvo `php-server-rendered → node-ts-server-rendered` **não existe** em `references/adapter-pairs.md`. A tabela v1 leva `php-server-rendered` só até `web-spa`. Logo nenhuma das 113 telas passou por adapter: a spec está em `raw-prose`, e o codificador interpreta prosa estruturada em vez de um formato canônico (`ansi-byte-stream`, `component-tree`, `route-component` ou `composable`). |
| Motivo | O princípio 4 do SKILL manda retornar `EC-01` e oferecer template raw em par não suportado, e a regra absoluta fecha: *"nunca improvisa formato"*. Usar `route-component` — o formato do vizinho mais próximo da tabela — exigiria preencher `spec.api_changes` com uma mudança de contrato HTTP que a migração **decidiu não fazer**: [`topology_decision.md`](topology_decision.md) § *Recomendação do Designer* preserva o caminho servido byte a byte. O formato errado não é neutro: pede dado que não existe e sugere trabalho que foi vetado. |
| Origem no legado | não se aplica — a divergência é do ferramental, não do código. Evidência do alvo em [`paradigm_decision.md`](paradigm_decision.md) § *Stack alvo declarada* |
| Implicação para parity tests | O Inspector não pode gerar teste a partir de um esquema: as seis seções de cada tela são prosa com `arquivo:linha`. A paridade tem de ser derivada seção por seção. Em compensação, o conteúdo é **mais** verificável que o usual: toda string e todo nome de campo tem linha de origem conferível. |
| Aprovação | `pendente` |
| Aprovado por | — |
| Aprovado em | — |
| Propaga para `parity_specs.md § Exceções` | sim |
| Como resolver de vez | Acrescentar a linha `php-server-rendered → node-ts-server-rendered` à tabela mestre de `references/adapter-pairs.md`, com adapter `php__node_ssr` e formato de spec novo. Sugestão de formato em § *Notas*, item 2. Este agente **não** pode fazer isso: `.claude/` é ferramental, e a regra absoluta o proíbe de escrever fora de `_reversa_sdd/migration/`, `_reversa_sdd/screens/` e `_reversa_sdd/design-system/tokens-derived.md`. |

### DEV-002

| Campo | Valor |
|---|---|
| Tela afetada | **as 14 em modo literal** (deviation de classe): `login`, `recuperacao-de-senha-redefinicao`, `registro-de-usuario`, `formulario-de-senha-de-conteudo`, `autorizar-aplicacao`, `editor-de-blocos-novo`, `editor-de-blocos-edicao`, `editor-do-site`, `widgets-em-blocos`, `modal-de-selecao-de-midia`, `editor-de-imagem`, `personalizador`, `menus-de-navegacao`, `widgets-classico` |
| Tipo | `tecnica` |
| Descrição | As 14 estão em modo literal e **não há captura do legado** para nenhuma delas. A regra absoluta do SKILL (RF-13) manda bloquear modo literal com plataforma alvo gráfica sem captura. Há 3 capturas para 113 telas, e as 3 são conteúdo de vitrine do tema, não desta instalação ([`../ui/inventory.md`](../ui/inventory.md) § *Caveat de origem*). |
| Motivo | A spec das 14 **foi gerada assim mesmo**, e sem nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. O bloqueio que RF-13 exige é obtido pelo mecanismo que o próprio SKILL define para isso — deviation pendente bloqueia o handoff ao Inspector. Entregar 14 seções vazias cumpriria a letra da regra e perderia informação que já está medida. |
| Origem no legado | `wp-login.php:1278`, `:932`, `:1095`; `wp-includes/post-template.php:1779`; `wp-admin/authorize-application.php`; `wp-admin/post-new.php`; `wp-admin/post.php`; `wp-admin/site-editor.php:302`; `wp-admin/widgets-form-blocks.php:94`; `wp-admin/media-upload.php`; `wp-admin/includes/image-edit.php`; `wp-admin/customize.php:192`–`:300`; `wp-admin/nav-menus.php:34`; `wp-admin/widgets-form.php` |
| Implicação para parity tests | Comparação **do HTML emitido**, não de pixel. `spec.normalize.compare` dessas 14 é `dom-and-field-names`. O contrato é o nome do campo, o `id` do ponto de montagem e a estrutura que o cliente externo consulta. Golden file no formato `html-css-snapshot` quando houver oráculo. |
| Aprovação | `pendente` — **este é o bloqueio de RF-13** |
| Aprovado por | — |
| Aprovado em | — |
| Propaga para `parity_specs.md § Exceções` | sim |
| Como destravar | Duas respostas, por tela ou para o conjunto. **(a)** Capturar as 14 do legado rodando: a deviation é aprovada e a paridade passa a ter oráculo. **(b)** Aceitar explicitamente modernizado para elas: a deviation é aprovada como *aceite explícito de modernizado*, as 14 seções mudam para `Modo aplicado: modernizado` e ganham a tabela de 4 estados. **A resposta (b) tem custo**: o DOM que o cliente do editor em bloco e os 65 arquivos `.js` empacotados leem deixa de ser contrato, e esse cliente não está no escopo do porte ([`paradigm_decision.md`](paradigm_decision.md), `ESC-CLIENTE`). |

### DEV-003

| Campo | Valor |
|---|---|
| Tela afetada | `tela-de-erro-generica` (`SCR-112`), `confirmacao-de-saida-do-sistema` (`SCR-004`) e `tela-de-erro-critico` (`SCR-113`) — as três passam pelo mesmo renderizador |
| Tipo | `tecnica` |
| Descrição | A tela de erro genérica **não carrega CSS algum do painel**: escreve a folha inteira embutida, entre `wp-includes/functions.php:3976` e `:4082`. Doze valores dessa folha — nove cores, um raio e dois tamanhos de fonte — **não têm token** em [`../design-system/tokens.md`](../design-system/tokens.md). O princípio 3 do SKILL proíbe literal solto na spec, então os doze receberam token derivado em [`../design-system/tokens-derived.md`](../design-system/tokens-derived.md) § 2. |
| Motivo | Sem token, a spec teria de escrever `#ccd0d4` solto, que é exatamente o que o princípio 3 proíbe. Os tokens derivados carregam o `arquivo:linha` de onde o valor foi lido, o que torna a divergência conferível em vez de invisível. |
| Origem no legado | `wp-includes/functions.php:3976`–`:4082` (folha embutida); `:3907` (`_default_wp_die_handler()`); `wp-includes/class-wp-fatal-error-handler.php:174`; `wp-includes/functions.php:3727` (`wp_nonce_ays()`) |
| Implicação para parity tests | Comparação de CSS nessas três telas tem de usar os tokens derivados como fonte, não `tokens.md`. **Dois pontos sensíveis**: `#f1f1f1` (fundo do `html`, `:3978`) **não é** `$gray-100` (`#f0f0f0`) — difere em um ponto por canal, invisível a olho nu e detectável por `diff`; e a pilha de fonte **troca inteira** para `Tahoma, Arial` quando a direção do texto é RTL (`:4081`), o que é comportamento observável, não estilo. |
| Aprovação | `pendente` |
| Aprovado por | — |
| Aprovado em | — |
| Propaga para `parity_specs.md § Exceções` | sim |

### DEV-004

| Campo | Valor |
|---|---|
| Tela afetada | `biblioteca-de-fontes` (`SCR-057`) |
| Tipo | `plataforma` |
| Descrição | Esta tela **nunca renderiza UI nesta árvore**. `wp-admin/font-library.php:22` testa `function_exists( 'wp_font_library_wp_admin_render_page' )`; a função **não existe em nenhum arquivo** da árvore, e a resposta é sempre o `wp_die` de 503 — *"Font Library is not available."* (`wp-admin/font-library.php:24`), com o texto *"The Font Library requires Gutenberg build files. Please run `npm install` to build the necessary files."* (`:25`). |
| Motivo | A causa é a mesma que `state.json` registra em cinco agentes anteriores: `wp-includes/js/dist/` não existe nesta árvore. A rota existe, logo a tela está no inventário; mas não há DOM funcional a preservar, logo ela ficou em **modernizado** e não em literal — colocá-la em literal seria prometer paridade com uma tela que nunca aparece. |
| Origem no legado | `wp-admin/font-library.php:22`, `:24`, `:25` |
| Implicação para parity tests | Nesta árvore o único comportamento verificável é o 503 e as duas mensagens. **Teste de paridade contra esta árvore seria enganoso**: ele passaria reproduzindo o erro. O oráculo útil é uma instalação com os arquivos de build presentes. |
| Aprovação | `pendente` |
| Aprovado por | — |
| Aprovado em | — |
| Propaga para `parity_specs.md § Exceções` | sim |

### DEV-005

| Campo | Valor |
|---|---|
| Tela afetada | `press-this` (`SCR-084`) |
| Tipo | `plataforma` |
| Descrição | Esta tela **nunca renderiza UI nesta árvore**, por causa diferente da de `DEV-004`. Os quatro caminhos de `wp_load_press_this()` terminam em `wp_die()`: recusa por capacidade (`wp-admin/press-this.php:19`), *"The Press This plugin is required."* (`:73`) e *"Press This is not available. Please contact your site administrator."* (`:79`). O caminho que renderizaria depende de `is_plugin_active( 'press-this/press-this-plugin.php' )` (`:24`), e `wp-content/plugins/` tem só `akismet`, `hello.php` e `index.php`. |
| Motivo | Aqui a UI não está fora da árvore por falta de *build*: ela está num plugin que o núcleo não empacota. É o caso mais limpo de tela que existe como rota e não como produto. Fica em **modernizado**, e o que a spec fixa é o comportamento real: as três mensagens de recusa e os links de ativar/instalar que `:41`–`:64` montam. |
| Origem no legado | `wp-admin/press-this.php:9`, `:18`, `:24`, `:41`, `:48`, `:73`, `:79`, `:87` |
| Implicação para parity tests | Testar paridade da UI é impossível e seria enganoso. O que **dá** para testar, e vale, é o roteamento: as três recusas, os códigos HTTP (`200` nos dois `wp_die` de instalação, `403` na recusa por capacidade) e as URLs de ativação/instalação com o `nonce` certo. |
| Aprovação | `pendente` |
| Aprovado por | — |
| Aprovado em | — |
| Propaga para `parity_specs.md § Exceções` | sim |
| Observação de escopo | Candidata natural a card `wont`. [`../backlog/backlog.md`](../backlog/backlog.md) já tem 15 cards `wont`, e o critério declarado ali — *"o valor de um wont não é o código que não se escreve: é a superfície que não se precisa defender depois"* — aplica-se inteiro aqui: a tela abre um *iframe* de escrita de conteúdo a partir de um *bookmarklet*. |

## Telas com mais de uma deviation

| Tela | IDs |
|---|---|
| `tela-de-erro-generica` (`SCR-112`) | `DEV-001`, `DEV-003` |
| `confirmacao-de-saida-do-sistema` (`SCR-004`) | `DEV-001`, `DEV-003` |
| `tela-de-erro-critico` (`SCR-113`) | `DEV-001`, `DEV-003` |
| `biblioteca-de-fontes` (`SCR-057`) | `DEV-001`, `DEV-004` |
| `press-this` (`SCR-084`) | `DEV-001`, `DEV-005` |
| as 14 em modo literal | `DEV-001`, `DEV-002` |

As outras 91 telas carregam apenas `DEV-001`.

## Notas

1. **Por que duas deviations de classe em vez de 113 e 14 linhas.** O
   `references/adapter-pairs.md` § *`raw-prose`* exige que *cada* tela em
   `raw-prose` tenha deviation registrada. A exigência está cumprida: cada uma
   das 113 seções de [`target_screens.md`](target_screens.md) referencia
   `DEV-001` nominalmente em § *Pontos de divergência aceitos*, e o campo
   `spec.deviations` do bloco YAML a lista. Abrir 113 linhas com descrição e
   motivo idênticos não acrescentaria informação e esconderia as três
   deviations que são de fato específicas de uma tela. A escolha está
   declarada aqui para ser contestável: se o Inspector precisar de uma linha
   por tela para gerar teste, ela se deriva mecanicamente do campo
   `spec.deviations`.

2. **Sugestão de adapter para a v2, do par que faltou.** O par
   `php-server-rendered → node-ts-server-rendered` é provavelmente o mais
   comum que existe em porte de sistema legado — todo CMS, todo ERP em PHP que
   vai para TypeScript cai nele — e a tabela v1 não o tem. O formato que esta
   etapa teria usado, se pudesse:

   - `spec.kind: server-template` — o alvo emite HTML no servidor, como a
     origem; a diferença é a linguagem, não o paradigma de render.
   - `spec.route`: **preservada**, sem `spec.api_changes`, porque num porte
     com URL preservada não há mudança de contrato HTTP a declarar. Esta é a
     diferença mais importante em relação a `route-component`.
   - `spec.document`: `own-head` | `inherited-frame` — e o motivo de isso
     merecer campo próprio está no item 3.
   - `spec.fields`: nome, tipo e `required`, com o nome **marcado como
     contrato** quando um cliente não reescrito o consome.
   - `spec.messages`: `msgid` do catálogo, literal, com a linha de origem.
   - `spec.dom_contract`: lista de `id` e de classe que um cliente externo
     consulta. É o que substitui a captura de tela como oráculo em porte
     server-to-server, e é por isso que RF-13 merece uma exceção declarada
     neste par: **o observável da origem é texto, não pixel.**

3. **Um aprendizado que vale para qualquer porte server-rendered.** A moldura
   do painel não é um envelope aplicável a toda rota de `/wp-admin/`. Das 80
   telas de `wp-admin/` no inventário, **68** carregam `admin-header.php` e
   **12 não** — e as 12 não são exceções triviais: incluem o instalador
   (`install.php:14` abre o próprio `<head>`), o reparo de banco
   (`maint/repair.php:12`, que roda **sem autenticação**), o personalizador
   (chrome de sobreposição cheia) e as respostas de *iframe*. São dois
   contratos de documento, não um. Um porte que aplicar um *layout* único a
   `/wp-admin/*` quebra 12 telas, e quebra calado.

4. **O que esta etapa não transformou em deviation, de propósito.** A
   divergência de 20,6 % contra [`../ui/inventory.md`](../ui/inventory.md)
   (`EC-03`) **não** é deviation: deviation é divergência entre o legado e a
   spec gerada, e ali a divergência é entre dois artefatos do pacote. Ela está
   em [`screen_modernization_decision.md`](screen_modernization_decision.md)
   § *O inventário divergiu do Visor acima do limite* e em
   [`../screens/inventory.json`](../screens/inventory.json)
   § `divergenceFromUiInventory`, com as 16 telas ausentes e as 5 entradas que
   não são tela, cada uma com a razão.

5. **`EC-11` (bug visual do legado) não gerou nenhuma entrada `correcao`.**
   Nenhum erro de digitação em rótulo foi detectado nas 2.984 strings. Isso
   **não** é o mesmo que afirmar que não há: a conferência foi de extração,
   não de revisão linguística — e revisão linguística não foi aprovada. Em
   modo literal o SKILL manda preservar o erro; em modernizado, corrigir e
   marcar `tipo=correcao`. Se alguém revisar as 2.984 strings e achar algo, a
   entrada entra aqui, e o modo da tela decide o tratamento.
