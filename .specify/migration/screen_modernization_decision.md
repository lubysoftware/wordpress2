---
schemaVersion: 1
generatedAt: 2026-10-06T00:00:00-03:00
reversa:
  version: "1.0.0"
kind: screen_modernization_decision
producedBy: screen-translator
decidedBy: null
decidedAt: null
decisionStatus: premissa-de-execucao-autonoma-pendente-de-ratificacao
mode: hybrid
sourcePlatform: php-server-rendered
targetPlatform: node-ts-server-rendered
adapterPairSupported: false
adapterPairError: EC-01
specKind: raw-prose
hash: "sha256:dc11d85ccdf9e6018d19dd14fb7e0cbd5e74b90361f97622b2c49c7ce22e6d49"
---

> ⚠️ **Esta decisão não passou por humano.** O `mode: hybrid` abaixo é a
> **recomendação do agente adotada como premissa de execução**, porque a
> instrução desta etapa manda rodar do início ao fim sem pedir confirmação
> (`state.json.answer_mode` é `file`: não há canal de conversa). O campo
> `decidedBy` é `null` de propósito — não há decisor. A pergunta do passo 5 do
> SKILL está na § *Decisão*, com as três opções e a recomendação, e segue
> aberta. Ratificar ou trocar a escolha **não exige** refazer a Fase 2 inteira:
> a § *O que muda se a resposta for outra* diz exatamente o que se refaz em
> cada caso.

# Decisão de Modernização de Telas

> Decisão consciente sobre como traduzir as telas do sistema legado: paridade
> observável byte-a-byte, redesign idiomático para a plataforma alvo, ou
> combinação tela-a-tela.
> Este artefato é leitura obrigatória do próprio Screen Translator (para gerar
> [`target_screens.md`](target_screens.md)), do Inspector (para construir
> parity tests adequados ao modo) e do agente de codificação.

| Escala de confiança | Significado |
|---|---|
| 🟢 CONFIRMADO | Assinatura forte presente no código, com `arquivo:linha` citado |
| 🟡 INFERIDO | Padrão bate, sem assinatura única ou sem declaração explícita |
| 🔴 LACUNA | Artefato ausente da árvore |
| ⚠️ AMBÍGUO | Duas leituras plausíveis empatadas |

**O que não é o sistema analisado:** `.claude/` e `.reversa/` são o ferramental
deste processo. Nenhum arquivo dos dois entrou em contagem de tela, de string,
de campo ou de linguagem. O sistema analisado é o resto da árvore: 3.381
arquivos, dos quais 1.467 são `.php`.

---

## Contexto

- **Plataforma origem detectada**: `php-server-rendered`
- **Confiança**: 🟢 CONFIRMADO
- **Plataforma alvo**: `node-ts-server-rendered`
- **Confiança do alvo**: 🟡 INFERIDO — ver § *A plataforma alvo foi inferida, e isso tem consequência*
- **Telas inventariadas**: **113**
- **Origem do inventário**: [`../screens/inventory.json`](../screens/inventory.json) (construído nesta etapa a partir do código) + [`../ui/inventory.md`](../ui/inventory.md) (Visor)
- **Adapter aplicado**: **nenhum** — o par `php-server-rendered → node-ts-server-rendered` não está em `references/adapter-pairs.md`. Erro `EC-01`, formato de spec `raw-prose`. Ver § *O par origem→alvo não é suportado na v1*

### Como a origem foi confirmada

| Assinatura da tabela de `references/platform-detection.md` | Medido nesta árvore | Conf. |
|---|---|---|
| `.php` + `<?php ... ?>` + HTML inline | 1.467 arquivos `.php`; **372** com `<?php` e HTML inline no mesmo arquivo | 🟢 |
| `mysqli_*` | `wp-includes/class-wpdb.php:935` — `mysqli_query( $dbh, $query );` | 🟢 |
| `html-legacy-jquery` como **camada secundária**: `jQuery` / `$.ajax` sem framework SPA | **65** arquivos `.js` com `jQuery(` ou `$.ajax(`; primeiro em `wp-admin/js/comment.js:14`. **Zero** `class ... extends React.Component` | 🟢 |

Nenhuma outra plataforma da tabela tem um único arquivo nesta árvore: zero
`.cob`, `.cbl`, `.frm`, `.pas`, `.dfm`, `.vbp`, `.asp`, `.aspx`, `.jsp`,
`.xaml`, `.cs`, `.xib`, `.storyboard`, `.dart`, `.kt`, `.java`, `.swift`,
`.c`, `.cpp`, `.rc`. A classificação não é ambígua.

Reproduzir: [`detect.py`](../../.reversa/work/reversa-screen-translator/detect.py).

### A plataforma alvo foi inferida, e isso tem consequência

O passo 2 do SKILL manda ler `paradigm_decision.md`, `topology_decision.md` e
`target_architecture.md` para inferir o alvo, e **perguntar quando a
arquitetura for silente sobre UI**. Ela é silente. O que os três declaram:

| Evidência | Onde | O que fixa |
|---|---|---|
| TypeScript `strict` sobre Node.js LTS, **sem framework opinativo** | [`paradigm_decision.md`](paradigm_decision.md) § *Stack alvo declarada* | linguagem e runtime, não camada de visão |
| **Caminho servido (URL) → preservar**, "contrato de terceiro, byte a byte" | [`topology_decision.md`](topology_decision.md) § *Recomendação do Designer* | as 113 rotas continuam nas mesmas URLs |
| "comportamento de caso de uso no **HTML de tema e painel**" | [`paradigm_decision.md`](paradigm_decision.md) § *Decisão do usuário*, critério de aceite | o HTML das telas **não** é byte a byte |
| Lado cliente do editor é **dependência externa com versão cravada**; entra no porte o servidor que o alimenta | [`paradigm_decision.md`](paradigm_decision.md) § *Stack alvo declarada*, linha final | há um cliente que o porte não reescreve |
| BC-10 Painel: "as ~100 telas de administração, as listagens e o painel inicial" | [`target_architecture.md`](target_architecture.md) § *BC-10* | as telas têm dono, mas não têm tecnologia de render declarada |

Juntando: o alvo emite **HTML no servidor**, nas mesmas URLs, em TypeScript,
sem framework. É isso que o slug `node-ts-server-rendered` nomeia. **Nenhum
dos três artefatos escreve essa frase** — ela é dedução, daí 🟡 INFERIDO.

> ❓ **Dúvida registrada, LACUNA-ST-01.** A plataforma alvo das telas é
> server-rendered em Node/TypeScript, ou é uma SPA servida nas mesmas URLs?
> Isso não é detalhe de implementação: troca o adapter, troca o formato da
> spec e troca o modo recomendado. **Como resolver**: uma linha em
> `target_architecture.md` dizendo se a camada de visão do painel é HTML no
> servidor ou cliente. **Se a resposta for SPA**: o par passa a ser
> `php-server-rendered → web-spa`, que **está** na tabela v1 (adapter
> `php__spa`, formato `route-component`, modo recomendado modernizado), o
> `EC-01` desta etapa deixa de existir e a Fase 2 é regenerada com
> `--regenerate-phase=generation`. O inventário e as listas do modo híbrido
> **não** mudam nesse caso: o que muda é o formato do bloco de spec.

### O par origem→alvo não é suportado na v1

`references/adapter-pairs.md` tem uma linha para `php-server-rendered`, e ela
termina em `web-spa`. Não há linha para um alvo server-rendered. O princípio 4
do SKILL é explícito: *"Pares não suportados em v1 retornam erro `EC-01` e
oferecem template raw"*, e a regra absoluta fecha: *"nunca improvisa formato"*.

Então, nesta etapa:

- **`EC-01` registrado.** O código de erro fica no *front matter*
  (`adapterPairError: EC-01`) para o Inspector e o codificador não lerem a
  spec como se tivesse passado por adapter.
- **Formato de spec: `raw-prose`**, com as seis seções obrigatórias que
  `references/adapter-pairs.md` § *`raw-prose`* exige — identidade, layout,
  campos, mensagens, eventos, validações.
- **Uma deviation de classe cobre as 113 telas** (`DEV-001`), porque o motivo
  é idêntico em todas e 113 linhas iguais não informariam nada. Cada seção de
  tela em [`target_screens.md`](target_screens.md) referencia `DEV-001`
  nominalmente, o que satisfaz a exigência de que *cada* tela tenha deviation
  registrada.

Por que **não** usar `route-component` assim mesmo, já que é o formato do
vizinho mais próximo da tabela: `route-component` carrega `spec.api_changes`,
que descreve a mudança de contrato HTTP entre legado e alvo (URL, método,
`content-type`). Aqui **não há mudança de contrato HTTP** — ela está proibida
por decisão: a URL é preservada byte a byte. Usar o formato implicaria
descrever uma mudança que a migração decidiu não fazer. O formato errado não é
neutro; ele pede dado que não existe e sugere trabalho que foi vetado.

> 📌 Não foi adicionada linha nova a `references/adapter-pairs.md`. Duas
> razões: `.claude/` é ferramental e não sistema analisado, e a regra absoluta
> do SKILL proíbe este agente de escrever fora de `_reversa_sdd/migration/`,
> `_reversa_sdd/screens/` e `_reversa_sdd/design-system/tokens-derived.md`.
> O par é uma sugestão de v2 e está em [`screen_deviation_log.md`](screen_deviation_log.md) § *Notas*.

### O inventário divergiu do Visor acima do limite — `EC-03`

| Medida | Valor |
|---|---|
| Telas em [`../ui/inventory.md`](../ui/inventory.md) | 102 (3 com captura + 99 no backlog de captura) |
| Telas neste inventário | **113** |
| Coincidem | 97 |
| Presentes aqui e **ausentes** no Visor | **16** |
| Listadas pelo Visor e que **não são tela** | **5** |
| `divergencePercent` | **20,6 %** |

O caso de borda `EC-03` do SKILL manda **parar e pedir revisão** acima de 10 %.
A instrução de execução desta etapa manda não parar, então: a divergência está
registrada aqui e em [`../screens/inventory.json`](../screens/inventory.json)
§ `divergenceFromUiInventory`, e a Fase 2 rodou sobre as 113. **Não houve
conciliação silenciosa** — nenhum número foi ajustado para caber no limite.

**As 16 telas que o Visor não tem** (todas conferidas no código):

| Tela | Origem | Por que o Visor não a tem |
|---|---|---|
| `aviso-de-e-mail-enviado` | `wp-login.php:1207` | o Visor listou 5 dos 9 `case` do `switch` de `$action` (`wp-login.php:579`) |
| `confirmacao-de-acao-por-chave` | `wp-login.php:1240` | idem |
| `confirmacao-de-e-mail-de-administracao` | `wp-login.php:581` | idem |
| `formulario-de-senha-de-conteudo` | `wp-includes/post-template.php:1779` | não é rota: o formulário sai de dentro do conteúdo, por `get_the_password_form()` |
| `tela-de-erro-generica` | `wp-includes/functions.php:3907` | é a superfície de erro mais renderizada do sistema, e não tem rota própria: **152 chamadas `wp_die()`** nas 113 telas caem nela |
| `front-end-fallback-index` | `templates/index.html` | o Visor listou 6 papéis de template; existem 13 |
| `front-end-pagina-sem-titulo` | `templates/page-no-title.html` | idem |
| `front-end-pagina-larga` | `templates/page-wide.html` | idem |
| `front-end-pagina-com-barra-lateral` | `templates/page-with-sidebar.html` | idem |
| `front-end-post-com-barra-lateral` | `templates/single-with-sidebar.html` | idem |
| `front-end-tela-em-branco` | `templates/blank.html` | idem |
| `front-end-blog-alternativo` | `templates/blog-alternative.html` | idem |
| `front-end-fragmento-cabecalho` | `parts/header.html` | o Visor contou `parts/footer*.html` como tela e não contou os outros 4 papéis de `parts/` |
| `front-end-fragmento-barra-lateral` | `parts/sidebar.html` | idem |
| `front-end-fragmento-meta-do-post` | `parts/post-meta.html` | idem |
| `front-end-fragmento-comentarios` | `parts/comments.html` | idem |

**As 5 que o Visor lista e que não são tela** — correções a
[`../ui/inventory.md`](../ui/inventory.md):

| Linha do Visor | Arquivo | Por que não é tela |
|---|---|---|
| "Fila de moderação (atalho legado)" | `wp-admin/moderation.php` | 307 bytes; o corpo é `wp_redirect( admin_url( 'edit-comments.php?comment_status=moderated' ) ); exit;`. Regra R2 |
| "Detalhe do anexo" | `wp-admin/media.php` | **os três caminhos do `switch` redirecionam** para `upload.php?error=deprecated` (`wp-admin/media.php:24`, `:29`, `:33`). A tela de detalhe de anexo hoje é `post.php?post=<id>&action=edit` |
| "Logout / confirmação" | `wp-login.php` (`action=logout`) | o `case 'logout'` (`wp-login.php:794`) **não pinta**: `wp_logout()` + `wp_safe_redirect`. A tela de confirmação que o usuário vê é `wp_nonce_ays()`, em `wp-includes/functions.php:3727` — reancorada aqui como `SCR-004` |
| "Link Categories" | `edit-tags.php?taxonomy=link_category` | taxonomia é parâmetro de rota; `edit-tags.php` já conta uma vez |
| `user/profile.php` e `user/user-edit.php` | `wp-admin/user/` | 252 e 253 bytes, só `require ABSPATH . 'wp-admin/<outro>.php'`. Regra R3 — mesma tela lógica em outro contexto de painel |

> A linha "Logout / confirmação" aparece nas duas tabelas acima porque o Visor
> acertou que **existe** uma tela de confirmação de saída e errou **onde** ela
> está. A âncora foi corrigida, não removida.

### Regra de recorte usada (declarada, para ser contestável)

O SKILL dá a regra para server-rendered em uma linha — *"uma tela por rota"*.
As seis regras abaixo são a aplicação dela, e estão no código em
[`inventario.py`](../../.reversa/work/reversa-screen-translator/inventario.py):

| # | Regra |
|---|---|
| R1 | toda rota `.php` que **pinta** (emite HTML próprio) é uma tela |
| R2 | arquivo que só redireciona (`wp_redirect` + `exit`) **não** é tela |
| R3 | arquivo de `wp-admin/network/` ou `wp-admin/user/` que só faz `require ABSPATH . 'wp-admin/<outro>.php'` **não** é tela nova |
| R4 | `wp-login.php` tem uma tela por `case` do `switch` de `$action` (`wp-login.php:579`) que pinta |
| R5 | front-end de tema de blocos: uma tela por **papel** de template, contada uma vez para os 3 temas; `parts/` entram como fragmento, um por papel |
| R6 | *include* carregado por outra tela (`edit-form-*.php`, `*-form*.php`) não é tela: é o corpo de uma tela que a rota já conta |

Das 150 rotas `.php` analisadas, 71 passaram por R1; as outras caíram em R2
(11), R3 (25) e infraestrutura/*include* (43). Sobre as 71 foram aplicadas R4
(+7 telas de `wp-login.php`), R5 (+20 do front-end), R6 (o editor clássico
`edit-form-advanced.php` conta como tela porque é um **render** distinto da
mesma rota) e as 2 superfícies de erro sem rota.

### O que o inventário mediu

| Medida | Valor |
|---|---|
| Telas | 113 |
| Telas marcadas críticas | 55 |
| Telas **com** captura de tela disponível | **3** (e as três são conteúdo de vitrine do tema, não desta instalação — [`../ui/inventory.md`](../ui/inventory.md) § *Caveat de origem*) |
| Strings literais distintas, extraídas dos arquivos | 2.984 |
| Campos de formulário distintos | 376 |
| Tags `<form>` | 106 |
| Telas com ao menos um formulário | 59 |
| Telas sem nenhum formulário | 54 |
| Mensagens `wp_die()` | 152 |
| Checagens `current_user_can()` nas telas | 180, com 63 capacidades distintas |
| *Nonces* distintos | 96 |
| Classes de tabela de listagem | 14 |
| Tipos de bloco distintos nos templates de tema | 20 |
| *Patterns* distintos referenciados | 18 |

Por grupo: Painel 64 · Front-end 20 · Rede 12 · Entradas públicas 11 ·
Instalação 4 · Erro e recuperação 2.

Reproduzir: [`resumo.py`](../../.reversa/work/reversa-screen-translator/resumo.py).

---

## Modos avaliados

### Modo: literal

- **Definição**: paridade observável byte-a-byte ou pixel-equivalente entre
  legado e novo.
- **Trade-offs**:
  - Custo de implementação: **alto** — 2.984 strings e 376 campos têm de sair
    idênticos, e o HTML do painel é montado por `admin-header.php` +
    `menu-header.php` (314 linhas de montagem de menu) antes de qualquer tela
  - Fidelidade visual: **alta**, mas não verificável aqui — ver abaixo
  - Viabilidade de parity tests construtivos: **parcial** — viável no HTML
    emitido, **não** viável em pixel: há 3 capturas para 113 telas, e as 3 são
    de conteúdo de demonstração
  - Aceitação esperada do usuário final: **alta** — ninguém reaprende nada
  - Débito técnico futuro: **alto** — carrega para dentro do alvo o `<table>`
    de layout, as classes `hide-if-js`/`hide-if-no-js` e o acoplamento a
    jQuery
- **Recomendado**: **não**
- **Justificativa**: duas razões independentes, e cada uma sozinha já bastaria.
  (1) **RF-13 bloqueia**: a regra absoluta do SKILL diz que modo literal com
  plataforma alvo gráfica **sem captura do legado** bloqueia até obter captura
  ou aceite explícito de modernizado. Há captura para 3 das 113, e as 3 não são
  desta instalação. (2) **O projeto já decidiu o contrário**: o critério de
  aceite de "idêntico" em [`paradigm_decision.md`](paradigm_decision.md) é
  *combinação por área*, e a área "HTML de tema e painel" ficou em
  **comportamento de caso de uso**, explicitamente não em byte a byte. Adotar
  literal para as 113 contrariaria a decisão de uma camada acima.

### Modo: modernizado

- **Definição**: redesign idiomático para a plataforma alvo, preservando
  informação e fluxo, mas re-expressando hierarquia e interação.
- **Trade-offs**:
  - Custo de implementação: **médio** — o conteúdo textual é preservado de
    graça (é literal por padrão); o que custa é redesenhar 59 formulários e 14
    tabelas de listagem
  - Fidelidade visual: **média** — a informação e o fluxo ficam; a marcação não
  - Viabilidade de parity tests construtivos: **sim**, por contrato semântico
    (evento, transição, conteúdo textual, estado), que é exatamente o que o
    critério de aceite pede para esta área
  - Aceitação esperada do usuário final: **média** — o painel que a pessoa usa
    todo dia muda de forma
  - Débito técnico futuro: **baixo** — nada de `<table>` de layout nem de
    acoplamento a jQuery entra no alvo
- **Recomendado**: **não** (mas por pouco: é o modo de 99 das 113)
- **Justificativa**: funciona para quase tudo e **quebra em 14 telas**. Nessas
  14, o HTML não é apresentação: é interface lida por um cliente que este porte
  **não reescreve** — o pacote do editor em bloco, que
  [`paradigm_decision.md`](paradigm_decision.md) fixou como dependência externa
  com versão cravada, e os 65 arquivos `.js` com jQuery/Backbone empacotados na
  árvore. Modernizar o DOM dessas telas quebra um cliente que ninguém vai
  corrigir, porque ele não faz parte do porte.

### Modo: híbrido

- **Definição**: parte das telas em literal, parte em modernizado, com listas
  explícitas.
- **Trade-offs**:
  - Custo de implementação: **médio** — soma o custo modernizado de 99 telas
    com o custo literal de 14
  - Fidelidade visual mista: literal nas 14 que têm cliente externo lendo o
    DOM; semântica nas 99 em que o único leitor é uma pessoa
  - Viabilidade de parity tests, por subconjunto: nas 14, comparação do HTML
    emitido contra o oráculo (determinística, sem pixel); nas 99, contrato
    semântico. O Inspector constrói duas estratégias, declaradas por tela em
    `parity_specs.md`
  - Fidelidade visual: **alta** nas 14, **média** nas 99
  - Custo de manutenção da separação: **baixo** — a fronteira não é uma lista
    de gosto, é um teste: *existe cliente que este porte não reescreve lendo
    este HTML?* Tela nova se classifica sozinha
- **Recomendado**: ✅ **sim**
- **Justificativa**: é o único modo que não precisa de exceção. O critério de
  aceite do projeto **já é híbrido por área** — byte a byte no contrato de
  terceiro, comportamento de caso de uso no HTML de painel e tema. O modo
  híbrido aqui é a aplicação desse mesmo critério na granularidade de tela, com
  a mesma pergunta que [`topology_decision.md`](topology_decision.md) usou para
  decidir topologia: *muda a saída observável?* Nas 14, muda, e muda para um
  consumidor que não é humano.

---

## Decisão

- **Modo escolhido**: **híbrido**
- **Justificativa do humano**: 🔴 **ausente** — não houve decisor. O que está
  registrado é a recomendação do agente, adotada como premissa reversível pela
  instrução de execução autônoma desta etapa. `decidedBy` e `decidedAt` são
  `null` de propósito, e `decisionStatus` é
  `premissa-de-execucao-autonoma-pendente-de-ratificacao`.
- **Alternativas descartadas**:
  - **literal** — descartado por RF-13 (captura para 3 de 113) e por contrariar
    o critério de aceite por área já decidido.
  - **modernizado puro** — descartado porque quebra o DOM que o cliente do
    editor em bloco e os 65 arquivos `.js` empacotados leem, e esse cliente não
    está no escopo do porte.
  - **Outro / modo customizado** — a opção aberta que o passo 5 do SKILL exige
    oferecer continua disponível; o uso mais provável dela está em
    LACUNA-ST-02, abaixo.
- **Decidido em**: `null`
- **Decidido por**: `null`

> ❓ **A pergunta do passo 5, para quem for ratificar:** **qual modo você
> escolhe — literal, modernizado, híbrido, ou outro?** Em modo híbrido, as
> duas listas abaixo são obrigatórias e estão preenchidas; conferir se o
> critério é o certo importa mais que conferir tela por tela.

> ❓ **Dúvida registrada, LACUNA-ST-02.** Há uma classe de tela que talvez não
> deva ser traduzida: as **4 telas do gerenciador de links**
> (`link-manager.php`, `link-add.php`, `link-parse-opml.php` e o uso de
> `edit-tags.php` com `taxonomy=link_category`). [`../ui/inventory.md`](../ui/inventory.md)
> § 2.3 registra que **nenhum dos 56 módulos cobre o gerenciador de links**, e
> o módulo está oculto por padrão (opção `link_manager_enabled`). As telas
> estão especificadas em modo modernizado por padrão, mas a resposta
> "descartar as 4" é legítima e sai de graça. **Como resolver**: ler
> `link_manager_enabled` na instalação real, ou decidir o escopo.

### Em modo híbrido, listas explícitas (obrigatórias)

**Telas em modo literal — 14.** Critério: *o HTML da tela, ou o nome dos
campos do formulário, é lido por um cliente que este porte não reescreve.*
Nesses casos a marcação é interface, não apresentação.

*Família A — monta o cliente do editor em bloco. `ESC-CLIENTE`
([`paradigm_decision.md`](paradigm_decision.md) § *Stack alvo declarada*) fixou
esse cliente como dependência externa com versão cravada; o porte entrega o
ponto de montagem e o objeto de configuração que ele consome.*

| Tela | Origem | Evidência |
|---|---|---|
| `editor-de-blocos-novo` | `wp-admin/post-new.php` | corpo em `wp-admin/edit-form-blocks.php` |
| `editor-de-blocos-edicao` | `wp-admin/post.php` | corpo em `wp-admin/edit-form-blocks.php` |
| `editor-do-site` | `wp-admin/site-editor.php` | `wp_enqueue_script( 'wp-edit-site' )` em `wp-admin/site-editor.php:302` |
| `widgets-em-blocos` | `wp-admin/widgets-form-blocks.php` | ponto de montagem `<div id="widgets-editor">` em `wp-admin/widgets-form-blocks.php:94` |

*Família B — o DOM é o contrato entre o PHP e o JavaScript empacotado na
árvore e não reescrito: 65 arquivos `.js` com jQuery, e Backbone classificado
como estrutural **e abandonado** no `tech_stack`.*

| Tela | Origem | Evidência |
|---|---|---|
| `modal-de-selecao-de-midia` | `wp-admin/media-upload.php` | *iframe* lido pelo modal de mídia empacotado |
| `editor-de-imagem` | `wp-admin/includes/image-edit.php` | o HTML é devolvido por ação assíncrona e injetado pelo JS de mídia |
| `personalizador` | `wp-admin/customize.php` | 10 pontos de montagem `#customize-*` distintos, entre `wp-admin/customize.php:192` e `:300`, lidos por `customize-controls` (`:125`) |
| `menus-de-navegacao` | `wp-admin/nav-menus.php` | DOM de arrastar e soltar lido por `nav-menu` (`wp-admin/nav-menus.php:34`) |
| `widgets-classico` | `wp-admin/widgets-form.php` | DOM de arrastar e soltar lido pelo JS de widgets |

*Família C — o nome do campo é a API: aplicação externa ou tema de terceiro
depende dele.*

| Tela | Origem | Campos que são contrato |
|---|---|---|
| `login` | `wp-login.php:1278` | `log`, `pwd`, `rememberme`, `redirect_to` |
| `recuperacao-de-senha-redefinicao` | `wp-login.php:932` | `rp_key`, `pass1`, `pass2` |
| `registro-de-usuario` | `wp-login.php:1095` | `user_login`, `user_email` |
| `formulario-de-senha-de-conteudo` | `wp-includes/post-template.php:1779` | `post_password` — e o formulário sai **de dentro do conteúdo**, embutido pelo tema |
| `autorizar-aplicacao` | `wp-admin/authorize-application.php` | fluxo de senha de aplicação negociado com aplicação externa |

**Telas em modo modernizado — 99.** Todas as outras. A lista nominal completa
está em [`target_screens.md`](target_screens.md), uma seção por tela com
`Modo aplicado: modernizado`, e em
[`../screens/inventory.json`](../screens/inventory.json).

> Nenhuma das duas listas está vazia, logo `EC-12` não dispara.

### ⚠️ As 14 telas em literal estão bloqueadas por RF-13, e isso é de propósito

A regra absoluta do SKILL: *"Em modo literal com plataforma alvo gráfica sem
screenshot do legado: bloqueia até obter screenshot ou aceite explícito de
modernizado."* As 14 não têm captura. O que foi feito, em vez de contornar a
regra ou de entregar 14 seções vazias:

1. A spec das 14 **foi gerada**, e ela não contém nenhuma afirmação de pixel.
   O que ela carrega é o contrato de DOM e de nome de campo, **extraído do
   código**, com `arquivo:linha` em cada item. Zero adivinhação visual.
2. Cada uma das 14 carrega a deviation **`DEV-002`**, com aprovação
   `pendente`. E deviation pendente **bloqueia o handoff ao Inspector** — que é
   exatamente o efeito que RF-13 pede, pelo mecanismo que o próprio SKILL
   define para isso.
3. Para **destravar**, basta uma das duas coisas, por tela ou para o conjunto:
   capturar a tela do legado rodando, ou aceitar explicitamente modernizado
   para ela. As duas respostas estão previstas em `DEV-002`.

O efeito prático: o codificador pode começar pelas 99 telas modernizadas, que
não têm bloqueio nenhum, enquanto as 14 esperam captura ou aceite.

---

## Implicações pendentes para a Fase 2

| Etapa | Implicação | Como honrar |
|---|---|---|
| Geração de `target_screens.md` | o par não tem adapter: `EC-01` | formato `raw-prose` com as 6 seções obrigatórias; `DEV-001` referenciada em todas as 113 seções |
| Geração de `target_screens.md` | 14 telas em literal sem captura | spec gerada **sem afirmação de pixel**, só contrato de DOM e de campo com `arquivo:linha`; `DEV-002` pendente em cada |
| Captura de golden files | não há oráculo executável nesta árvore | `manifest.yaml` com `oracleAvailable: false` e, por tela, o comando sugerido para quem tiver a instalação; `present: false` em 113 de 113 |
| Captura de golden files | o alvo emite HTML, não pixel | formato de golden file `html-css-snapshot`, não `.png`; a captura determinística é viável sem fonte nem relógio — ver `manifest.yaml` § `normalizationRules` |
| Tokens do design-system | `tokens.md` § 13 lista *custom properties* consumidas em dezenas de regras e **nunca definidas** nesta árvore | criar `tokens-derived.md` com os valores de *fallback* escritos no próprio CSS, marcar `DEV-003` |
| Tokens do design-system | o front-end usa presets de `theme.json`, não os `$grid-unit-*` do painel | duas famílias de token declaradas por grupo de tela em `inventory.json` § `tokens` |
| Conteúdo textual | preservar literal salvo aprovação explícita de revisão linguística | 2.984 strings copiadas verbatim; **nenhuma revisão linguística foi aprovada** nesta decisão, logo `diff` de string tem de ser zero |
| Conteúdo textual | tudo passa por `__()`, sem `.po` na árvore | referências `{{i18n.<msgid>}}`, com o `msgid` inglês integral como chave — `EC-05` |
| Mensagens de erro | 152 `wp_die()` convergem numa tela só | `SCR-112` especificada como superfície compartilhada, e cada tela que chama `wp_die()` transita para ela |

## Implicações para o Inspector

- **Estratégia de paridade**:
  - **Modo literal (14 telas)** → comparação do **HTML emitido** contra o
    oráculo, não comparação de pixel. O contrato é o nome do campo, o `id` do
    ponto de montagem e a estrutura que o cliente externo consulta. Golden
    files no formato `html-css-snapshot`, quando houver oráculo.
  - **Modo modernizado (99 telas)** → contrato semântico: evento, transição,
    conteúdo textual e os 4 estados (`idle`, `loading`, `error`, `success`).
    Sem comparação byte-a-byte.
  - **Modo híbrido** → estratégia mista, declarada por tela em
    `parity_specs.md`, lendo o campo `Modo aplicado` de cada seção de
    [`target_screens.md`](target_screens.md).
- **O handoff está bloqueado.** Todas as deviations deste passo estão
  `pendente`. Ver [`screen_deviation_log.md`](screen_deviation_log.md) § *Resumo*.
- **Dois números que o Inspector precisa saber antes de escrever teste**:
  há **3** capturas para 113 telas, e **zero** arquivos de teste na árvore
  (`state.json`, `tech_stack`) — não existe rede de segurança executável para
  comparar contra.

## O que muda se a resposta for outra

| Resposta | O que se refaz | O que **não** muda |
|---|---|---|
| **híbrido** (ratifica) | nada; a premissa vira decisão e `decidedBy` deixa de ser `null` | tudo |
| **modernizado** para as 113 | as 14 seções da família A/B/C passam a `Modo aplicado: modernizado` e ganham a tabela de 4 estados; `DEV-002` é **aprovada** como aceite explícito de modernizado, o que destrava RF-13 | o inventário, as 99 seções, o `manifest.yaml`, `DEV-001` e `DEV-003` |
| **literal** para as 113 | nada pode ser gerado antes de captura: RF-13 bloqueia 113 de 113. Seria necessário capturar primeiro | o inventário |
| **outro** (ex.: descartar as 4 telas de link — LACUNA-ST-02) | as 4 seções saem de `target_screens.md` e o inventário cai a 109 | o resto |
| alvo é **SPA** (LACUNA-ST-01) | o par passa a `php-server-rendered → web-spa`, que existe na v1: adapter `php__spa`, formato `route-component`. `EC-01` e `DEV-001` deixam de existir; as 113 seções são regeradas com `--regenerate-phase=generation` | o inventário e as duas listas do modo híbrido |

## Notas

1. **Revisão linguística não foi aprovada.** O princípio 2 do SKILL preserva o
   texto literal por padrão, e nada nesta decisão abre exceção. Consequência
   concreta: as telas em inglês **continuam em inglês** no alvo. As 2.984
   strings são `msgid` em inglês que passam por `__()`; traduzi-las na spec
   seria inventar um `msgid` que o catálogo não tem e quebrar toda chamada de
   `__()` do alvo. O idioma deste **documento** é português porque ele é
   especificação; o idioma do **produto** é o do legado.

2. **O editor em bloco não tem lado cliente nesta árvore.** `wp-includes/js/dist/`
   não existe. Isso tem efeito observável em pelo menos uma tela, e foi
   medido, não suposto: `wp-admin/font-library.php:22` testa
   `function_exists( 'wp_font_library_wp_admin_render_page' )`, a função **não
   existe em nenhum arquivo da árvore**, e a tela sempre responde o `wp_die`
   de 503 — *"Font Library is not available."* (`wp-admin/font-library.php:24`).
   A tela `biblioteca-de-fontes` está no inventário porque a rota existe, está
   em **modernizado** porque não há DOM funcional a preservar, e tem deviation
   própria (`DEV-004`). As telas da família A não sofrem o mesmo destino: elas
   montam o cliente por `wp_enqueue_script`, que falha em silêncio.

3. **Nenhuma tela admite modo literal por exigência regulatória.** As 4 telas
   de privacidade (`export-personal-data.php`, `erase-personal-data.php`,
   `options-privacy.php`, `privacy-policy-guide.php`) tocam domínio regulado
   (LGPD/GDPR, conforme [`target_architecture.md`](target_architecture.md)
   § *BC-06*), mas o que a regulação exige é o **comportamento** — prazo,
   confirmação, registro — não a marcação. Ficaram em modernizado. Se alguém
   quiser o contrário, é resposta "outro" na pergunta acima.

4. **`EC-04` (renderização customizada) não dispara.** Nenhuma das 113 telas
   usa Canvas ou OpenGL. O editor de imagem (`SCR-049`) recorta no servidor e
   devolve HTML; o recorte interativo é jQuery sobre `<img>`.

5. **`EC-15` (encoding heterogêneo) não dispara nas telas.** Os arquivos de
   tela lidos nesta etapa abriram em UTF-8 sem erro de decodificação.

6. **A tela mais consequente do sistema não tem rota.** `SCR-112`
   (`wp-includes/functions.php:3907`) é onde caem as **152** chamadas
   `wp_die()` das 113 telas. Ela não está em
   [`../ui/inventory.md`](../ui/inventory.md), não tem URL própria, e é a
   superfície de erro que o usuário mais vê. Quem portar tela por tela, lendo
   a lista de rotas, não a escreve — e aí 152 pontos de falha ficam sem
   destino.
