---
schemaVersion: 1
generatedAt: 2026-10-06T00:00:00-03:00
reversa:
  version: "1.0.0"
kind: target_screens
producedBy: screen-translator
mode: hybrid
sourcePlatform: php-server-rendered
targetPlatform: node-ts-server-rendered
adapter: null   # EC-01: par nao suportado na v1
adapterPairError: EC-01
specKind: raw-prose
screenCount: 113
screensLiteral: 14
screensModernized: 99
handoffToInspectorBlocked: true
hash: "sha256:ca9a008327729c64553663155a09dd62ae7a9904aba8749ba0c19af977898df2"
---

# Target Screens

> Especificação executável de cada tela do sistema novo, derivada do legado segundo o modo aprovado em [`screen_modernization_decision.md`](screen_modernization_decision.md). Conteúdo textual preservado literalmente, salvo aprovação explícita de revisão linguística — que **não** foi dada.
> Leitura primária para o codificador. Cada seção é um contrato.

> ⚠️ **O modo não foi aprovado por humano.** `mode: hybrid` é a recomendação do agente, adotada como premissa reversível porque a instrução desta etapa manda rodar sem pedir confirmação. Ler [`screen_modernization_decision.md`](screen_modernization_decision.md) § *Decisão* antes de codificar, e em especial § *O que muda se a resposta for outra*.

> ⚠️ **O handoff ao Inspector está bloqueado.** As 5 deviations deste passo estão `pendente`. `DEV-002` é o bloqueio de RF-13 nas 14 telas em modo literal.

## Resumo

- **Modo aplicado**: híbrido — **14** telas em literal, **99** em modernizado
- **Telas geradas**: **113**
- **Adapter**: nenhum. O par `php-server-rendered → node-ts-server-rendered` não está em `references/adapter-pairs.md`; `EC-01` registrado, formato de spec `raw-prose`
- **Formato de spec**: `raw-prose`, com as seis seções obrigatórias por tela — identidade, layout, campos, mensagens, eventos, validações
- **Tokens consumidos**: [`../design-system/tokens.md`](../design-system/tokens.md) e [`../design-system/tokens-derived.md`](../design-system/tokens-derived.md) — 12 tokens derivados, criados nesta etapa
- **Golden files**: **0** emitidos, 113 pendentes. Não há oráculo executável nesta árvore; o manifesto com o comando sugerido por tela está em [`../screens/golden/manifest.yaml`](../screens/golden/manifest.yaml)
- **Deviations registradas**: **5**, todas `pendente` ([`screen_deviation_log.md`](screen_deviation_log.md))
- **Inventário**: [`../screens/inventory.json`](../screens/inventory.json)

### Como ler uma seção

Cada tela traz, na ordem: identidade e rota, modo aplicado, capacidade exigida, tokens, interpolações e transições; depois o bloco `spec.*`; depois as seis seções de `raw-prose`; depois as deviations que a afetam; depois os estados.

**Todo número e toda string das seções abaixo saiu de um casamento de regex sobre o arquivo legado, com a linha registrada.** Nada foi escrito de memória. Reproduzir: [`extrair.py`](../../.reversa/work/reversa-screen-translator/extrair.py) e [`render.py`](../../.reversa/work/reversa-screen-translator/render.py).

**Sobre o idioma:** este documento é especificação e está em português. As strings das seções § 4 estão em inglês porque são o `msgid` do catálogo do legado, e traduzi-las aqui quebraria toda chamada de `__()` do alvo. Nenhuma revisão linguística foi aprovada.

**O que não é o sistema analisado:** `.claude/` e `.reversa/` são o ferramental deste processo e não entraram em contagem alguma.

### Índice por grupo

- **Entradas publicas** — 11 telas, 4 em literal: [`login`](#tela-login), [`recuperacao-de-senha-pedido`](#tela-recuperacao-de-senha-pedido), [`recuperacao-de-senha-redefinicao`](#tela-recuperacao-de-senha-redefinicao), [`confirmacao-de-saida-do-sistema`](#tela-confirmacao-de-saida-do-sistema), [`registro-de-usuario`](#tela-registro-de-usuario), [`aviso-de-e-mail-enviado`](#tela-aviso-de-e-mail-enviado), [`confirmacao-de-acao-por-chave`](#tela-confirmacao-de-acao-por-chave), [`confirmacao-de-e-mail-de-administracao`](#tela-confirmacao-de-e-mail-de-administracao), [`cadastro-de-site-ou-usuario-na-rede`](#tela-cadastro-de-site-ou-usuario-na-rede), [`ativacao-de-conta-na-rede`](#tela-ativacao-de-conta-na-rede), [`formulario-de-senha-de-conteudo`](#tela-formulario-de-senha-de-conteudo)
- **Front-end** — 20 telas, 0 em literal: [`front-end-home-twentytwentyfive`](#tela-front-end-home-twentytwentyfive), [`front-end-home-twentytwentyfour`](#tela-front-end-home-twentytwentyfour), [`front-end-home-twentytwentythree`](#tela-front-end-home-twentytwentythree), [`front-end-fallback-index`](#tela-front-end-fallback-index), [`front-end-post-individual`](#tela-front-end-post-individual), [`front-end-pagina`](#tela-front-end-pagina), [`front-end-arquivo`](#tela-front-end-arquivo), [`front-end-busca`](#tela-front-end-busca), [`front-end-404`](#tela-front-end-404), [`front-end-pagina-sem-titulo`](#tela-front-end-pagina-sem-titulo), [`front-end-pagina-larga`](#tela-front-end-pagina-larga), [`front-end-pagina-com-barra-lateral`](#tela-front-end-pagina-com-barra-lateral), [`front-end-post-com-barra-lateral`](#tela-front-end-post-com-barra-lateral), [`front-end-tela-em-branco`](#tela-front-end-tela-em-branco), [`front-end-blog-alternativo`](#tela-front-end-blog-alternativo), [`front-end-fragmento-cabecalho`](#tela-front-end-fragmento-cabecalho), [`front-end-fragmento-rodape`](#tela-front-end-fragmento-rodape), [`front-end-fragmento-barra-lateral`](#tela-front-end-fragmento-barra-lateral), [`front-end-fragmento-meta-do-post`](#tela-front-end-fragmento-meta-do-post), [`front-end-fragmento-comentarios`](#tela-front-end-fragmento-comentarios)
- **Instalacao** — 4 telas, 0 em literal: [`configuracao-do-wp-config`](#tela-configuracao-do-wp-config), [`instalador`](#tela-instalador), [`atualizacao-do-banco`](#tela-atualizacao-do-banco), [`reparo-do-banco`](#tela-reparo-do-banco)
- **Painel** — 64 telas, 10 em literal: [`painel-inicial`](#tela-painel-inicial), [`meus-sites`](#tela-meus-sites), [`atualizacoes`](#tela-atualizacoes), [`lista-de-conteudo`](#tela-lista-de-conteudo), [`editor-de-blocos-novo`](#tela-editor-de-blocos-novo), [`editor-de-blocos-edicao`](#tela-editor-de-blocos-edicao), [`editor-classico`](#tela-editor-classico), [`comparacao-de-revisoes`](#tela-comparacao-de-revisoes), [`lista-de-termos`](#tela-lista-de-termos), [`edicao-de-termo`](#tela-edicao-de-termo), [`biblioteca-de-midia`](#tela-biblioteca-de-midia), [`envio-de-midia`](#tela-envio-de-midia), [`modal-de-selecao-de-midia`](#tela-modal-de-selecao-de-midia), [`editor-de-imagem`](#tela-editor-de-imagem), [`lista-de-links`](#tela-lista-de-links), [`cadastro-de-link`](#tela-cadastro-de-link), [`importacao-de-opml`](#tela-importacao-de-opml), [`fila-de-comentarios`](#tela-fila-de-comentarios), [`edicao-de-comentario`](#tela-edicao-de-comentario), [`lista-de-temas`](#tela-lista-de-temas), [`editor-do-site`](#tela-editor-do-site), [`biblioteca-de-fontes`](#tela-biblioteca-de-fontes), [`personalizador`](#tela-personalizador), [`menus-de-navegacao`](#tela-menus-de-navegacao), [`cabecalho-personalizado`](#tela-cabecalho-personalizado), [`fundo-personalizado`](#tela-fundo-personalizado), [`widgets-em-blocos`](#tela-widgets-em-blocos), [`widgets-classico`](#tela-widgets-classico), [`instalar-tema`](#tela-instalar-tema), [`editor-de-arquivo-de-tema`](#tela-editor-de-arquivo-de-tema), [`lista-de-extensoes`](#tela-lista-de-extensoes), [`instalar-extensao`](#tela-instalar-extensao), [`editor-de-arquivo-de-extensao`](#tela-editor-de-arquivo-de-extensao), [`progresso-de-instalacao`](#tela-progresso-de-instalacao), [`lista-de-usuarios`](#tela-lista-de-usuarios), [`cadastro-de-usuario`](#tela-cadastro-de-usuario), [`perfil-proprio`](#tela-perfil-proprio), [`edicao-de-usuario`](#tela-edicao-de-usuario), [`autorizar-aplicacao`](#tela-autorizar-aplicacao), [`ferramentas-disponiveis`](#tela-ferramentas-disponiveis), [`importar`](#tela-importar), [`exportar`](#tela-exportar), [`saude-do-site`](#tela-saude-do-site), [`saude-do-site-informacoes`](#tela-saude-do-site-informacoes), [`exportar-dados-pessoais`](#tela-exportar-dados-pessoais), [`apagar-dados-pessoais`](#tela-apagar-dados-pessoais), [`apagar-site-da-rede`](#tela-apagar-site-da-rede), [`instalacao-de-rede`](#tela-instalacao-de-rede), [`press-this`](#tela-press-this), [`opcoes-gerais`](#tela-opcoes-gerais), [`opcoes-de-conectores`](#tela-opcoes-de-conectores), [`opcoes-de-escrita`](#tela-opcoes-de-escrita), [`opcoes-de-leitura`](#tela-opcoes-de-leitura), [`opcoes-de-discussao`](#tela-opcoes-de-discussao), [`opcoes-de-midia`](#tela-opcoes-de-midia), [`opcoes-de-links-permanentes`](#tela-opcoes-de-links-permanentes), [`opcoes-de-privacidade`](#tela-opcoes-de-privacidade), [`guia-da-politica-de-privacidade`](#tela-guia-da-politica-de-privacidade), [`gravacao-generica-de-opcoes`](#tela-gravacao-generica-de-opcoes), [`sobre-o-wordpress`](#tela-sobre-o-wordpress), [`creditos`](#tela-creditos), [`liberdades`](#tela-liberdades), [`contribuir`](#tela-contribuir), [`privacidade-do-projeto`](#tela-privacidade-do-projeto)
- **Rede** — 12 telas, 0 em literal: [`rede-painel`](#tela-rede-painel), [`rede-lista-de-sites`](#tela-rede-lista-de-sites), [`rede-site-informacoes`](#tela-rede-site-informacoes), [`rede-site-configuracoes`](#tela-rede-site-configuracoes), [`rede-site-temas`](#tela-rede-site-temas), [`rede-site-usuarios`](#tela-rede-site-usuarios), [`rede-adicionar-site`](#tela-rede-adicionar-site), [`rede-lista-de-usuarios`](#tela-rede-lista-de-usuarios), [`rede-adicionar-usuario`](#tela-rede-adicionar-usuario), [`rede-lista-de-temas`](#tela-rede-lista-de-temas), [`rede-configuracoes`](#tela-rede-configuracoes), [`rede-atualizacao`](#tela-rede-atualizacao)
- **Erro e recuperacao** — 2 telas, 0 em literal: [`tela-de-erro-generica`](#tela-tela-de-erro-generica), [`tela-de-erro-critico`](#tela-tela-de-erro-critico)
---

## Tela: login

**ID no inventário**: `SCR-001`  
**Grupo**: Entradas publicas  
**Origem**: `wp-login.php:1278`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-login.php (ou ?action=login)`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: `{{aria_describedby}}`, `{{user_login}}`, `{{redirect_to}}`, `{{printf_args}} (4 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Login

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: C: campos log, pwd, rememberme, redirect_to sao contrato de cliente externo


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-login.php:1278"
spec.route: "/wp-login.php (ou ?action=login)"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Log In" (`wp-login.php:1491`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-login.php` com 1681 linhas, faixa 1278–1681

#### 2. Layout

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-login.php` | 1514 | expressão PHP — `<?php echo esc_url( site_url( … )` | `get` |

#### 3. Campos

**8** campos distintos. O nome do campo é contrato **e, nesta tela, contrato externo** (ver o aviso de RF-13 acima): não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-login.php` | `log` | `text` | não | 1517 |
| `wp-login.php` | `pwd` | `password` | não | 1523 |
| `wp-login.php` | `rememberme` | `checkbox` | não | 1555 |
| `wp-login.php` | `wp-submit` | `submit` | não | 1568 |
| `wp-login.php` | `interim-login` | `hidden` | não | 1573 |
| `wp-login.php` | `redirect_to` | `hidden` | não | 1577 |
| `wp-login.php` | `customize-login` | `hidden` | não | 1583 |
| `wp-login.php` | `testcookie` | `hidden` | não | 1588 |

> ⚠️ **Nenhum** dos 8 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**22** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| <strong>Error:</strong> Cookies are blocked due to unexpected output. For help, please see <a href="%1$s">this documentation</a> or try the <a href="%… | `wp-login.php` | 1324 |
| https://developer.wordpress.org/advanced-administration/wordpress/cookies/ | `wp-login.php` | 1325 |
| https://wordpress.org/support/forums/ | `wp-login.php` | 1326 |
| <strong>Error:</strong> Cookies are blocked or not supported by your browser. You must <a href="%s">enable cookies</a> to use WordPress. | `wp-login.php` | 1335 |
| https://developer.wordpress.org/advanced-administration/wordpress/cookies/#enable-cookies-in-your-browser | `wp-login.php` | 1336 |
| You have logged in successfully. | `wp-login.php` | 1357 |
| Your session has expired. Please log in to continue where you left off. | `wp-login.php` | 1435 |
| You are now logged out. | `wp-login.php` | 1440 |
| <strong>Error:</strong> User registration is currently not allowed. | `wp-login.php` | 1442 |
| <strong>You have successfully updated WordPress!</strong> Please log back in to see what&#8217;s new. | `wp-login.php` | 1444 |
| Recovery Mode Initialized. Please log in to continue. | `wp-login.php` | 1446 |
| Please log in to %1$s to authorize %2$s to connect to your account. | `wp-login.php` | 1458 |
| … | `wp-login.php` | +10 strings |

#### 5. Eventos e transições

Transições por redirecionamento, **2**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$redirect_to` | `wp-login.php` | 1415 |
| `$redirect_to` | `wp-login.php` | 1419 |

#### 6. Validações

- **Obrigatoriedade no cliente**: 0 de 8 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: recuperacao-de-senha-pedido

**ID no inventário**: `SCR-002`  
**Grupo**: Entradas publicas  
**Origem**: `wp-login.php:830`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-login.php?action=lostpassword (alias: retrievepassword)`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: `{{user_login}}`, `{{redirect_to}}`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Recuperacao de senha - pedido

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-login.php:830"
spec.route: "/wp-login.php?action=lostpassword (alias: retrievepassword)"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Lost Password" (`wp-login.php:872`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-login.php` com 1681 linhas, faixa 830–931

#### 2. Layout

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-login.php` | 891 | expressão PHP — `<?php echo esc_url( network_site_url( … )` | `get` |

#### 3. Campos

**3** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-login.php` | `user_login` | `text` | não | 894 |
| `wp-login.php` | `redirect_to` | `hidden` | não | 906 |
| `wp-login.php` | `wp-submit` | `submit` | não | 908 |

> ⚠️ **Nenhum** dos 3 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**8** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| <strong>Error:</strong> Your password reset link appears to be invalid. Please request a new link below. | `wp-login.php` | 844 |
| <strong>Error:</strong> Your password reset link has expired. Please request a new link below. | `wp-login.php` | 846 |
| Lost Password | `wp-login.php` | 872 |
| Please enter your username or email address. You will receive an email message with instructions on how to reset your password. | `wp-login.php` | 874 |
| Username or Email Address | `wp-login.php` | 893 |
| Get New Password | `wp-login.php` | 908 |
| Log in | `wp-login.php` | 913 |
| Register | `wp-login.php` | 917 |

#### 5. Eventos e transições

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$redirect_to` | `wp-login.php` | 837 |

#### 6. Validações

- **Obrigatoriedade no cliente**: 0 de 3 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: recuperacao-de-senha-redefinicao

**ID no inventário**: `SCR-003`  
**Grupo**: Entradas publicas  
**Origem**: `wp-login.php:932`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-login.php?action=rp (alias: resetpass)`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: `{{rp_login}}`, `{{rp_key}}`  
**Transições de saída**: `wp-login.php?action=lostpassword&error=expiredkey`, `wp-login.php?action=lostpassword&error=invalidkey`  
**Linha no `ui/inventory.md` do Visor**: Recuperacao de senha - redefinicao

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: C: campos rp_key, pass1, pass2 sao contrato do fluxo de redefinicao


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-login.php:932"
spec.route: "/wp-login.php?action=rp (alias: resetpass)"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Password Reset" (`wp-login.php:998`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-login.php` com 1681 linhas, faixa 932–1094

#### 2. Layout

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-login.php` | 1027 | expressão PHP — `<?php echo esc_url( network_site_url( … )` | `get` |

#### 3. Campos

**5** campos distintos. O nome do campo é contrato **e, nesta tela, contrato externo** (ver o aviso de RF-13 acima): não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-login.php` | `pass1` | `password` | não | 1036 |
| `wp-login.php` | `pw_weak` | `checkbox` | não | 1044 |
| `wp-login.php` | `pass2` | `password` | não | 1051 |
| `wp-login.php` | `rp_key` | `hidden` | não | 1068 |
| `wp-login.php` | `wp-submit` | `submit` | não | 1071 |

> ⚠️ **Nenhum** dos 5 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**15** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| The password cannot be a space or all spaces. | `wp-login.php` | 976 |
| <strong>Error:</strong> The passwords do not match. | `wp-login.php` | 982 |
| Password Reset | `wp-login.php` | 998 |
| Your password has been reset. | `wp-login.php` | 1000 |
| Log in | `wp-login.php` | 1000 |
| Reset Password | `wp-login.php` | 1015 |
| Enter your new password below or generate one. | `wp-login.php` | 1017 |
| New password | `wp-login.php` | 1032 |
| Hide password | `wp-login.php` | 1038 |
| Strength indicator | `wp-login.php` | 1041 |
| Confirm use of weak password | `wp-login.php` | 1045 |
| Confirm new password | `wp-login.php` | 1050 |
| … | `wp-login.php` | +3 strings |

#### 5. Eventos e transições

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `remove_query_arg( array( 'key', 'login' ) )` | `wp-login.php` | 941 |
| `site_url( 'wp-login.php?action=lostpassword&error=expiredkey' )` | `wp-login.php` | 961 |
| `site_url( 'wp-login.php?action=lostpassword&error=invalidkey' )` | `wp-login.php` | 963 |

#### 6. Validações

- **Obrigatoriedade no cliente**: 0 de 5 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: confirmacao-de-saida-do-sistema

**ID no inventário**: `SCR-004`  
**Grupo**: Entradas publicas  
**Origem**: `wp-includes/functions.php:3727`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: renderizada por wp_nonce_ays() sobre a rota que falhou a conferência de nonce`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Logout / confirmacao

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-includes/functions.php:3727"
spec.route: "nenhuma: renderizada por wp_nonce_ays() sobre a rota que falhou a conferência de nonce"
spec.deviations: [DEV-001, DEV-003]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "An error occurred." (`wp-includes/functions.php:3729`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-includes/functions.php` com 9399 linhas, faixa 3727–3760

#### 2. Layout

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**5** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| An error occurred. | `wp-includes/functions.php` | 3729 |
| You are attempting to log out of %s | `wp-includes/functions.php` | 3735 |
| Do you really want to <a href="%s">log out</a>? | `wp-includes/functions.php` | 3745 |
| The link you followed has expired. | `wp-includes/functions.php` | 3749 |
| Please try again. | `wp-includes/functions.php` | 3759 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-003`: a folha de estilo desta tela é embutida e usa 12 valores sem token em `tokens.md`; os tokens derivados estão em [`../design-system/tokens-derived.md`](../design-system/tokens-derived.md) § 2 ([`screen_deviation_log.md`](screen_deviation_log.md#dev-003)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: registro-de-usuario

**ID no inventário**: `SCR-005`  
**Grupo**: Entradas publicas  
**Origem**: `wp-login.php:1095`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-login.php?action=register`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: `{{user_login}}`, `{{user_email}}`, `{{redirect_to}}`  
**Transições de saída**: `wp-signup.php`, `wp-login.php?registration=disabled`  
**Linha no `ui/inventory.md` do Visor**: Registro de usuario

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: C: campos user_login, user_email sao contrato de formulario de registro


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-login.php:1095"
spec.route: "/wp-login.php?action=register"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Registration Form" (`wp-login.php:1149`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-login.php` com 1681 linhas, faixa 1095–1206

#### 2. Layout

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-login.php` | 1161 | expressão PHP — `<?php echo esc_url( site_url( … )` | `get` |

#### 3. Campos

**4** campos distintos. O nome do campo é contrato **e, nesta tela, contrato externo** (ver o aviso de RF-13 acima): não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-login.php` | `user_login` | `text` | não | 1164 |
| `wp-login.php` | `user_email` | `email` | não | 1168 |
| `wp-login.php` | `redirect_to` | `hidden` | não | 1183 |
| `wp-login.php` | `wp-submit` | `submit` | não | 1185 |

> ⚠️ **Nenhum** dos 4 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**8** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Registration Form | `wp-login.php` | 1149 |
| Register For This Site | `wp-login.php` | 1151 |
| Username | `wp-login.php` | 1163 |
| Email | `wp-login.php` | 1167 |
| Registration confirmation will be emailed to you. | `wp-login.php` | 1181 |
| Register | `wp-login.php` | 1185 |
| Log in | `wp-login.php` | 1190 |
| Lost your password? | `wp-login.php` | 1195 |

#### 5. Eventos e transições

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `apply_filters( 'wp_signup_location', network_site_url( 'wp-signup.php' ) )` | `wp-login.php` | 1104 |
| `site_url( 'wp-login.php?registration=disabled' )` | `wp-login.php` | 1109 |
| `$redirect_to` | `wp-login.php` | 1129 |

#### 6. Validações

- **Obrigatoriedade no cliente**: 0 de 4 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: aviso-de-e-mail-enviado

**ID no inventário**: `SCR-006`  
**Grupo**: Entradas publicas  
**Origem**: `wp-login.php:1207`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-login.php?action=checkemail`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-login.php:1207"
spec.route: "/wp-login.php?action=checkemail"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Check your email" (`wp-login.php:1236`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-login.php` com 1681 linhas, faixa 1207–1239

#### 2. Layout

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**3** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Check your email for the confirmation link, then visit the <a href="%s">login page</a>. | `wp-login.php` | 1216 |
| Registration complete. Please check your email, then visit the <a href="%s">login page</a>. | `wp-login.php` | 1226 |
| Check your email | `wp-login.php` | 1236 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: confirmacao-de-acao-por-chave

**ID no inventário**: `SCR-007`  
**Grupo**: Entradas publicas  
**Origem**: `wp-login.php:1240`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-login.php?action=confirmaction`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-login.php:1240"
spec.route: "/wp-login.php?action=confirmaction"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "User action confirmed." (`wp-login.php:1274`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-login.php` com 1681 linhas, faixa 1240–1277

#### 2. Layout

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**3** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Missing request ID. | `wp-login.php` | 1242 |
| Missing confirm key. | `wp-login.php` | 1246 |
| User action confirmed. | `wp-login.php` | 1274 |

Mensagens de recusa (`wp_die`), **2** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Missing request ID." (`wp-login.php:1242`)
- "Missing confirm key." (`wp-login.php:1246`)

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 2 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Recusa**: 2 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: confirmacao-de-e-mail-de-administracao

**ID no inventário**: `SCR-008`  
**Grupo**: Entradas publicas  
**Origem**: `wp-login.php:581`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-login.php?action=confirm_admin_email`  
**Tela crítica?**: não  
**Capacidade exigida**: `manage_options`  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: `{{redirect_to}}`, `{{change_link}}`, `{{remind_me_link}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: `wp-login.php`  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-login.php:581"
spec.route: "/wp-login.php?action=confirm_admin_email"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Confirm your administration email" (`wp-login.php:656`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-login.php` com 1681 linhas, faixa 581–759

#### 2. Layout

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-login.php` | 670 | expressão PHP — `<?php echo esc_url( site_url( … )` | `get` |

#### 3. Campos

**2** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-login.php` | `redirect_to` | `hidden` | não | 682 |
| `wp-login.php` | `correct-admin-email` | `submit` | não | 733 |

> ⚠️ **Nenhum** dos 2 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**11** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Confirm your administration email | `wp-login.php` | 656 |
| Administration email verification | `wp-login.php` | 685 |
| Please verify that the <strong>administration email</strong> for this website is still correct. | `wp-login.php` | 688 |
| https://wordpress.org/documentation/article/settings-general-screen/#email-address | `wp-login.php` | 692 |
| (opens in a new tab) | `wp-login.php` | 697 |
| Why is this important? | `wp-login.php` | 703 |
| Current administration email: %s | `wp-login.php` | 714 |
| This email may be different from your personal email address. | `wp-login.php` | 721 |
| Update | `wp-login.php` | 732 |
| The email is correct | `wp-login.php` | 733 |
| Remind me later | `wp-login.php` | 749 |

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `confirm_admin_email`, `confirm_admin_email`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **6**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `wp_login_url()` | `wp-login.php` | 588 |
| `$redirect_to` | `wp-login.php` | 601 |
| `wp_login_url()` | `wp-login.php` | 618 |
| `$redirect_to` | `wp-login.php` | 627 |
| `wp_login_url()` | `wp-login.php` | 633 |
| `$redirect_to` | `wp-login.php` | 652 |

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-login.php:598`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 2 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: cadastro-de-site-ou-usuario-na-rede

**ID no inventário**: `SCR-009`  
**Grupo**: Entradas publicas  
**Origem**: `wp-signup.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-signup.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `manage_network`  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: `{{blog_public_on_checked}}`, `{{blog_public_off_checked}}`, `{{user_name}}`, `{{errmsg_username_aria}}`, `{{user_email}}`, `{{errmsg_email_aria}}`, `{{printf_args}} (14 mensagens com placeholder posicional)`  
**Transições de saída**: `wp-signup.php`  
**Linha no `ui/inventory.md` do Visor**: Cadastro de site/usuario (multisite)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-signup.php"
spec.route: "/wp-signup.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `wizard-step`
- **Tamanho do arquivo de origem**: `wp-signup.php` com 1064 linhas

#### 2. Layout

Formulários desta tela: **3**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-signup.php` | 411 | `wp-signup.php` | `post` |
| `wp-signup.php` | 638 | `wp-signup.php` | `post` |
| `wp-signup.php` | 781 | `wp-signup.php` | `post` |

#### 3. Campos

**8** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-signup.php` | `blogname` | `text` | sim | 144 |
| `wp-signup.php` | `blog_title` | `text` | sim | 175 |
| `wp-signup.php` | `blog_public` | `radio` | não | 230 |
| `wp-signup.php` | `user_name` | `text` | não | 292 |
| `wp-signup.php` | `user_email` | `email` | não | 305 |
| `wp-signup.php` | `stage` | `hidden` | não | 412 |
| `wp-signup.php` | `submit` | `submit` | não | 425 |
| `wp-signup.php` | `signup_for` | `hidden` | não | 647 |

#### 4. Mensagens literais

**55** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Site Name (subdirectory only) | `wp-signup.php` | 131 |
| Site Domain (subdomain only) | `wp-signup.php` | 133 |
| sitename | `wp-signup.php` | 152 |
| domain | `wp-signup.php` | 154 |
| Your address will be %s. | `wp-signup.php` | 160 |
| Must be at least 4 characters, letters and numbers only. It cannot be changed, so choose carefully! | `wp-signup.php` | 161 |
| Site Title | `wp-signup.php` | 167 |
| Site Language | `wp-signup.php` | 185 |
| Privacy: | `wp-signup.php` | 225 |
| Allow search engines to index this site. | `wp-signup.php` | 226 |
| Yes | `wp-signup.php` | 231 |
| Username | `wp-signup.php` | 284 |
| … | `wp-signup.php` | +43 strings |

#### 5. Eventos e transições

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_home_url()` | `wp-signup.php` | 20 |
| `wp_registration_url()` | `wp-signup.php` | 40 |
| `network_site_url( 'wp-signup.php' )` | `wp-signup.php` | 45 |

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-signup.php:948`.
- **Obrigatoriedade no cliente**: 2 de 8 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | passo corrente do assistente |
| Loading | operação assíncrona em curso | indicador de progresso entre passos |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | avanço para o passo seguinte |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: ativacao-de-conta-na-rede

**ID no inventário**: `SCR-010`  
**Grupo**: Entradas publicas  
**Origem**: `wp-activate.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-activate.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: `{{result}}`, `{{user}}`, `{{printf_args}} (4 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Ativacao de conta (multisite)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-activate.php"
spec.route: "/wp-activate.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-activate.php` com 221 linhas

#### 2. Layout

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-activate.php` | 129 | expressão PHP — `<?php echo esc_url( network_site_url( $blog_details- … )` | `post` |

#### 3. Campos

**2** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-activate.php` | `key` | `text` | não | 132 |
| `wp-activate.php` | `Submit` | `submit` | não | 135 |

> ⚠️ **Nenhum** dos 2 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**12** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| A key value mismatch has been detected. Please follow the link provided in your activation email. | `wp-activate.php` | 30 |
| An error occurred during the activation | `wp-activate.php` | 30 |
| Activation Key Required | `wp-activate.php` | 128 |
| Activation Key: | `wp-activate.php` | 131 |
| Activate | `wp-activate.php` | 135 |
| Your account is now active! | `wp-activate.php` | 145 |
| Your account has been activated. You may now <a href="%1$s">log in</a> to the site using your chosen username of &#8220;%2$s&#8221;. Please check your… | `wp-activate.php` | 151 |
| Your site at %1$s is active. You may now log in to your site using your chosen username of &#8220;%2$s&#8221;. Please check your email inbox at %3$s f… | `wp-activate.php` | 162 |
| Username: | `wp-activate.php` | 185 |
| Password: | `wp-activate.php` | 186 |
| Your account is now activated. <a href="%1$s">View your site</a> or <a href="%2$s">Log in</a> | `wp-activate.php` | 198 |
| Your account is now activated. <a href="%1$s">Log in</a> or go back to the <a href="%2$s">homepage</a>. | `wp-activate.php` | 206 |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "A key value mismatch has been detected. Please follow the link provided in your activation email." (`wp-activate.php:30`)

#### 5. Eventos e transições

Transições por redirecionamento, **2**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `wp_registration_url()` | `wp-activate.php` | 17 |
| `$redirect_url` | `wp-activate.php` | 42 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Obrigatoriedade no cliente**: 0 de 2 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: formulario-de-senha-de-conteudo

**ID no inventário**: `SCR-011`  
**Grupo**: Entradas publicas  
**Origem**: `wp-includes/post-template.php:1779`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: o formulário sai de dentro do conteúdo, por get_the_password_form(); o POST vai para /wp-login.php?action=postpass`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$input-border-color`, `$button-height-default`, `$alert-red`, `$alert-red-bg`, `$font-size-m`, `$grid-unit-20`, `$radius-s`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: C: campo post_password embutido pelo tema, de dentro do conteudo


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-includes/post-template.php:1779"
spec.route: "nenhuma: o formulário sai de dentro do conteúdo, por get_the_password_form(); o POST vai para /wp-login.php?action=postpass"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-includes/post-template.php` com 2102 linhas, faixa 1779–1848

#### 2. Layout

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-includes/post-template.php` | 1826 | *(vazio: posta na própria URL)* | `post` |

#### 3. Campos

**3** campos distintos. O nome do campo é contrato **e, nesta tela, contrato externo** (ver o aviso de RF-13 acima): não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-includes/post-template.php` | `redirect_to` | `hidden` | não | 1807 |
| `wp-includes/post-template.php` | `post_password` | `password` | sim | 1828 |
| `wp-includes/post-template.php` | `Submit` | `submit` | não | 1828 |

#### 4. Mensagens literais

**3** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Invalid password. | `wp-includes/post-template.php` | 1799 |
| This content is password-protected. To view it, please enter the password below. | `wp-includes/post-template.php` | 1827 |
| Password: | `wp-includes/post-template.php` | 1828 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- **Obrigatoriedade no cliente**: 1 de 3 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: front-end-home-twentytwentyfive

**ID no inventário**: `SCR-012`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/templates/home.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/home.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: T-01

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/templates/home.html"
spec.route: "nenhuma: templates/home.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/templates/home.html` com 11 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:pattern`

Fragmentos de template invocados: `header`, `footer`.

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfive/hidden-blog-heading`
- `twentytwentyfive/template-query-loop`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-home-twentytwentyfour

**ID no inventário**: `SCR-013`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfour/templates/home.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/home.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: T-02

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfour/templates/home.html"
spec.route: "nenhuma: templates/home.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfour/templates/home.html` com 10 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:pattern`

Fragmentos de template invocados: `header`, `footer`.

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfour/page-home-business`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-home-twentytwentythree

**ID no inventário**: `SCR-014`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentythree/templates/home.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/home.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: T-03

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentythree/templates/home.html"
spec.route: "nenhuma: templates/home.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentythree/templates/home.html` com 36 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:pattern`
- `wp:query`
- `wp:post-template`
- `wp:post-featured-image`
- `wp:post-title`
- `wp:post-excerpt`
- `wp:post-date`
- `wp:spacer`
- `wp:query-pagination`
- `wp:query-pagination-previous`
- `wp:query-pagination-next`

Fragmentos de template invocados: `header`, `footer`.

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentythree/hidden-heading`
- `twentytwentythree/cta`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-fallback-index

**ID no inventário**: `SCR-015`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/templates/index.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/index.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/templates/index.html"
spec.route: "nenhuma: templates/index.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/templates/index.html` com 11 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:pattern`

Fragmentos de template invocados: `header`, `footer`.

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfive/hidden-blog-heading`
- `twentytwentyfive/template-query-loop`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-post-individual

**ID no inventário**: `SCR-016`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/templates/single.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/single.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Front-end: post individual

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/templates/single.html"
spec.route: "nenhuma: templates/single.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `detail`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/templates/single.html` com 26 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:post-title`
- `wp:post-featured-image`
- `wp:pattern`
- `wp:post-content`
- `wp:post-terms`

Fragmentos de template invocados: `header`, `footer`.

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfive/hidden-written-by`
- `twentytwentyfive/post-navigation`
- `twentytwentyfive/comments`
- `twentytwentyfive/more-posts`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | o item carregado, somente leitura ou com ação |
| Loading | operação assíncrona em curso | esqueleto do item enquanto carrega |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-pagina

**ID no inventário**: `SCR-017`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/templates/page.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/page.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Front-end: pagina

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/templates/page.html"
spec.route: "nenhuma: templates/page.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `detail`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/templates/page.html` com 16 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:post-featured-image`
- `wp:post-title`
- `wp:post-content`

Fragmentos de template invocados: `header`, `footer`.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | o item carregado, somente leitura ou com ação |
| Loading | operação assíncrona em curso | esqueleto do item enquanto carrega |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-arquivo

**ID no inventário**: `SCR-018`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/templates/archive.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/archive.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Front-end: arquivo

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/templates/archive.html"
spec.route: "nenhuma: templates/archive.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/templates/archive.html` com 12 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:query-title`
- `wp:term-description`
- `wp:pattern`

Fragmentos de template invocados: `header`, `footer`.

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfive/template-query-loop`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-busca

**ID no inventário**: `SCR-019`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/templates/search.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/search.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Front-end: busca

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/templates/search.html"
spec.route: "nenhuma: templates/search.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/templates/search.html` com 13 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:query-title`
- `wp:pattern`

Fragmentos de template invocados: `header`, `footer`.

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfive/hidden-search`
- `twentytwentyfive/template-query-loop`
- `twentytwentyfive/more-posts`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-404

**ID no inventário**: `SCR-020`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/templates/404.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/404.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Front-end: 404

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/templates/404.html"
spec.route: "nenhuma: templates/404.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/templates/404.html` com 10 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:pattern`

Fragmentos de template invocados: `header`, `footer`.

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfive/hidden-404`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-pagina-sem-titulo

**ID no inventário**: `SCR-021`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/templates/page-no-title.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/page-no-title.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/templates/page-no-title.html"
spec.route: "nenhuma: templates/page-no-title.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `detail`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/templates/page-no-title.html` com 10 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:post-content`

Fragmentos de template invocados: `header`, `footer`.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | o item carregado, somente leitura ou com ação |
| Loading | operação assíncrona em curso | esqueleto do item enquanto carrega |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-pagina-larga

**ID no inventário**: `SCR-022`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfour/templates/page-wide.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/page-wide.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfour/templates/page-wide.html"
spec.route: "nenhuma: templates/page-wide.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `detail`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfour/templates/page-wide.html` com 34 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:post-featured-image`
- `wp:columns`
- `wp:column`
- `wp:post-title`
- `wp:post-content`

Fragmentos de template invocados: `header`, `footer`.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | o item carregado, somente leitura ou com ação |
| Loading | operação assíncrona em curso | esqueleto do item enquanto carrega |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-pagina-com-barra-lateral

**ID no inventário**: `SCR-023`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfour/templates/page-with-sidebar.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/page-with-sidebar.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfour/templates/page-with-sidebar.html"
spec.route: "nenhuma: templates/page-with-sidebar.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `detail`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfour/templates/page-with-sidebar.html` com 55 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:columns`
- `wp:column`
- `wp:post-title`
- `wp:spacer`
- `wp:post-featured-image`
- `wp:post-content`

Fragmentos de template invocados: `header`, `sidebar`, `footer`.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | o item carregado, somente leitura ou com ação |
| Loading | operação assíncrona em curso | esqueleto do item enquanto carrega |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-post-com-barra-lateral

**ID no inventário**: `SCR-024`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfour/templates/single-with-sidebar.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/single-with-sidebar.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfour/templates/single-with-sidebar.html"
spec.route: "nenhuma: templates/single-with-sidebar.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `detail`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfour/templates/single-with-sidebar.html` com 62 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:columns`
- `wp:column`
- `wp:post-featured-image`
- `wp:post-title`
- `wp:spacer`
- `wp:post-content`
- `wp:post-terms`
- `wp:pattern`

Fragmentos de template invocados: `header`, `post-meta`, `sidebar`, `footer`.

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfour/hidden-comments`
- `twentytwentyfour/hidden-post-navigation`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | o item carregado, somente leitura ou com ação |
| Loading | operação assíncrona em curso | esqueleto do item enquanto carrega |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-tela-em-branco

**ID no inventário**: `SCR-025`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentythree/templates/blank.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/blank.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentythree/templates/blank.html"
spec.route: "nenhuma: templates/blank.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentythree/templates/blank.html` com 2 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:post-content`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-blog-alternativo

**ID no inventário**: `SCR-026`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentythree/templates/blog-alternative.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: templates/blog-alternative.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentythree/templates/blog-alternative.html"
spec.route: "nenhuma: templates/blog-alternative.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentythree/templates/blog-alternative.html` com 30 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:template-part`
- `wp:group`
- `wp:query`
- `wp:post-template`
- `wp:columns`
- `wp:column`
- `wp:post-date`
- `wp:post-title`

Fragmentos de template invocados: `header`, `footer`.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-fragmento-cabecalho

**ID no inventário**: `SCR-027`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/parts/header.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: parts/header.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/parts/header.html"
spec.route: "nenhuma: parts/header.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `raw`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/parts/header.html` com 2 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:pattern`

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfive/header`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | fragmento montado no lugar que o template o invoca |
| Loading | operação assíncrona em curso | não se aplica: o fragmento não tem estado próprio |
| Error | falha na operação ou dado inválido | não se aplica |
| Success | operação concluída | não se aplica |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-fragmento-rodape

**ID no inventário**: `SCR-028`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/parts/footer.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: parts/footer.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Front-end: rodape

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/parts/footer.html"
spec.route: "nenhuma: parts/footer.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `raw`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/parts/footer.html` com 2 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:pattern`

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfive/footer`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | fragmento montado no lugar que o template o invoca |
| Loading | operação assíncrona em curso | não se aplica: o fragmento não tem estado próprio |
| Error | falha na operação ou dado inválido | não se aplica |
| Success | operação concluída | não se aplica |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-fragmento-barra-lateral

**ID no inventário**: `SCR-029`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfive/parts/sidebar.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: parts/sidebar.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfive/parts/sidebar.html"
spec.route: "nenhuma: parts/sidebar.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `raw`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfive/parts/sidebar.html` com 2 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:pattern`

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfive/hidden-sidebar`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | fragmento montado no lugar que o template o invoca |
| Loading | operação assíncrona em curso | não se aplica: o fragmento não tem estado próprio |
| Error | falha na operação ou dado inválido | não se aplica |
| Success | operação concluída | não se aplica |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-fragmento-meta-do-post

**ID no inventário**: `SCR-030`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentyfour/parts/post-meta.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: parts/post-meta.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentyfour/parts/post-meta.html"
spec.route: "nenhuma: parts/post-meta.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `raw`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentyfour/parts/post-meta.html` com 2 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:pattern`

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentyfour/hidden-post-meta`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | fragmento montado no lugar que o template o invoca |
| Loading | operação assíncrona em curso | não se aplica: o fragmento não tem estado próprio |
| Error | falha na operação ou dado inválido | não se aplica |
| Success | operação concluída | não se aplica |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: front-end-fragmento-comentarios

**ID no inventário**: `SCR-031`  
**Grupo**: Front-end  
**Origem**: `wp-content/themes/twentytwentythree/parts/comments.html`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: parts/comments.html é resolvido pela hierarquia de templates, não por URL`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `--wp--preset--color--*`, `--wp--preset--spacing--*`, `--wp--preset--font-size--*`, `--wp--style--global--content-size`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-content/themes/twentytwentythree/parts/comments.html"
spec.route: "nenhuma: parts/comments.html é resolvido pela hierarquia de templates, não por URL"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. Template de tema: o título vem do conteúdo resolvido.
- **Tipo estrutural**: `raw`
- **Tamanho do arquivo de origem**: `wp-content/themes/twentytwentythree/parts/comments.html` com 2 linhas

#### 2. Layout

Árvore de blocos declarada no template, na ordem de leitura do arquivo:

- `wp:pattern`

*Patterns* referenciados — todo o conteúdo visível vem deles, conforme [`../ui/inventory.md`](../ui/inventory.md):

- `twentytwentythree/hidden-comments`

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

Nenhuma string literal neste arquivo — template de tema: o texto vem dos *patterns*.

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. Template de tema: não há entrada a validar.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | fragmento montado no lugar que o template o invoca |
| Loading | operação assíncrona em curso | não se aplica: o fragmento não tem estado próprio |
| Error | falha na operação ou dado inválido | não se aplica |
| Success | operação concluída | não se aplica |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: configuracao-do-wp-config

**ID no inventário**: `SCR-032`  
**Grupo**: Instalacao  
**Origem**: `wp-admin/setup-config.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/setup-config.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$button-height-default`, `$alert-red`, `$font-size-m`, `$grid-unit-20`  
**Pontos de interpolação**: `{{step_1}}`, `{{autofocus}}`, `{{language}}`, `{{config_text}}`, `{{install}}`, `{{printf_args}} (11 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Configuracao do wp-config.php

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/setup-config.php"
spec.route: "/wp-admin/setup-config.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Primeiro `<h1>`**: `Welcome to WordPress` (`wp-admin/setup-config.php:136`)
- **Tipo estrutural**: `wizard-step`
- **Tamanho do arquivo de origem**: `wp-admin/setup-config.php` com 523 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. Escreve o próprio `<head>`; roda antes de haver instalação.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Formulários desta tela: **2**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/setup-config.php` | 137 | `?step=0` | `post` |
| `wp-admin/setup-config.php` | 225 | `setup-config.php?step=2` | `post` |

#### 3. Campos

**8** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/setup-config.php` | `dbname` | `text` | não | 230 |
| `wp-admin/setup-config.php` | `uname` | `text` | não | 235 |
| `wp-admin/setup-config.php` | `pwd` | `password` | não | 242 |
| `wp-admin/setup-config.php` | `dbhost` | `text` | não | 253 |
| `wp-admin/setup-config.php` | `prefix` | `text` | não | 263 |
| `wp-admin/setup-config.php` | `noapi` | `hidden` | não | 270 |
| `wp-admin/setup-config.php` | `language` | `hidden` | não | 271 |
| `wp-admin/setup-config.php` | `submit` | `submit` | não | 272 |

> ⚠️ **Nenhum** dos 8 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**48** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, I need a %s file to work from. Please re-upload this file to your WordPress installation. | `wp-admin/setup-config.php` | 52 |
| The file %1$s already exists. If you need to reset any of the configuration items in this file, please delete it first. You may try <a href="%2$s">ins… | `wp-admin/setup-config.php` | 63 |
| The file %1$s already exists one level above your WordPress installation. If you need to reset any of the configuration items in this file, please del… | `wp-admin/setup-config.php` | 76 |
| WordPress &rsaquo; Setup Configuration File | `wp-admin/setup-config.php` | 111 |
| WordPress | `wp-admin/setup-config.php` | 115 |
| Before getting started | `wp-admin/setup-config.php` | 167 |
| Welcome to WordPress. Before getting started, you will need to know the following items. | `wp-admin/setup-config.php` | 170 |
| Database name | `wp-admin/setup-config.php` | 172 |
| Database username | `wp-admin/setup-config.php` | 173 |
| Database password | `wp-admin/setup-config.php` | 174 |
| Database host | `wp-admin/setup-config.php` | 175 |
| Table prefix (if you want to run more than one WordPress in a single database) | `wp-admin/setup-config.php` | 176 |
| … | `wp-admin/setup-config.php` | +36 strings |

Mensagens de recusa (`wp_die`), **3** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "<strong>Error:</strong> "Table Prefix" must not be empty." (`wp-admin/setup-config.php:304`)
- "<strong>Error:</strong> "Table Prefix" can only contain numbers, letters, and underscores." (`wp-admin/setup-config.php:309`)
- "<strong>Error:</strong> "Table Prefix" is invalid." (`wp-admin/setup-config.php:343`)

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 3 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Obrigatoriedade no cliente**: 0 de 8 campos com `required`.
- **Recusa**: 3 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | passo corrente do assistente |
| Loading | operação assíncrona em curso | indicador de progresso entre passos |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | avanço para o passo seguinte |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: instalador

**ID no inventário**: `SCR-033`  
**Grupo**: Instalacao  
**Origem**: `wp-admin/install.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/install.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$button-height-default`, `$alert-red`, `$font-size-m`, `$grid-unit-20`  
**Pontos de interpolação**: `{{body_classes}}`, `{{error}}`, `{{weblog_title}}`, `{{initial_password}}`, `{{admin_email}}`, `{{blog_privacy_selector_title}}`, `{{result}}`, `{{printf_args}} (8 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Instalador (5 passos)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/install.php"
spec.route: "/wp-admin/install.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Primeiro `<h1>`**: `Error: PHP is not running` (`wp-admin/install.php:19`)
- **Tipo estrutural**: `wizard-step`
- **Tamanho do arquivo de origem**: `wp-admin/install.php` com 487 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. Escreve o próprio `<head>` em `wp-admin/install.php:14`.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Formulários desta tela: **2**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/install.php` | 110 | `install.php?step=2` | `post` |
| `wp-admin/install.php` | 363 | `?step=1` | `post` |

#### 3. Campos

**8** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/install.php` | `weblog_title` | `text` | não | 114 |
| `wp-admin/install.php` | `user_name` | `hidden` | não | 122 |
| `wp-admin/install.php` | `admin_password` | `password` | não | 143 |
| `wp-admin/install.php` | `admin_password2` | `password` | não | 164 |
| `wp-admin/install.php` | `pw_weak` | `checkbox` | não | 171 |
| `wp-admin/install.php` | `admin_email` | `email` | não | 179 |
| `wp-admin/install.php` | `blog_public` | `radio` | não | 191 |
| `wp-admin/install.php` | `language` | `hidden` | não | 210 |

> ⚠️ **Nenhum** dos 8 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**48** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| WordPress &rsaquo; Installation | `wp-admin/install.php` | 72 |
| WordPress | `wp-admin/install.php` | 76 |
| Welcome | `wp-admin/install.php` | 107 |
| Site Title | `wp-admin/install.php` | 113 |
| Username | `wp-admin/install.php` | 117 |
| User(s) already exists. | `wp-admin/install.php` | 121 |
| Usernames can have only alphanumeric characters, spaces, underscores, hyphens, periods, and the @ symbol. | `wp-admin/install.php` | 126 |
| Password | `wp-admin/install.php` | 136 |
| Hide password | `wp-admin/install.php` | 146 |
| Hide | `wp-admin/install.php` | 148 |
| Important: | `wp-admin/install.php` | 152 |
| You will need this password to log&nbsp;in. Please store it in a secure location. | `wp-admin/install.php` | 154 |
| … | `wp-admin/install.php` | +36 strings |

Rótulos de botão de envio: "Install WordPress".

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- **Obrigatoriedade no cliente**: 0 de 8 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | passo corrente do assistente |
| Loading | operação assíncrona em curso | indicador de progresso entre passos |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | avanço para o passo seguinte |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: atualizacao-do-banco

**ID no inventário**: `SCR-034`  
**Grupo**: Instalacao  
**Origem**: `wp-admin/upgrade.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/upgrade.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$button-height-default`, `$alert-red`, `$font-size-m`, `$grid-unit-20`  
**Pontos de interpolação**: `{{goback}}`, `{{backto}}`, `{{printf_args}} (6 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Atualizacao do banco

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/upgrade.php"
spec.route: "/wp-admin/upgrade.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Primeiro `<h1>`**: `<?php _e( 'No Update Required' ); ?>` (`wp-admin/upgrade.php:88`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/upgrade.php` com 178 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. Fixa o `Content-Type` em `wp-admin/upgrade.php:72` e abre o próprio `<head>` em `:76`.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**17** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You cannot upgrade because <a href="%1$s">WordPress %2$s</a> requires the %3$s PHP extension. | `wp-admin/upgrade.php` | 64 |
| WordPress &rsaquo; Update | `wp-admin/upgrade.php` | 80 |
| WordPress | `wp-admin/upgrade.php` | 84 |
| No Update Required | `wp-admin/upgrade.php` | 88 |
| Your WordPress database is already up to date! | `wp-admin/upgrade.php` | 89 |
| Continue | `wp-admin/upgrade.php` | 90 |
| https://wordpress.org/documentation/wordpress-version/version-%s/ | `wp-admin/upgrade.php` | 96 |
| <a href="%s">Learn more about updating PHP</a>. | `wp-admin/upgrade.php` | 102 |
| You cannot update because <a href="%1$s">WordPress %2$s</a> requires PHP version %3$s or higher and MySQL version %4$s or higher. You are running PHP … | `wp-admin/upgrade.php` | 115 |
| You cannot update because <a href="%1$s">WordPress %2$s</a> requires PHP version %3$s or higher. You are running version %4$s. | `wp-admin/upgrade.php` | 126 |
| You cannot update because <a href="%1$s">WordPress %2$s</a> requires MySQL version %3$s or higher. You are running version %4$s. | `wp-admin/upgrade.php` | 135 |
| Database Update Required | `wp-admin/upgrade.php` | 155 |
| … | `wp-admin/upgrade.php` | +5 strings |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: reparo-do-banco

**ID no inventário**: `SCR-035`  
**Grupo**: Instalacao  
**Origem**: `wp-admin/maint/repair.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/maint/repair.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$input-bg`, `$button-height-default`, `$alert-red`, `$font-size-m`, `$grid-unit-20`  
**Pontos de interpolação**: `{{printf_args}} (10 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Reparo do banco

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/maint/repair.php"
spec.route: "/wp-admin/maint/repair.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/maint/repair.php` com 193 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. Fixa `text/html; charset=utf-8` em `wp-admin/maint/repair.php:12` e abre o próprio `<head>` em `:16` — roda sem autenticação.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

**1** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/maint/repair.php` | `errors` | `textarea` | não | 168 |

> ⚠️ **Nenhum** dos 1 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**24** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| WordPress &rsaquo; Database Repair | `wp-admin/maint/repair.php` | 20 |
| WordPress | `wp-admin/maint/repair.php` | 24 |
| Allow automatic database repair | `wp-admin/maint/repair.php` | 32 |
| To allow use of this page to automatically repair database problems, please add the following line to your %s file. Once this line is added to your co… | `wp-admin/maint/repair.php` | 38 |
| put your unique phrase here | `wp-admin/maint/repair.php` | 51 |
| Check secret keys | `wp-admin/maint/repair.php` | 81 |
| While you are editing your %1$s file, take a moment to make sure you have all 8 keys and that they are unique. You can generate these using the <a hre… | `wp-admin/maint/repair.php` | 85 |
| Database repair results | `wp-admin/maint/repair.php` | 91 |
| The %s table is okay. | `wp-admin/maint/repair.php` | 116 |
| The %1$s table is not okay. It is reporting the following error: %2$s. WordPress will attempt to repair this table&hellip; | `wp-admin/maint/repair.php` | 119 |
| Successfully repaired the %s table. | `wp-admin/maint/repair.php` | 126 |
| Failed to repair the %1$s table. Error: %2$s | `wp-admin/maint/repair.php` | 129 |
| … | `wp-admin/maint/repair.php` | +12 strings |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- **Obrigatoriedade no cliente**: 0 de 1 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: painel-inicial

**ID no inventário**: `SCR-036`  
**Grupo**: Painel  
**Origem**: `wp-admin/index.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/index.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `edit_posts`, `edit_theme_options`, `install_plugins`, `upload_files`, `view_site_health_checks`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{classes}}`, `{{printf_args}} (4 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Home

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/index.php"
spec.route: "/wp-admin/index.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Dashboard" (`wp-admin/index.php:33`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/index.php:141`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/index.php` com 213 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**29** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Dashboard | `wp-admin/index.php` | 33 |
| Welcome to your WordPress Dashboard! | `wp-admin/index.php` | 36 |
| The Dashboard is the first place you will come to every time you log into your site. It is where you will find all your WordPress tools. If you need h… | `wp-admin/index.php` | 37 |
| Overview | `wp-admin/index.php` | 44 |
| The left-hand navigation menu provides links to all of the WordPress administration screens, with submenu items displayed on hover. You can minimize t… | `wp-admin/index.php` | 51 |
| Links in the Toolbar at the top of the screen connect your dashboard and the front end of your site, and provide access to your profile and helpful Wo… | `wp-admin/index.php` | 52 |
| Navigation | `wp-admin/index.php` | 57 |
| You can use the following controls to arrange your Dashboard screen to suit your workflow. This is true on most other administration screens as well. | `wp-admin/index.php` | 62 |
| <strong>Screen Options</strong> &mdash; Use the Screen Options tab to choose which Dashboard boxes to show. | `wp-admin/index.php` | 63 |
| <strong>Drag and Drop</strong> &mdash; To rearrange the boxes, drag and drop by clicking on the title bar of the selected box and releasing when you s… | `wp-admin/index.php` | 64 |
| <strong>Box Controls</strong> &mdash; Click the title bar of the box to expand or collapse it. Some boxes added by plugins may have configurable conte… | `wp-admin/index.php` | 65 |
| Layout | `wp-admin/index.php` | 70 |
| … | `wp-admin/index.php` | +17 strings |

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `welcome-panel-nonce`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

#### 6. Validações

- **Autorização**: 5 checagens `current_user_can()`, 5 capacidades distintas. Primeira em `wp-admin/index.php:19`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: meus-sites

**ID no inventário**: `SCR-037`  
**Grupo**: Painel  
**Origem**: `wp-admin/my-sites.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/my-sites.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `read`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: My Sites

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/my-sites.php"
spec.route: "/wp-admin/my-sites.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "My Sites" (`wp-admin/my-sites.php:38`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/my-sites.php` com 180 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/my-sites.php` | 99 | *(vazio: posta na própria URL)* | `post` |

#### 3. Campos

**1** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/my-sites.php` | `action` | `hidden` | não | 169 |

> ⚠️ **Nenhum** dos 1 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**15** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Multisite support is not enabled. | `wp-admin/my-sites.php` | 13 |
| Sorry, you are not allowed to access this page. | `wp-admin/my-sites.php` | 17 |
| The primary site you chose does not exist. | `wp-admin/my-sites.php` | 33 |
| My Sites | `wp-admin/my-sites.php` | 38 |
| Overview | `wp-admin/my-sites.php` | 44 |
| This screen shows an individual user all of their sites in this network, and also allows that user to set a primary site. They can use the links under… | `wp-admin/my-sites.php` | 46 |
| For more information: | `wp-admin/my-sites.php` | 51 |
| <a href="https://codex.wordpress.org/Dashboard_My_Sites_Screen">Documentation on My Sites</a> | `wp-admin/my-sites.php` | 52 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/my-sites.php` | 53 |
| Settings saved. | `wp-admin/my-sites.php` | 60 |
| Add New Site | `wp-admin/my-sites.php` | 81 |
| You must be a member of at least one site to use this page. | `wp-admin/my-sites.php` | 86 |
| … | `wp-admin/my-sites.php` | +3 strings |

Mensagens de recusa (`wp_die`), **3** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Multisite support is not enabled." (`wp-admin/my-sites.php:13`)
- "Sorry, you are not allowed to access this page." (`wp-admin/my-sites.php:17`)
- "The primary site you chose does not exist." (`wp-admin/my-sites.php:33`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `update-my-sites`, `update-my-sites`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 3 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/my-sites.php:16`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 1 campos com `required`.
- **Recusa**: 3 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: atualizacoes

**ID no inventário**: `SCR-038`  
**Grupo**: Painel  
**Origem**: `wp-admin/update-core.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/update-core.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `update_core`, `update_languages`, `update_php`, `update_plugins`, `update_themes`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{show_text}}`, `{{hide_text}}`, `{{form_action}}`, `{{checkbox_id}}`, `{{plugin_file}}`, `{{icon}}`, `{{plugin_data}}`, `{{stylesheet}}`, `{{theme}}`, `{{url}}`, `{{printf_args}} (25 mensagens com placeholder posicional)`  
**Transições de saída**: `update-core.php`  
**Linha no `ui/inventory.md` do Visor**: Updates

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/update-core.php"
spec.route: "/wp-admin/update-core.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "WordPress Updates" (`wp-admin/update-core.php:987`)
- **Primeiro `<h1>`**: `<?php _e( 'Update WordPress' ); ?>` (`wp-admin/update-core.php:872`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/update-core.php` com 1333 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **4**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/update-core.php` | 159 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/update-core.php` | 494 | expressão PHP — `<?php echo esc_url( $form_action ); ? … )` | `post` |
| `wp-admin/update-core.php` | 670 | expressão PHP — `<?php echo esc_url( $form_action ); ? … )` | `post` |
| `wp-admin/update-core.php` | 828 | expressão PHP — `<?php echo esc_url( $form_action ); ? … )` | `post` |

#### 3. Campos

**3** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/update-core.php` | `version` | `text` | não | 163 |
| `wp-admin/update-core.php` | `locale` | `text` | não | 164 |
| `wp-admin/update-core.php` | `checked[]` | `checkbox` | não | 585 |

> ⚠️ **Nenhum** dos 3 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**94** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to update this site. | `wp-admin/update-core.php` | 23 |
| Update to latest %s nightly | `wp-admin/update-core.php` | 71 |
| Update to version %s | `wp-admin/update-core.php` | 74 |
| You can update to the latest nightly build manually: | `wp-admin/update-core.php` | 78 |
| Re-install version %s | `wp-admin/update-core.php` | 82 |
| https://wordpress.org/documentation/wordpress-version/version-%s/ | `wp-admin/update-core.php` | 94 |
| <a href="%s">Learn more about updating PHP</a>. | `wp-admin/update-core.php` | 100 |
| You cannot update because <a href="%1$s">WordPress %2$s</a> requires PHP version %3$s or higher and MySQL version %4$s or higher. You are running PHP … | `wp-admin/update-core.php` | 113 |
| You cannot update because <a href="%1$s">WordPress %2$s</a> requires PHP version %3$s or higher. You are running version %4$s. | `wp-admin/update-core.php` | 124 |
| You cannot update because <a href="%1$s">WordPress %2$s</a> requires MySQL version %3$s or higher. You are running version %4$s. | `wp-admin/update-core.php` | 133 |
| You can update from WordPress %1$s to <a href="%2$s">WordPress %3$s</a> manually: | `wp-admin/update-core.php` | 142 |
| Hide this update | `wp-admin/update-core.php` | 175 |
| … | `wp-admin/update-core.php` | +82 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to update this site." (`wp-admin/update-core.php:23`)

Rótulos de botão de envio: "Hide this update", "Bring back this update".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **9** ações distintas: `upgrade-core`, `upgrade-core`, `upgrade-core`, `upgrade-translations`, `upgrade-core`, `upgrade-core`, `upgrade-core`, `upgrade-translations` (+1).
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **6**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_admin_url( 'update-core.php' )` | `wp-admin/update-core.php` | 18 |
| `wp_nonce_url( 'update-core.php?action=upgrade-core', 'upgrade-core' )` | `wp-admin/update-core.php` | 957 |
| `wp_nonce_url( 'update-core.php?action=upgrade-core', 'upgrade-core' )` | `wp-admin/update-core.php` | 974 |
| `admin_url( 'update-core.php' )` | `wp-admin/update-core.php` | 1201 |
| `admin_url( 'update-core.php' )` | `wp-admin/update-core.php` | 1242 |
| `$redirect_url` | `wp-admin/update-core.php` | 1319 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 5 checagens `current_user_can()`, 5 capacidades distintas. Primeira em `wp-admin/update-core.php:22`.
- **Origem da requisição**: 9 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 3 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: lista-de-conteudo

**ID no inventário**: `SCR-039`  
**Grupo**: Painel  
**Origem**: `wp-admin/edit.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/edit.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `delete_post`, `edit_post`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{post_type}}`, `{{printf_args}} (17 mensagens com placeholder posicional)`  
**Transições de saída**: `edit-comments.php?p=`  
**Linha no `ui/inventory.md` do Visor**: All Posts / All Pages (list table)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/edit.php"
spec.route: "/wp-admin/edit.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: dinâmico — `$post_type_object->labels->name` (`wp-admin/edit.php:246`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/edit.php:46`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/edit.php` com 519 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/edit.php` | 488 | *(vazio: posta na própria URL)* | `get` |

Tabela de listagem: `WP_Posts_List_Table` (`wp-admin/edit.php:52`).

#### 3. Campos

**4** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/edit.php` | `post_status` | `hidden` | não | 492 |
| `wp-admin/edit.php` | `post_type` | `hidden` | não | 493 |
| `wp-admin/edit.php` | `author` | `hidden` | não | 496 |
| `wp-admin/edit.php` | `show_sticky` | `hidden` | não | 500 |

> ⚠️ **Nenhum** dos 4 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**55** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Invalid post type. | `wp-admin/edit.php` | 18 |
| Sorry, you are not allowed to edit posts in this post type. | `wp-admin/edit.php` | 22 |
| You need a higher level of permission. | `wp-admin/edit.php` | 46 |
| Sorry, you are not allowed to move this item to the Trash. | `wp-admin/edit.php` | 123 |
| Error in moving the item to Trash. | `wp-admin/edit.php` | 132 |
| Sorry, you are not allowed to restore this item from the Trash. | `wp-admin/edit.php` | 156 |
| Error in restoring the item from Trash. | `wp-admin/edit.php` | 160 |
| Sorry, you are not allowed to delete this item. | `wp-admin/edit.php` | 176 |
| Error in deleting the attachment. | `wp-admin/edit.php` | 181 |
| Error in deleting the item. | `wp-admin/edit.php` | 185 |
| Overview | `wp-admin/edit.php` | 252 |
| This screen provides access to all of your posts. You can customize the display of this screen to suit your workflow. | `wp-admin/edit.php` | 254 |
| … | `wp-admin/edit.php` | +43 strings |

Mensagens de recusa (`wp_die`), **9** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Invalid post type." (`wp-admin/edit.php:18`)
- "Sorry, you are not allowed to edit posts in this post type." (`wp-admin/edit.php:22`)
- "Sorry, you are not allowed to move this item to the Trash." (`wp-admin/edit.php:123`)
- "Error in moving the item to Trash." (`wp-admin/edit.php:132`)
- "Sorry, you are not allowed to restore this item from the Trash." (`wp-admin/edit.php:156`)
- "Error in restoring the item from Trash." (`wp-admin/edit.php:160`)
- (+3 mensagens em `wp-admin/edit.php`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `bulk-posts`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **4**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'edit-comments.php?p=' . absint( $_REQUEST[ $_redirect ] ) )` | `wp-admin/edit.php` | 58 |
| `$sendback` | `wp-admin/edit.php` | 112 |
| `$sendback` | `wp-admin/edit.php` | 228 |
| `remove_query_arg( array( '_wp_http_referer', '_wpnonce' ), wp_unslash( $_SERVER['REQUEST_U` | `wp-admin/edit.php` | 231 |

Transição de recusa: qualquer um dos 9 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/edit.php:122`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 4 campos com `required`.
- **Recusa**: 9 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: editor-de-blocos-novo

**ID no inventário**: `SCR-040`  
**Grupo**: Painel  
**Origem**: `wp-admin/post-new.php`  
**Corpo renderizado em**: `wp-admin/edit-form-blocks.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/post-new.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `edit_theme_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Add Post / Add Page (editor)

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: A: monta o cliente do editor em bloco (wp-admin/edit-form-blocks.php)


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/post-new.php"
spec.route: "/wp-admin/post-new.php"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**: dinâmico — `$post_type_object->labels->add_new_item` (`wp-admin/post-new.php:54`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/post-new.php:60`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/post-new.php` com 84 linhas, `wp-admin/edit-form-blocks.php` com 449 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**8** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Invalid post type. | `wp-admin/post-new.php` | 24 |
| You need a higher level of permission. | `wp-admin/post-new.php` | 60 |
| Sorry, you are not allowed to create posts as this user. | `wp-admin/post-new.php` | 61 |
| Default template | `wp-admin/edit-form-blocks.php` | 222 |
| Type / to choose a block | `wp-admin/edit-form-blocks.php` | 275 |
| Add title | `wp-admin/edit-form-blocks.php` | 281 |
| The block editor requires JavaScript. Please enable JavaScript in your browser settings, or activate the <a href="%s">Classic Editor plugin</a>. | `wp-admin/edit-form-blocks.php` | 414 |
| The block editor requires JavaScript. Please enable JavaScript in your browser settings, or install the <a href="%s">Classic Editor plugin</a>. | `wp-admin/edit-form-blocks.php` | 423 |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Invalid post type." (`wp-admin/post-new.php:24`)

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/edit-form-blocks.php:55`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: editor-de-blocos-edicao

**ID no inventário**: `SCR-041`  
**Grupo**: Painel  
**Origem**: `wp-admin/post.php`  
**Corpo renderizado em**: `wp-admin/edit-form-blocks.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/post.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `delete_post`, `edit_post`, `edit_theme_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (3 mensagens com placeholder posicional)`  
**Transições de saída**: `post.php`, `edit.php`  
**Linha no `ui/inventory.md` do Visor**: Editar post existente

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: A: monta o cliente do editor em bloco (wp-admin/edit-form-blocks.php)


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/post.php"
spec.route: "/wp-admin/post.php"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**: dinâmico — `$post_type_object->labels->edit_item` (`wp-admin/post.php:184`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/edit-form-blocks.php:398`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/post.php` com 382 linhas, `wp-admin/edit-form-blocks.php` com 449 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**26** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| A post ID mismatch has been detected. | `wp-admin/post.php` | 20 |
| Sorry, you are not allowed to edit this item. | `wp-admin/post.php` | 20 |
| A post type mismatch has been detected. | `wp-admin/post.php` | 47 |
| Unable to submit this form, please refresh and try again. | `wp-admin/post.php` | 82 |
| Cannot create a draft post with empty title and content. | `wp-admin/post.php` | 103 |
| Draft created successfully. | `wp-admin/post.php` | 120 |
| You attempted to edit an item that does not exist. Perhaps it was deleted? | `wp-admin/post.php` | 139 |
| Invalid post type. | `wp-admin/post.php` | 143 |
| Sorry, you are not allowed to edit posts in this post type. | `wp-admin/post.php` | 147 |
| You cannot edit this item because it is in the Trash. Please restore it and try again. | `wp-admin/post.php` | 155 |
| The item you are trying to move to the Trash no longer exists. | `wp-admin/post.php` | 254 |
| Sorry, you are not allowed to move this item to the Trash. | `wp-admin/post.php` | 262 |
| … | `wp-admin/post.php` | +9 strings |
| Default template | `wp-admin/edit-form-blocks.php` | 222 |
| Type / to choose a block | `wp-admin/edit-form-blocks.php` | 275 |
| Add title | `wp-admin/edit-form-blocks.php` | 281 |
| The block editor requires JavaScript. Please enable JavaScript in your browser settings, or activate the <a href="%s">Classic Editor plugin</a>. | `wp-admin/edit-form-blocks.php` | 414 |
| The block editor requires JavaScript. Please enable JavaScript in your browser settings, or install the <a href="%s">Classic Editor plugin</a>. | `wp-admin/edit-form-blocks.php` | 423 |

Mensagens de recusa (`wp_die`), **17** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "A post ID mismatch has been detected." (`wp-admin/post.php:20`)
- "A post type mismatch has been detected." (`wp-admin/post.php:47`)
- "You attempted to edit an item that does not exist. Perhaps it was deleted?" (`wp-admin/post.php:139`)
- "Invalid post type." (`wp-admin/post.php:143`)
- "Sorry, you are not allowed to edit posts in this post type." (`wp-admin/post.php:147`)
- "Sorry, you are not allowed to edit this item." (`wp-admin/post.php:151`)
- (+11 mensagens em `wp-admin/post.php`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **10** ações distintas: `add-`, `add-`, `lock-post_`, `update-post_`, `update-post_`, `trash-post_`, `untrash-post_`, `delete-post_` (+2).
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **7**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'post.php' )` | `wp-admin/post.php` | 134 |
| `get_edit_post_link( $post_id, 'url' )` | `wp-admin/post.php` | 161 |
| `$sendback` | `wp-admin/post.php` | 313 |
| `add_query_arg( 'deleted', 1, $sendback )` | `wp-admin/post.php` | 342 |
| `$url` | `wp-admin/post.php` | 350 |
| `wp_get_referer()` | `wp-admin/post.php` | 362 |
| `admin_url( 'edit.php' )` | `wp-admin/post.php` | 377 |

Transição de recusa: qualquer um dos 17 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 3 checagens `current_user_can()`, 3 capacidades distintas. Primeira em `wp-admin/post.php:150`.
- **Origem da requisição**: 10 ações de `nonce`. A falha leva a `SCR-112`.
- **Recusa**: 17 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: editor-classico

**ID no inventário**: `SCR-042`  
**Grupo**: Painel  
**Origem**: `wp-admin/edit-form-advanced.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/post.php (render alternativo da mesma rota de SCR-041)`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{form_action}}`, `{{post}}`, `{{post_type}}`, `{{referer}}`, `{{title_placeholder}}`, `{{_wp_editor_expand_class}}`, `{{printf_args}} (12 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Editor classico (fallback)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/edit-form-advanced.php"
spec.route: "/wp-admin/post.php (render alternativo da mesma rota de SCR-041)"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/edit-form-advanced.php` com 776 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/edit-form-advanced.php` | 473 | `post.php` | `post` |

#### 3. Campos

**10** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/edit-form-advanced.php` | `auto_draft` | `hidden` | não | 231 |
| `wp-admin/edit-form-advanced.php` | `post_ID` | `hidden` | não | 238 |
| `wp-admin/edit-form-advanced.php` | `user_ID` | `hidden` | não | 488 |
| `wp-admin/edit-form-advanced.php` | `action` | `hidden` | não | 489 |
| `wp-admin/edit-form-advanced.php` | `originalaction` | `hidden` | não | 490 |
| `wp-admin/edit-form-advanced.php` | `post_author` | `hidden` | não | 491 |
| `wp-admin/edit-form-advanced.php` | `post_type` | `hidden` | não | 492 |
| `wp-admin/edit-form-advanced.php` | `original_post_status` | `hidden` | não | 493 |
| `wp-admin/edit-form-advanced.php` | `referredby` | `hidden` | não | 494 |
| `wp-admin/edit-form-advanced.php` | `post_title` | `text` | não | 541 |

> ⚠️ **Nenhum** dos 10 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**75** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Preview post | `wp-admin/edit-form-advanced.php` | 124 |
| View post | `wp-admin/edit-form-advanced.php` | 138 |
| Preview page | `wp-admin/edit-form-advanced.php` | 145 |
| View page | `wp-admin/edit-form-advanced.php` | 159 |
| %1$s at %2$s | `wp-admin/edit-form-advanced.php` | 166 |
| M j, Y | `wp-admin/edit-form-advanced.php` | 168 |
| H:i | `wp-admin/edit-form-advanced.php` | 170 |
| Post updated. | `wp-admin/edit-form-advanced.php` | 175 |
| Custom field updated. | `wp-admin/edit-form-advanced.php` | 176 |
| Custom field deleted. | `wp-admin/edit-form-advanced.php` | 177 |
| Post restored to revision from %s. | `wp-admin/edit-form-advanced.php` | 180 |
| Post published. | `wp-admin/edit-form-advanced.php` | 181 |
| … | `wp-admin/edit-form-advanced.php` | +63 strings |

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **3** ações distintas: `meta-box-order`, `closedpostboxes`, `samplepermalink`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

#### 6. Validações

- **Origem da requisição**: 3 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 10 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: comparacao-de-revisoes

**ID no inventário**: `SCR-043`  
**Grupo**: Painel  
**Origem**: `wp-admin/revision.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/revision.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `edit_post`, `read_post`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{h1}}`, `{{return_to_post}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Comparacao de revisoes

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/revision.php"
spec.route: "/wp-admin/revision.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Revisions" (`wp-admin/revision.php:113`)
- **Primeiro `<h1>`**: `<?php echo $h1; ?>` (`wp-admin/revision.php:168`)
- **Tipo estrutural**: `detail`
- **Tamanho do arquivo de origem**: `wp-admin/revision.php` com 175 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**13** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Compare Revisions of &#8220;%s&#8221; | `wp-admin/revision.php` | 110 |
| &larr; Go to editor | `wp-admin/revision.php` | 111 |
| Revisions | `wp-admin/revision.php` | 113 |
| This screen is used for managing your content revisions. | `wp-admin/revision.php` | 142 |
| Revisions are saved copies of your post or page, which are periodically created as you update your content. The red text on the left shows the content… | `wp-admin/revision.php` | 143 |
| From this screen you can review, compare, and restore revisions: | `wp-admin/revision.php` | 144 |
| To navigate between revisions, <strong>drag the slider handle left or right</strong> or <strong>use the Previous or Next buttons</strong>. | `wp-admin/revision.php` | 145 |
| Compare two different revisions by <strong>selecting the &#8220;Compare any two revisions&#8221; box</strong> to the side. | `wp-admin/revision.php` | 146 |
| To restore a revision, <strong>click Restore This Revision</strong>. | `wp-admin/revision.php` | 147 |
| Overview | `wp-admin/revision.php` | 152 |
| For more information: | `wp-admin/revision.php` | 157 |
| <a href="https://wordpress.org/documentation/article/revisions/">Revisions Management</a> | `wp-admin/revision.php` | 158 |
| … | `wp-admin/revision.php` | +1 strings |

#### 5. Eventos e transições

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$redirect` | `wp-admin/revision.php` | 125 |

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/revision.php:42`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | o item carregado, somente leitura ou com ação |
| Loading | operação assíncrona em curso | esqueleto do item enquanto carrega |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: lista-de-termos

**ID no inventário**: `SCR-044`  
**Grupo**: Painel  
**Origem**: `wp-admin/edit-tags.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/edit-tags.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `delete_term`, `edit_term`, `import`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{taxonomy}}`, `{{post_type}}`, `{{tax}}`, `{{current_screen}}`, `{{printf_args}} (5 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Categories / Tags (list table)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/edit-tags.php"
spec.route: "/wp-admin/edit-tags.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: dinâmico — `$tax->labels->name` (`wp-admin/edit-tags.php:44`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/edit-tags.php:28`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/edit-tags.php` com 701 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **3**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/edit-tags.php` | 370 | *(vazio: posta na própria URL)* | `get` |
| `wp-admin/edit-tags.php` | 440 | `edit-tags.php` | `post` |
| `wp-admin/edit-tags.php` | 618 | *(vazio: posta na própria URL)* | `post` |

Tabela de listagem: `WP_Terms_List_Table` (`wp-admin/edit-tags.php:41`).

#### 3. Campos

**7** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/edit-tags.php` | `taxonomy` | `hidden` | não | 371 |
| `wp-admin/edit-tags.php` | `post_type` | `hidden` | não | 372 |
| `wp-admin/edit-tags.php` | `action` | `hidden` | não | 457 |
| `wp-admin/edit-tags.php` | `screen` | `hidden` | não | 458 |
| `wp-admin/edit-tags.php` | `tag-name` | `text` | sim | 465 |
| `wp-admin/edit-tags.php` | `slug` | `text` | não | 470 |
| `wp-admin/edit-tags.php` | `description` | `textarea` | não | 523 |

#### 4. Mensagens literais

**38** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Invalid taxonomy. | `wp-admin/edit-tags.php` | 13 |
| Sorry, you are not allowed to edit terms in this taxonomy. | `wp-admin/edit-tags.php` | 23 |
| You need a higher level of permission. | `wp-admin/edit-tags.php` | 28 |
| Sorry, you are not allowed to manage terms in this taxonomy. | `wp-admin/edit-tags.php` | 29 |
| Sorry, you are not allowed to create terms in this taxonomy. | `wp-admin/edit-tags.php` | 86 |
| Sorry, you are not allowed to delete this item. | `wp-admin/edit-tags.php` | 117 |
| Sorry, you are not allowed to delete these items. | `wp-admin/edit-tags.php` | 137 |
| You attempted to edit an item that does not exist. Perhaps it was deleted? | `wp-admin/edit-tags.php` | 160 |
| Sorry, you are not allowed to edit this item. | `wp-admin/edit-tags.php` | 173 |
| You can use categories to define sections of your site and group related posts. The default category is &#8220;Uncategorized&#8221; until you change i… | `wp-admin/edit-tags.php` | 253 |
| You can create groups of links by using Link Categories. Link Category names must be unique and Link Categories are separate from the categories you u… | `wp-admin/edit-tags.php` | 257 |
| You can assign keywords to your posts using <strong>tags</strong>. Unlike categories, tags have no hierarchy, meaning there is no relationship from on… | `wp-admin/edit-tags.php` | 259 |
| … | `wp-admin/edit-tags.php` | +26 strings |

Mensagens de recusa (`wp_die`), **3** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Invalid taxonomy." (`wp-admin/edit-tags.php:13`)
- "Sorry, you are not allowed to edit terms in this taxonomy." (`wp-admin/edit-tags.php:23`)
- "You attempted to edit an item that does not exist. Perhaps it was deleted?" (`wp-admin/edit-tags.php:160`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **6** ações distintas: `add-tag`, `delete-tag_`, `bulk-tags`, `update-tag_`, `bulk-tags`, `add-tag`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `sanitize_url( get_edit_term_link( $term_id, $taxonomy, $post_type ) )` | `wp-admin/edit-tags.php` | 163 |
| `apply_filters( 'redirect_term_location', $location, $tax )` | `wp-admin/edit-tags.php` | 231 |
| `add_query_arg( 'paged', $total_pages )` | `wp-admin/edit-tags.php` | 239 |

Transição de recusa: qualquer um dos 3 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 3 checagens `current_user_can()`, 3 capacidades distintas. Primeira em `wp-admin/edit-tags.php:114`.
- **Origem da requisição**: 6 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 1 de 7 campos com `required`.
- **Recusa**: 3 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: edicao-de-termo

**ID no inventário**: `SCR-045`  
**Grupo**: Painel  
**Origem**: `wp-admin/term.php`  
**Corpo renderizado em**: `wp-admin/edit-tag-form.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/term.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `delete_term`, `edit_term`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{tax}}`, `{{tag_ID}}`, `{{taxonomy}}`, `{{tag_name_value}}`, `{{slug}}`, `{{tag}}`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Editar termo

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/term.php"
spec.route: "/wp-admin/term.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: dinâmico — `$tax->labels->edit_item` (`wp-admin/term.php:36`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/term.php:42`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/term.php` com 76 linhas, `wp-admin/edit-tag-form.php` com 320 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/edit-tag-form.php` | 100 | `edit-tags.php` | `post` |

#### 3. Campos

**6** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/edit-tag-form.php` | `action` | `hidden` | não | 117 |
| `wp-admin/edit-tag-form.php` | `tag_ID` | `hidden` | não | 118 |
| `wp-admin/edit-tag-form.php` | `taxonomy` | `hidden` | não | 119 |
| `wp-admin/edit-tag-form.php` | `name` | `text` | não | 151 |
| `wp-admin/edit-tag-form.php` | `slug` | `text` | não | 172 |
| `wp-admin/edit-tag-form.php` | `description` | `textarea` | não | 207 |

> ⚠️ **Nenhum** dos 6 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**10** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You attempted to edit an item that does not exist. Perhaps it was deleted? | `wp-admin/term.php` | 31 |
| You need a higher level of permission. | `wp-admin/term.php` | 42 |
| Sorry, you are not allowed to edit this item. | `wp-admin/term.php` | 43 |
| Name | `wp-admin/edit-tag-form.php` | 150 |
| Slug | `wp-admin/edit-tag-form.php` | 155 |
| None | `wp-admin/edit-tag-form.php` | 189 |
| Categories, unlike tags, can have a hierarchy. You might have a Jazz category, and under that have children categories for Bebop and Big Band. Totally… | `wp-admin/edit-tag-form.php` | 198 |
| Description | `wp-admin/edit-tag-form.php` | 206 |
| Update | `wp-admin/edit-tag-form.php` | 301 |
| Delete | `wp-admin/edit-tag-form.php` | 305 |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "You attempted to edit an item that does not exist. Perhaps it was deleted?" (`wp-admin/term.php:31`)

Rótulos de botão de envio: "Update".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `update-tag_`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `sanitize_url( $sendback )` | `wp-admin/term.php` | 23 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/term.php:39`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 6 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: biblioteca-de-midia

**ID no inventário**: `SCR-046`  
**Grupo**: Painel  
**Origem**: `wp-admin/upload.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/upload.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `delete_post`, `upload_files`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (7 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Library

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/upload.php"
spec.route: "/wp-admin/upload.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Media Library" (`wp-admin/upload.php:205`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/upload.php:211`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/upload.php` com 466 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/upload.php` | 453 | *(vazio: posta na própria URL)* | `get` |

Tabela de listagem: `WP_Media_List_Table` (`wp-admin/upload.php:253`).

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**49** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to upload files. | `wp-admin/upload.php` | 13 |
| Media file updated. | `wp-admin/upload.php` | 18 |
| Media file attached. | `wp-admin/upload.php` | 28 |
| %s media file attached. | `wp-admin/upload.php` | 32 |
| Media file detached. | `wp-admin/upload.php` | 45 |
| %s media file detached. | `wp-admin/upload.php` | 49 |
| Media file permanently deleted. | `wp-admin/upload.php` | 62 |
| %s media file permanently deleted. | `wp-admin/upload.php` | 66 |
| Media file moved to the Trash. | `wp-admin/upload.php` | 79 |
| %s media file moved to the Trash. | `wp-admin/upload.php` | 83 |
| Undo | `wp-admin/upload.php` | 91 |
| Media file restored from the Trash. | `wp-admin/upload.php` | 102 |
| … | `wp-admin/upload.php` | +37 strings |

Mensagens de recusa (`wp_die`), **7** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to upload files." (`wp-admin/upload.php:13`)
- "Sorry, you are not allowed to move this item to the Trash." (`wp-admin/upload.php:297`)
- "Error in moving the item to Trash." (`wp-admin/upload.php:301`)
- "Sorry, you are not allowed to restore this item from the Trash." (`wp-admin/upload.php:318`)
- "Error in restoring the item from Trash." (`wp-admin/upload.php:322`)
- "Sorry, you are not allowed to delete this item." (`wp-admin/upload.php:333`)
- (+1 mensagens em `wp-admin/upload.php`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `bulk-media`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **2**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$location` | `wp-admin/upload.php` | 349 |
| `remove_query_arg( array( '_wp_http_referer', '_wpnonce' ), wp_unslash( $_SERVER['REQUEST_U` | `wp-admin/upload.php` | 352 |

Transição de recusa: qualquer um dos 7 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/upload.php:12`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Recusa**: 7 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: envio-de-midia

**ID no inventário**: `SCR-047`  
**Grupo**: Painel  
**Origem**: `wp-admin/media-new.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/media-new.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `edit_post`, `upload_files`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{form_class}}`  
**Transições de saída**: `upload.php`  
**Linha no `ui/inventory.md` do Visor**: Add Media File

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/media-new.php"
spec.route: "/wp-admin/media-new.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Upload Media" (`wp-admin/media-new.php:43`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/media-new.php:74`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/media-new.php` com 91 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/media-new.php` | 76 | expressão PHP — `<?php echo esc_url( admin_url( … )` | `post` |

#### 3. Campos

**1** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/media-new.php` | `post_id` | `hidden` | não | 83 |

> ⚠️ **Nenhum** dos 1 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**10** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to upload files. | `wp-admin/media-new.php` | 16 |
| Upload Media | `wp-admin/media-new.php` | 43 |
| Overview | `wp-admin/media-new.php` | 49 |
| You can upload media files here without creating a post first. This allows you to upload files to use with posts and pages later and/or to get a web l… | `wp-admin/media-new.php` | 51 |
| <strong>Drag and drop</strong> your files into the area below. Multiple files are allowed. | `wp-admin/media-new.php` | 53 |
| Clicking <strong>Select Files</strong> opens a navigation window showing you files in your operating system. Selecting <strong>Open</strong> after cli… | `wp-admin/media-new.php` | 54 |
| Revert to the <strong>Browser Uploader</strong> by clicking the link below the drag and drop box. | `wp-admin/media-new.php` | 55 |
| For more information: | `wp-admin/media-new.php` | 60 |
| <a href="https://wordpress.org/documentation/article/media-add-new-screen/">Documentation on Uploading Media Files</a> | `wp-admin/media-new.php` | 61 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/media-new.php` | 62 |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to upload files." (`wp-admin/media-new.php:16`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `media-form`, `media-form`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'upload.php' )` | `wp-admin/media-new.php` | 38 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/media-new.php:15`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 1 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: modal-de-selecao-de-midia

**ID no inventário**: `SCR-048`  
**Grupo**: Painel  
**Origem**: `wp-admin/media-upload.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/media-upload.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `edit_post`, `upload_files`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Modal de selecao de midia

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: B: iframe lido pelo modal de midia empacotado (wp-admin/js/media-upload.js)


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/media-upload.php"
spec.route: "/wp-admin/media-upload.php"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Primeiro `<h1>`**: `' . __( 'An error occurred during the upload process.' ) . '` (`wp-admin/media-upload.php:38`)
- **Tipo estrutural**: `modal`
- **Tamanho do arquivo de origem**: `wp-admin/media-upload.php` com 119 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. É resposta de *iframe*: fixa o `Content-Type` em `wp-admin/media-upload.php:29` e o chrome é o do modal que a embute.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**5** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to upload files. | `wp-admin/media-upload.php` | 20 |
| An error occurred during the upload process. | `wp-admin/media-upload.php` | 38 |
| Invalid item ID. You can view all media items in the <a href="upload.php">Media Library</a>. | `wp-admin/media-upload.php` | 39 |
| You need a higher level of permission. | `wp-admin/media-upload.php` | 46 |
| Sorry, you are not allowed to edit this item. | `wp-admin/media-upload.php` | 47 |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to upload files." (`wp-admin/media-upload.php:20`)

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/media-upload.php:19`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: editor-de-imagem

**ID no inventário**: `SCR-049`  
**Grupo**: Painel  
**Origem**: `wp-admin/includes/image-edit.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/admin-ajax.php?action=image-editor (HTML injetado pelo JS de mídia)`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{post_id}}`, `{{note}}`, `{{note_no_rotate}}`, `{{nonce}}`, `{{sizer}}`, `{{meta}}`, `{{can_restore}}`, `{{thumb}}`, `{{thumb_img}}`, `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Editor de imagem (recorte/rotacao)

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: B: HTML devolvido por acao assincrona e injetado pelo JS de midia


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/includes/image-edit.php"
spec.route: "/wp-admin/admin-ajax.php?action=image-editor (HTML injetado pelo JS de mídia)"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `modal`
- **Tamanho do arquivo de origem**: `wp-admin/includes/image-edit.php` com 1174 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. É fragmento injetado por JavaScript: não há documento a abrir.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

**1** campos distintos. O nome do campo é contrato **e, nesta tela, contrato externo** (ver o aviso de RF-13 acima): não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/includes/image-edit.php` | `imgedit-target-<?php echo $post_id; ?>` | `radio` | não | 309 |

> ⚠️ **Nenhum** dos 1 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**62** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Image data does not exist. Please re-upload the image. | `wp-admin/includes/image-edit.php` | 28 |
| Crop | `wp-admin/includes/image-edit.php` | 63 |
| Image Rotation | `wp-admin/includes/image-edit.php` | 66 |
| Rotate 90&deg; left | `wp-admin/includes/image-edit.php` | 78 |
| Rotate 90&deg; right | `wp-admin/includes/image-edit.php` | 79 |
| Rotate 180&deg; | `wp-admin/includes/image-edit.php` | 80 |
| Image rotation is not supported by your web host. | `wp-admin/includes/image-edit.php` | 83 |
| Flip vertical | `wp-admin/includes/image-edit.php` | 91 |
| Flip horizontal | `wp-admin/includes/image-edit.php` | 92 |
| Undo | `wp-admin/includes/image-edit.php` | 98 |
| Redo | `wp-admin/includes/image-edit.php` | 99 |
| Cancel Editing | `wp-admin/includes/image-edit.php` | 100 |
| … | `wp-admin/includes/image-edit.php` | +50 strings |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- **Obrigatoriedade no cliente**: 0 de 1 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: lista-de-links

**ID no inventário**: `SCR-050`  
**Grupo**: Painel  
**Origem**: `wp-admin/link-manager.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/link-manager.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `manage_links`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (3 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: All Links

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/link-manager.php"
spec.route: "/wp-admin/link-manager.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Links" (`wp-admin/link-manager.php:50`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/link-manager.php` com 150 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/link-manager.php` | 137 | *(vazio: posta na própria URL)* | `get` |

Tabela de listagem: `WP_Links_List_Table` (`wp-admin/link-manager.php:15`).

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**16** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to edit the links for this site. | `wp-admin/link-manager.php` | 12 |
| Links | `wp-admin/link-manager.php` | 50 |
| Overview | `wp-admin/link-manager.php` | 57 |
| You can add links here to be displayed on your site, usually using <a href="%s">Widgets</a>. By default, links to several sites in the WordPress commu… | `wp-admin/link-manager.php` | 61 |
| Links may be separated into Link Categories; these are different than the categories used on your posts. | `wp-admin/link-manager.php` | 64 |
| You can customize the display of this screen using the Screen Options tab and/or the dropdown filters above the links table. | `wp-admin/link-manager.php` | 65 |
| Deleting Links | `wp-admin/link-manager.php` | 71 |
| If you delete a link, it will be removed permanently, as Links do not have a Trash function yet. | `wp-admin/link-manager.php` | 73 |
| For more information: | `wp-admin/link-manager.php` | 78 |
| <a href="https://codex.wordpress.org/Links_Screen">Documentation on Managing Links</a> | `wp-admin/link-manager.php` | 79 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/link-manager.php` | 80 |
| Links list | `wp-admin/link-manager.php` | 85 |
| … | `wp-admin/link-manager.php` | +4 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to edit the links for this site." (`wp-admin/link-manager.php:12`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `bulk-bookmarks`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **2**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$redirect_to` | `wp-admin/link-manager.php` | 40 |
| `remove_query_arg( array( '_wp_http_referer', '_wpnonce' ), wp_unslash( $_SERVER['REQUEST_U` | `wp-admin/link-manager.php` | 43 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/link-manager.php:11`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: cadastro-de-link

**ID no inventário**: `SCR-051`  
**Grupo**: Painel  
**Origem**: `wp-admin/link-add.php`  
**Corpo renderizado em**: `wp-admin/edit-link-form.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/link-add.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `manage_links`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{form_name}}`, `{{link}}`, `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Add Link

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/link-add.php"
spec.route: "/wp-admin/link-add.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Add Link" (`wp-admin/link-add.php:17`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/link-add.php` com 35 linhas, `wp-admin/edit-link-form.php` com 181 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/edit-link-form.php` | 107 | *(vazio: posta na própria URL)* | `get` |

#### 3. Campos

**6** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/edit-link-form.php` | `link_name` | `text` | não | 125 |
| `wp-admin/edit-link-form.php` | `link_url` | `text` | não | 133 |
| `wp-admin/edit-link-form.php` | `link_description` | `text` | não | 141 |
| `wp-admin/edit-link-form.php` | `action` | `hidden` | não | 169 |
| `wp-admin/edit-link-form.php` | `link_id` | `hidden` | não | 170 |
| `wp-admin/edit-link-form.php` | `cat_id` | `hidden` | não | 171 |

> ⚠️ **Nenhum** dos 6 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**25** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to add links to this site. | `wp-admin/link-add.php` | 13 |
| Add Link | `wp-admin/link-add.php` | 17 |
| <a href="%s">Links</a> / Edit Link | `wp-admin/edit-link-form.php` | 16 |
| Update Link | `wp-admin/edit-link-form.php` | 17 |
| <a href="%s">Links</a> / Add Link | `wp-admin/edit-link-form.php` | 22 |
| Add Link | `wp-admin/edit-link-form.php` | 23 |
| Save | `wp-admin/edit-link-form.php` | 30 |
| Categories | `wp-admin/edit-link-form.php` | 31 |
| Target | `wp-admin/edit-link-form.php` | 32 |
| Link Relationship (XFN) | `wp-admin/edit-link-form.php` | 33 |
| Advanced | `wp-admin/edit-link-form.php` | 34 |
| Overview | `wp-admin/edit-link-form.php` | 66 |
| You can add or edit links on this screen by entering information in each of the boxes. Only the link&#8217;s web address and name (the text you want t… | `wp-admin/edit-link-form.php` | 68 |
| The boxes for link name, web address, and description have fixed positions, while the others may be repositioned using drag and drop. You can also hid… | `wp-admin/edit-link-form.php` | 69 |
| … | `wp-admin/edit-link-form.php` | +11 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to add links to this site." (`wp-admin/link-add.php:13`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `closedpostboxes`, `meta-box-order`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/link-add.php:12`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 6 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: importacao-de-opml

**ID no inventário**: `SCR-052`  
**Grupo**: Painel  
**Origem**: `wp-admin/link-parse-opml.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/link-parse-opml.php`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Importar OPML

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/link-parse-opml.php"
spec.route: "/wp-admin/link-parse-opml.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/link-parse-opml.php` com 106 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. **Não é rota.** Abre com `if ( ! defined( "ABSPATH" ) ) exit;` (`wp-admin/link-parse-opml.php:10`): é *include* do importador de OPML.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**2** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| PHP's XML extension is not available. Please contact your hosting provider to enable PHP's XML extension. | `wp-admin/link-parse-opml.php` | 82 |
| XML Error: %1$s at line %2$s | `wp-admin/link-parse-opml.php` | 94 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: fila-de-comentarios

**ID no inventário**: `SCR-053`  
**Grupo**: Painel  
**Origem**: `wp-admin/edit-comments.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/edit-comments.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `edit_comment`, `edit_posts`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{comment_status}}`, `{{wp_list_table}}`, `{{printf_args}} (10 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: All Comments

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/edit-comments.php"
spec.route: "/wp-admin/edit-comments.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Comments" (`wp-admin/edit-comments.php:199`)
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/edit-comments.php:13`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/edit-comments.php` com 462 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/edit-comments.php` | 434 | *(vazio: posta na própria URL)* | `get` |

Tabela de listagem: `WP_Comments_List_Table` (`wp-admin/edit-comments.php:19`).

#### 3. Campos

**7** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/edit-comments.php` | `p` | `hidden` | não | 439 |
| `wp-admin/edit-comments.php` | `comment_status` | `hidden` | não | 441 |
| `wp-admin/edit-comments.php` | `pagegen_timestamp` | `hidden` | não | 442 |
| `wp-admin/edit-comments.php` | `_total` | `hidden` | não | 444 |
| `wp-admin/edit-comments.php` | `_per_page` | `hidden` | não | 445 |
| `wp-admin/edit-comments.php` | `_page` | `hidden` | não | 446 |
| `wp-admin/edit-comments.php` | `paged` | `hidden` | não | 449 |

> ⚠️ **Nenhum** dos 7 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**39** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You need a higher level of permission. | `wp-admin/edit-comments.php` | 13 |
| Sorry, you are not allowed to edit comments. | `wp-admin/edit-comments.php` | 14 |
| Comments (%1$s) on &#8220;%2$s&#8221; | `wp-admin/edit-comments.php` | 175 |
| Comments on &#8220;%s&#8221; | `wp-admin/edit-comments.php` | 183 |
| Comments (%s) | `wp-admin/edit-comments.php` | 194 |
| Comments | `wp-admin/edit-comments.php` | 199 |
| Overview | `wp-admin/edit-comments.php` | 208 |
| You can manage comments made on your site similar to the way you manage posts and other content. This screen is customizable in the same ways as other… | `wp-admin/edit-comments.php` | 210 |
| Moderating Comments | `wp-admin/edit-comments.php` | 216 |
| A red bar on the left means the comment is waiting for you to moderate it. | `wp-admin/edit-comments.php` | 218 |
| In the <strong>Author</strong> column, in addition to the author&#8217;s name, email address, and site URL, the commenter&#8217;s IP address is shown.… | `wp-admin/edit-comments.php` | 219 |
| In the <strong>Comment</strong> column, hovering over any comment gives you options to approve, reply (and approve), quick edit, edit, spam mark, or t… | `wp-admin/edit-comments.php` | 220 |
| … | `wp-admin/edit-comments.php` | +27 strings |

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `bulk-comments`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `wp_get_referer()` | `wp-admin/edit-comments.php` | 50 |
| `$redirect_to` | `wp-admin/edit-comments.php` | 150 |
| `remove_query_arg( array( '_wp_http_referer', '_wpnonce' ), wp_unslash( $_SERVER['REQUEST_U` | `wp-admin/edit-comments.php` | 153 |

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/edit-comments.php:11`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 7 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: edicao-de-comentario

**ID no inventário**: `SCR-054`  
**Grupo**: Painel  
**Origem**: `wp-admin/comment.php`  
**Corpo renderizado em**: `wp-admin/edit-form-comment.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/comment.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `edit_comment`, `edit_post`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{formaction}}`, `{{comment}}`, `{{comment_link}}`, `{{referer}}`, `{{printf_args}} (7 mensagens com placeholder posicional)`  
**Transições de saída**: `edit-comments.php?error=1`, `edit-comments.php?error=2`, `edit-comments.php?same=`  
**Linha no `ui/inventory.md` do Visor**: Editar comentario

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/comment.php"
spec.route: "/wp-admin/comment.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Edit Comment" (`wp-admin/comment.php:59`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/comment.php:130`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/comment.php` com 389 linhas, `wp-admin/edit-form-comment.php` com 452 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **2**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/comment.php` | 258 | `comment.php` | `get` |
| `wp-admin/edit-form-comment.php` | 19 | `comment.php` | `post` |

#### 3. Campos

**14** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/comment.php` | `action` | `hidden` | não | 265 |
| `wp-admin/comment.php` | `c` | `hidden` | não | 266 |
| `wp-admin/comment.php` | `noredir` | `hidden` | não | 267 |
| `wp-admin/edit-form-comment.php` | `action` | `hidden` | não | 25 |
| `wp-admin/edit-form-comment.php` | `comment_ID` | `hidden` | não | 26 |
| `wp-admin/edit-form-comment.php` | `comment_post_ID` | `hidden` | não | 27 |
| `wp-admin/edit-form-comment.php` | `newcomment_author` | `text` | não | 60 |
| `wp-admin/edit-form-comment.php` | `newcomment_author_email` | `text` | não | 65 |
| `wp-admin/edit-form-comment.php` | `newcomment_author_url` | `text` | não | 71 |
| `wp-admin/edit-form-comment.php` | `comment_parent` | `select` | não | 316 |
| `wp-admin/edit-form-comment.php` | `c` | `hidden` | não | 435 |
| `wp-admin/edit-form-comment.php` | `p` | `hidden` | não | 436 |
| `wp-admin/edit-form-comment.php` | `referredby` | `hidden` | não | 437 |
| `wp-admin/edit-form-comment.php` | `noredir` | `hidden` | não | 439 |

> ⚠️ **Nenhum** dos 14 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**71** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You cannot edit this comment because the associated post is in the Trash. Please restore the post first, then try again. | `wp-admin/comment.php` | 47 |
| Edit Comment | `wp-admin/comment.php` | 59 |
| Overview | `wp-admin/comment.php` | 64 |
| You can edit the information left in a comment if needed. This is often useful when you notice that a commenter has made a typographical error. | `wp-admin/comment.php` | 66 |
| You can also moderate the comment from this screen using the Status box, where you can also change the timestamp of the comment. | `wp-admin/comment.php` | 67 |
| For more information: | `wp-admin/comment.php` | 72 |
| <a href="https://wordpress.org/documentation/article/comments-screen/">Documentation on Comments</a> | `wp-admin/comment.php` | 73 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/comment.php` | 74 |
| Invalid comment ID. | `wp-admin/comment.php` | 81 |
| Go back | `wp-admin/comment.php` | 81 |
| Sorry, you are not allowed to edit this comment. | `wp-admin/comment.php` | 85 |
| This comment is in the Trash. Please move it out of the Trash if you want to edit it. | `wp-admin/comment.php` | 89 |
| … | `wp-admin/comment.php` | +27 strings |
| Edit Comment | `wp-admin/edit-form-comment.php` | 22 |
| Permalink: | `wp-admin/edit-form-comment.php` | 37 |
| Author | `wp-admin/edit-form-comment.php` | 48 |
| Comment Author | `wp-admin/edit-form-comment.php` | 53 |
| Name | `wp-admin/edit-form-comment.php` | 59 |
| Email | `wp-admin/edit-form-comment.php` | 63 |
| URL | `wp-admin/edit-form-comment.php` | 69 |
| Comment | `wp-admin/edit-form-comment.php` | 84 |
| Save | `wp-admin/edit-form-comment.php` | 105 |
| Status: | `wp-admin/edit-form-comment.php` | 113 |
| Approved | `wp-admin/edit-form-comment.php` | 117 |
| Pending | `wp-admin/edit-form-comment.php` | 120 |
| … | `wp-admin/edit-form-comment.php` | +20 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Unknown action." (`wp-admin/comment.php:384`)

Rótulos de botão de envio: "Update".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **5** ações distintas: `approve-comment_`, `delete-comment_`, `update-comment_`, `update-comment_`, `closedpostboxes`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **5**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'edit-comments.php?error=1' )` | `wp-admin/comment.php` | 106 |
| `admin_url( 'edit-comments.php?error=2' )` | `wp-admin/comment.php` | 111 |
| `admin_url( 'edit-comments.php?same=' . $comment_id )` | `wp-admin/comment.php` | 117 |
| `$redir` | `wp-admin/comment.php` | 354 |
| `$location` | `wp-admin/comment.php` | 380 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 3 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/comment.php:84`.
- **Origem da requisição**: 5 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 14 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: lista-de-temas

**ID no inventário**: `SCR-055`  
**Grupo**: Painel  
**Origem**: `wp-admin/themes.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/themes.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `customize`, `delete_themes`, `edit_theme_options`, `install_themes`, `manage_network_themes`, `resume_theme`, `resume_themes`, `switch_themes` (+3)  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{class_name}}`, `{{active_class}}`, `{{theme}}`, `{{aria_action}}`, `{{details_aria_label}}`, `{{aria_name}}`, `{{customize_aria_label}}`, `{{aria_label}}`, `{{live_preview_aria_label}}`, `{{broken_theme}}`, `{{resume_url}}`, `{{delete_url}}`  
**Transições de saída**: `themes.php?activated=true`, `themes.php?resumed=true`, `themes.php?delete-active-child=true`, `themes.php?deleted=true`, `themes.php?enabled-auto-update=true`, `themes.php?disabled-auto-update=true`  
**Linha no `ui/inventory.md` do Visor**: Themes

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/themes.php"
spec.route: "/wp-admin/themes.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Themes" (`wp-admin/themes.php:127`)
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/themes.php:14`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/themes.php` com 1333 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/themes.php` | 261 | *(vazio: posta na própria URL)* | `get` |

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**98** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You need a higher level of permission. | `wp-admin/themes.php` | 14 |
| Sorry, you are not allowed to edit theme options on this site. | `wp-admin/themes.php` | 15 |
| An error occurred. | `wp-admin/themes.php` | 27 |
| The requested theme does not exist. | `wp-admin/themes.php` | 28 |
| Sorry, you are not allowed to resume this theme. | `wp-admin/themes.php` | 43 |
| Sorry, you are not allowed to delete this item. | `wp-admin/themes.php` | 63 |
| An error occurred while deleting the theme. | `wp-admin/themes.php` | 70 |
| Sorry, you are not allowed to enable themes automatic updates. | `wp-admin/themes.php` | 86 |
| Sorry, you are not allowed to disable themes automatic updates. | `wp-admin/themes.php` | 106 |
| Themes | `wp-admin/themes.php` | 127 |
| This screen is used for managing your installed themes. Aside from the default theme(s) included with your WordPress installation, themes are designed… | `wp-admin/themes.php` | 132 |
| From this screen you can: | `wp-admin/themes.php` | 133 |
| … | `wp-admin/themes.php` | +86 strings |

Mensagens de recusa (`wp_die`), **2** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to enable themes automatic updates." (`wp-admin/themes.php:86`)
- "Sorry, you are not allowed to disable themes automatic updates." (`wp-admin/themes.php:106`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **5** ações distintas: `switch-theme_`, `resume-theme_`, `delete-theme_`, `updates`, `updates`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **6**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'themes.php?activated=true' )` | `wp-admin/themes.php` | 34 |
| `admin_url( 'themes.php?resumed=true' )` | `wp-admin/themes.php` | 54 |
| `admin_url( 'themes.php?delete-active-child=true' )` | `wp-admin/themes.php` | 78 |
| `admin_url( 'themes.php?deleted=true' )` | `wp-admin/themes.php` | 81 |
| `admin_url( 'themes.php?enabled-auto-update=true' )` | `wp-admin/themes.php` | 101 |
| `admin_url( 'themes.php?disabled-auto-update=true' )` | `wp-admin/themes.php` | 120 |

Transição de recusa: qualquer um dos 2 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 11 checagens `current_user_can()`, 11 capacidades distintas. Primeira em `wp-admin/themes.php:12`.
- **Origem da requisição**: 5 ações de `nonce`. A falha leva a `SCR-112`.
- **Recusa**: 2 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: editor-do-site

**ID no inventário**: `SCR-056`  
**Grupo**: Painel  
**Origem**: `wp-admin/site-editor.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/site-editor.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `edit_theme_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Editor / Design / Patterns

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: A: enfileira wp-edit-site em wp-admin/site-editor.php:302


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/site-editor.php"
spec.route: "/wp-admin/site-editor.php"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Editor" (`wp-admin/site-editor.php:121`)
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/site-editor.php:16`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/site-editor.php` com 350 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**6** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You need a higher level of permission. | `wp-admin/site-editor.php` | 16 |
| Sorry, you are not allowed to edit theme options on this site. | `wp-admin/site-editor.php` | 17 |
| Editor | `wp-admin/site-editor.php` | 121 |
| Invalid post type. | `wp-admin/site-editor.php` | 170 |
| Edit Site | `wp-admin/site-editor.php` | 324 |
| The site editor requires JavaScript. Please enable JavaScript in your browser settings. | `wp-admin/site-editor.php` | 335 |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Invalid post type." (`wp-admin/site-editor.php:170`)

#### 5. Eventos e transições

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$redirection` | `wp-admin/site-editor.php` | 116 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/site-editor.php:14`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: biblioteca-de-fontes

**ID no inventário**: `SCR-057`  
**Grupo**: Painel  
**Origem**: `wp-admin/font-library.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/font-library.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `edit_theme_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Fonts

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/font-library.php"
spec.route: "/wp-admin/font-library.php"
spec.deviations: [DEV-001, DEV-004]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Fonts" (`wp-admin/font-library.php:31`)
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/font-library.php:15`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/font-library.php` com 55 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**6** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You need a higher level of permission. | `wp-admin/font-library.php` | 15 |
| Sorry, you are not allowed to manage fonts on this site. | `wp-admin/font-library.php` | 16 |
| Font Library is not available. | `wp-admin/font-library.php` | 24 |
| The Font Library requires Gutenberg build files. Please run <code>npm install</code> to build the necessary files. | `wp-admin/font-library.php` | 25 |
| Fonts | `wp-admin/font-library.php` | 31 |
| The Fonts screen requires JavaScript. Please enable JavaScript in your browser settings to install and manage fonts. | `wp-admin/font-library.php` | 32 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/font-library.php:13`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-004`: esta tela **nunca** renderiza UI nesta árvore. `wp-admin/font-library.php:22` exige `wp_font_library_wp_admin_render_page()`, que não existe em arquivo algum, e a resposta é sempre o `wp_die` de 503 ([`screen_deviation_log.md`](screen_deviation_log.md#dev-004)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: personalizador

**ID no inventário**: `SCR-058`  
**Grupo**: Painel  
**Origem**: `wp-admin/customize.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/customize.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `customize`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{admin_title}}`, `{{body_class}}`, `{{save_text}}`, `{{wp_customize}}`, `{{class}}`, `{{active}}`, `{{device}}`, `{{settings}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Customize

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: B: pontos de montagem #customize-* lidos por customize-controls (Backbone)


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/customize.php"
spec.route: "/wp-admin/customize.php"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/customize.php:17`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/customize.php` com 313 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. Tem chrome próprio de sobreposição cheia (`wp-full-overlay`), montado entre `wp-admin/customize.php:192` e `:300`.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/customize.php` | 192 | *(vazio: posta na própria URL)* | `get` |

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**19** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You need a higher level of permission. | `wp-admin/customize.php` | 17 |
| Sorry, you are not allowed to customize this site. | `wp-admin/customize.php` | 18 |
| Sorry, you are not allowed to edit this changeset. | `wp-admin/customize.php` | 35 |
| Your scheduled changes just published | `wp-admin/customize.php` | 71 |
| Customize New Changes | `wp-admin/customize.php` | 72 |
| An error occurred while saving your changeset. | `wp-admin/customize.php` | 79 |
| Please try again or start a new changeset. This changeset cannot be further modified. | `wp-admin/customize.php` | 80 |
| Loading&hellip; | `wp-admin/customize.php` | 157 |
| Publish | `wp-admin/customize.php` | 199 |
| Activate &amp; Publish | `wp-admin/customize.php` | 199 |
| Publish Settings | `wp-admin/customize.php` | 202 |
| Cannot Activate | `wp-admin/customize.php` | 205 |
| … | `wp-admin/customize.php` | +7 strings |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/customize.php:15`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: menus-de-navegacao

**ID no inventário**: `SCR-059`  
**Grupo**: Painel  
**Origem**: `wp-admin/nav-menus.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/nav-menus.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `customize`, `edit_theme_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{nav_tab_active_class}}`, `{{nav_aria_current}}`, `{{active_tab_class}}`, `{{aria_current}}`, `{{_location}}`, `{{_name}}`, `{{data_orig}}`, `{{menu}}`, `{{nav_menu_selected_id}}`, `{{_nav_menu}}`, `{{metabox_holder_disabled_class}}`, `{{menu_name_val}}`  
**Transições de saída**: `nav-menus.php?menu=`, `nav-menus.php`, `nav-menus.php?action=edit&menu=0`  
**Linha no `ui/inventory.md` do Visor**: Menus

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: B: DOM de arrastar e soltar lido por wp-admin/js/nav-menu.js


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/nav-menus.php"
spec.route: "/wp-admin/nav-menus.php"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Menus" (`wp-admin/nav-menus.php:32`)
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/nav-menus.php:25`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/nav-menus.php` com 1302 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **4**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/nav-menus.php` | 852 | expressão PHP — `<?php echo esc_url( add_query_arg( array( … )` | `post` |
| `wp-admin/nav-menus.php` | 980 | expressão PHP — `<?php echo esc_url( admin_url( … )` | `get` |
| `wp-admin/nav-menus.php` | 1065 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/nav-menus.php` | 1076 | *(vazio: posta na própria URL)* | `post` |

#### 3. Campos

**8** campos distintos. O nome do campo é contrato **e, nesta tela, contrato externo** (ver o aviso de RF-13 acima): não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/nav-menus.php` | `menu-locations[<?php echo $_location; ?>]` | `select` | não | 865 |
| `wp-admin/nav-menus.php` | `menu` | `hidden` | não | 932 |
| `wp-admin/nav-menus.php` | `action` | `hidden` | não | 981 |
| `wp-admin/nav-menus.php` | `nav-menu-data` | `hidden` | não | 1079 |
| `wp-admin/nav-menus.php` | `zero-menu-state` | `hidden` | não | 1090 |
| `wp-admin/nav-menus.php` | `menu-name` | `text` | sim | 1101 |
| `wp-admin/nav-menus.php` | `bulk-select-switcher-top` | `checkbox` | não | 1129 |
| `wp-admin/nav-menus.php` | `use-location` | `hidden` | não | 1147 |

#### 4. Mensagens literais

**96** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Your theme does not support navigation menus or widgets. | `wp-admin/nav-menus.php` | 19 |
| You need a higher level of permission. | `wp-admin/nav-menus.php` | 25 |
| Sorry, you are not allowed to edit theme options on this site. | `wp-admin/nav-menus.php` | 26 |
| Menus | `wp-admin/nav-menus.php` | 32 |
| The menu item has been successfully deleted. | `wp-admin/nav-menus.php` | 285 |
| The menu has been successfully deleted. | `wp-admin/nav-menus.php` | 322 |
| Selected menus have been successfully deleted. | `wp-admin/nav-menus.php` | 358 |
| Please enter a valid menu name. | `wp-admin/nav-menus.php` | 446 |
| Menu locations updated. | `wp-admin/nav-menus.php` | 535 |
| Move up one | `wp-admin/nav-menus.php` | 572 |
| Move down one | `wp-admin/nav-menus.php` | 573 |
| Move to the top | `wp-admin/nav-menus.php` | 574 |
| … | `wp-admin/nav-menus.php` | +84 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Your theme does not support navigation menus or widgets." (`wp-admin/nav-menus.php:19`)

Rótulos de botão de envio: "Save Changes".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **13** ações distintas: `add-menu_item`, `move-menu_item`, `move-menu_item`, `delete-menu_item_`, `delete-nav_menu-`, `nav_menus_bulk_actions`, `update-nav_menu`, `save-menu-locations` (+5).
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **4**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'nav-menus.php?menu=' . $_nav_menu_selected_id )` | `wp-admin/nav-menus.php` | 441 |
| `admin_url( 'nav-menus.php?menu=' . (int) $_nav_menu_selected_id )` | `wp-admin/nav-menus.php` | 510 |
| `admin_url( 'nav-menus.php' )` | `wp-admin/nav-menus.php` | 520 |
| `admin_url( 'nav-menus.php?action=edit&menu=0' )` | `wp-admin/nav-menus.php` | 610 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/nav-menus.php:23`.
- **Origem da requisição**: 13 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 1 de 8 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: cabecalho-personalizado

**ID no inventário**: `SCR-060`  
**Grupo**: Painel  
**Origem**: `wp-admin/includes/class-custom-image-header.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/themes.php?page=custom-header`  
**Tela crítica?**: não  
**Capacidade exigida**: `customize`, `edit_theme_options`, `upload_files`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{default_color}}`, `{{header_image_style}}`, `{{style}}`, `{{modal_update_href}}`, `{{url}}`, `{{width}}`, `{{height}}`, `{{attachment_id}}`, `{{oitar}}`, `{{printf_args}} (10 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Header

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/includes/class-custom-image-header.php"
spec.route: "/wp-admin/themes.php?page=custom-header"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Primeiro `<h1>`**: `<?php _e( 'Custom Header' ); ?>` (`wp-admin/includes/class-custom-image-header.php:512`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/includes/class-custom-image-header.php` com 1633 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. O cabeçalho vem do despachante de página de menu (`wp-admin/admin.php`), não deste arquivo: a tela é registrada por `add_theme_page()`.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Formulários desta tela: **3**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/includes/class-custom-image-header.php` | 661 | expressão PHP — `<?php echo esc_url( add_query_arg( … )` | `post` |
| `wp-admin/includes/class-custom-image-header.php` | 693 | expressão PHP — `<?php echo esc_url( add_query_arg( … )` | `post` |
| `wp-admin/includes/class-custom-image-header.php` | 932 | expressão PHP — `<?php echo esc_url( add_query_arg( … )` | `post` |

#### 3. Campos

**12** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/includes/class-custom-image-header.php` | `default-header` | `radio` | não | 324 |
| `wp-admin/includes/class-custom-image-header.php` | `import` | `file` | não | 664 |
| `wp-admin/includes/class-custom-image-header.php` | `action` | `hidden` | não | 665 |
| `wp-admin/includes/class-custom-image-header.php` | `display-header-text` | `checkbox` | não | 767 |
| `wp-admin/includes/class-custom-image-header.php` | `text-color` | `text` | não | 792 |
| `wp-admin/includes/class-custom-image-header.php` | `x1` | `hidden` | não | 940 |
| `wp-admin/includes/class-custom-image-header.php` | `y1` | `hidden` | não | 941 |
| `wp-admin/includes/class-custom-image-header.php` | `width` | `hidden` | não | 942 |
| `wp-admin/includes/class-custom-image-header.php` | `height` | `hidden` | não | 943 |
| `wp-admin/includes/class-custom-image-header.php` | `attachment_id` | `hidden` | não | 944 |
| `wp-admin/includes/class-custom-image-header.php` | `oitar` | `hidden` | não | 945 |
| `wp-admin/includes/class-custom-image-header.php` | `create-new-attachment` | `hidden` | não | 947 |

> ⚠️ **Nenhum** dos 12 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**61** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Header | `wp-admin/includes/class-custom-image-header.php` | 77 |
| Overview | `wp-admin/includes/class-custom-image-header.php` | 108 |
| This screen is used to customize the header section of your theme. | `wp-admin/includes/class-custom-image-header.php` | 110 |
| You can choose from the theme&#8217;s default header images, or use one of your own. You can also customize how your Site Title and Tagline are displa… | `wp-admin/includes/class-custom-image-header.php` | 111 |
| Header Image | `wp-admin/includes/class-custom-image-header.php` | 118 |
| You can set a custom image header for your site. Simply upload the image and crop it, and the new header will go live immediately. Alternatively, you … | `wp-admin/includes/class-custom-image-header.php` | 120 |
| Some themes come with additional header images bundled. If you see multiple images displayed, select the one you would like and click the &#8220;Save … | `wp-admin/includes/class-custom-image-header.php` | 121 |
| If your theme has more than one default header image, or you have uploaded more than one custom header image, you have the option of having WordPress … | `wp-admin/includes/class-custom-image-header.php` | 122 |
| If you do not want a header image to be displayed on your site at all, click the &#8220;Remove Header Image&#8221; button at the bottom of the Header … | `wp-admin/includes/class-custom-image-header.php` | 123 |
| Header Text | `wp-admin/includes/class-custom-image-header.php` | 130 |
| For most themes, the header text is your Site Title and Tagline, as defined in the <a href="%s">General Settings</a> section. | `wp-admin/includes/class-custom-image-header.php` | 134 |
| In the Header Text section of this page, you can choose whether to display this text or hide it. You can also choose a color for the text by clicking … | `wp-admin/includes/class-custom-image-header.php` | 138 |
| … | `wp-admin/includes/class-custom-image-header.php` | +49 strings |

Mensagens de recusa (`wp_die`), **3** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Image could not be processed. Please go back and try again." (`wp-admin/includes/class-custom-image-header.php:915`)
- "The uploaded file is not a valid image. Please try again." (`wp-admin/includes/class-custom-image-header.php:980`)
- "Sorry, you are not allowed to customize headers." (`wp-admin/includes/class-custom-image-header.php:1122`)

Rótulos de botão de envio: "Upload", "Remove Header Image", "Restore Original Header Image", "Crop and Publish", "Skip Cropping, Publish Image as Is".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **10** ações distintas: `custom-header-options`, `custom-header-options`, `custom-header-options`, `custom-header-options`, `custom-header-options`, `custom-header-upload`, `custom-header-options`, `custom-header-upload` (+2).
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 3 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 3 checagens `current_user_can()`, 3 capacidades distintas. Primeira em `wp-admin/includes/class-custom-image-header.php:213`.
- **Origem da requisição**: 10 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 12 campos com `required`.
- **Recusa**: 3 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: fundo-personalizado

**ID no inventário**: `SCR-061`  
**Grupo**: Painel  
**Origem**: `wp-admin/includes/class-custom-background.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/themes.php?page=custom-background`  
**Tela crítica?**: não  
**Capacidade exigida**: `customize`, `edit_theme_options`, `upload_files`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{background_styles}}`, `{{background_image_thumb}}`, `{{background_position_title}}`, `{{value}}`, `{{input}}`, `{{image_size_title}}`, `{{background_repeat_title}}`, `{{background_scroll_title}}`, `{{background_color_title}}`, `{{default_color}}`, `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Background

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/includes/class-custom-background.php"
spec.route: "/wp-admin/themes.php?page=custom-background"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Primeiro `<h1>`**: `<?php _e( 'Custom Background' ); ?>` (`wp-admin/includes/class-custom-background.php:243`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/includes/class-custom-background.php` com 656 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. O cabeçalho vem do despachante de página de menu (`wp-admin/admin.php`), não deste arquivo: a tela é registrada por `add_theme_page()`.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Formulários desta tela: **4**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/includes/class-custom-background.php` | 325 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/includes/class-custom-background.php` | 339 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/includes/class-custom-background.php` | 351 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/includes/class-custom-background.php` | 373 | *(vazio: posta na própria URL)* | `post` |

#### 3. Campos

**8** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/includes/class-custom-background.php` | `import` | `file` | não | 354 |
| `wp-admin/includes/class-custom-background.php` | `action` | `hidden` | não | 355 |
| `wp-admin/includes/class-custom-background.php` | `background-preset` | `hidden` | não | 377 |
| `wp-admin/includes/class-custom-background.php` | `background-position` | `radio` | não | 441 |
| `wp-admin/includes/class-custom-background.php` | `background-size` | `select` | não | 456 |
| `wp-admin/includes/class-custom-background.php` | `background-repeat` | `hidden` | não | 468 |
| `wp-admin/includes/class-custom-background.php` | `background-attachment` | `hidden` | não | 477 |
| `wp-admin/includes/class-custom-background.php` | `background-color` | `text` | não | 493 |

> ⚠️ **Nenhum** dos 8 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**50** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Background | `wp-admin/includes/class-custom-background.php` | 70 |
| Overview | `wp-admin/includes/class-custom-background.php` | 99 |
| You can customize the look of your site without touching any of your theme&#8217;s code by using a custom background. Your background can be an image … | `wp-admin/includes/class-custom-background.php` | 101 |
| To use a background image, simply upload it or choose an image that has already been uploaded to your Media Library by clicking the &#8220;Choose Imag… | `wp-admin/includes/class-custom-background.php` | 102 |
| You can also choose a background color by clicking the Select Color button and either typing in a legitimate HTML hex value, e.g. &#8220;#ff0000&#8221… | `wp-admin/includes/class-custom-background.php` | 103 |
| Do not forget to click on the Save Changes button when you are finished. | `wp-admin/includes/class-custom-background.php` | 104 |
| For more information: | `wp-admin/includes/class-custom-background.php` | 109 |
| <a href="https://codex.wordpress.org/Appearance_Background_Screen">Documentation on Custom Background</a> | `wp-admin/includes/class-custom-background.php` | 110 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/includes/class-custom-background.php` | 111 |
| Custom Background | `wp-admin/includes/class-custom-background.php` | 243 |
| You can now manage and live-preview Custom Backgrounds in the <a href="%s">Customizer</a>. | `wp-admin/includes/class-custom-background.php` | 249 |
| Background updated. <a href="%s">Visit your site</a> to see how it looks. | `wp-admin/includes/class-custom-background.php` | 264 |
| … | `wp-admin/includes/class-custom-background.php` | +38 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "The uploaded file is not a valid image. Please try again." (`wp-admin/includes/class-custom-background.php:524`)

Rótulos de botão de envio: "Remove Background Image", "Restore Original Image", "Upload".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **13** ações distintas: `custom-background-reset`, `custom-background-remove`, `custom-background`, `custom-background`, `custom-background`, `custom-background`, `custom-background`, `custom-background` (+5).
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$_POST['_wp_http_referer']` | `wp-admin/includes/class-custom-background.php` | 147 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 3 checagens `current_user_can()`, 3 capacidades distintas. Primeira em `wp-admin/includes/class-custom-background.php:246`.
- **Origem da requisição**: 13 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 8 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: widgets-em-blocos

**ID no inventário**: `SCR-062`  
**Grupo**: Painel  
**Origem**: `wp-admin/widgets-form-blocks.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/widgets.php (tema de blocos)`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Widgets (blocos)

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: A: ponto de montagem #widgets-editor em wp-admin/widgets-form-blocks.php:94


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/widgets-form-blocks.php"
spec.route: "/wp-admin/widgets.php (tema de blocos)"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/widgets-form-blocks.php:97`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/widgets-form-blocks.php` com 144 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**2** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| The block widgets require JavaScript. Please enable JavaScript in your browser settings, or activate the <a href="%s">Classic Widgets plugin</a>. | `wp-admin/widgets-form-blocks.php` | 105 |
| The block widgets require JavaScript. Please enable JavaScript in your browser settings, or install the <a href="%s">Classic Widgets plugin</a>. | `wp-admin/widgets-form-blocks.php` | 114 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: widgets-classico

**ID no inventário**: `SCR-063`  
**Grupo**: Painel  
**Origem**: `wp-admin/widgets-form.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/widgets.php (tema clássico)`  
**Tela crítica?**: não  
**Capacidade exigida**: `customize`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{width}}`, `{{widget_id}}`, `{{id_base}}`, `{{multi_number}}`, `{{wrap_class}}`, `{{single_sidebar_class}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: `widgets.php?error=0`, `widgets.php?message=0`  
**Linha no `ui/inventory.md` do Visor**: Widgets (classico)

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: B: DOM de arrastar e soltar lido por wp-admin/js/widgets.js


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/widgets-form.php"
spec.route: "/wp-admin/widgets.php (tema clássico)"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/widgets-form.php:280`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/widgets-form.php` com 598 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **3**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/widgets-form.php` | 289 | `widgets.php` | `post` |
| `wp-admin/widgets-form.php` | 492 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/widgets-form.php` | 575 | *(vazio: posta na própria URL)* | `post` |

#### 3. Campos

**6** campos distintos. O nome do campo é contrato **e, nesta tela, contrato externo** (ver o aviso de RF-13 acima): não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/widgets-form.php` | `sidebar` | `radio` | não | 305 |
| `wp-admin/widgets-form.php` | `{$sidebar_name}_position` | `select` | não | 325 |
| `wp-admin/widgets-form.php` | `removewidget` | `submit` | não | 348 |
| `wp-admin/widgets-form.php` | `widget-id` | `hidden` | não | 358 |
| `wp-admin/widgets-form.php` | `id_base` | `hidden` | não | 359 |
| `wp-admin/widgets-form.php` | `multi_number` | `hidden` | não | 360 |

> ⚠️ **Nenhum** dos 6 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**38** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Overview | `wp-admin/widgets-form.php` | 43 |
| Widgets are independent sections of content that can be placed into any widgetized area provided by your theme (commonly called sidebars). To populate… | `wp-admin/widgets-form.php` | 45 |
| The Available Widgets section contains all the widgets you can choose from. Once you drag a widget into a sidebar, it will open to allow you to config… | `wp-admin/widgets-form.php` | 46 |
| Removing and Reusing | `wp-admin/widgets-form.php` | 52 |
| If you want to remove the widget but save its setting for possible future use, just drag it into the Inactive Widgets area. You can add them back anyt… | `wp-admin/widgets-form.php` | 54 |
| Widgets may be used multiple times. You can give each widget a title, to display on your site, but it&#8217;s not required. | `wp-admin/widgets-form.php` | 55 |
| Enabling Accessibility Mode, via Screen Options, allows you to use Add and Edit buttons instead of using drag and drop. | `wp-admin/widgets-form.php` | 56 |
| Missing Widgets | `wp-admin/widgets-form.php` | 62 |
| Many themes show some sidebar widgets by default until you edit your sidebars, but they are not automatically displayed in your sidebar management too… | `wp-admin/widgets-form.php` | 64 |
| When changing themes, there is often some variation in the number and setup of widget areas/sidebars and sometimes these conflicts make the transition… | `wp-admin/widgets-form.php` | 65 |
| For more information: | `wp-admin/widgets-form.php` | 70 |
| <a href="https://wordpress.org/documentation/article/appearance-widgets-screen-classic-editor/">Documentation on Widgets</a> | `wp-admin/widgets-form.php` | 71 |
| … | `wp-admin/widgets-form.php` | +26 strings |

Rótulos de botão de envio: "Save Widget", "Clear Inactive Widgets".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **4** ações distintas: `widgets-access`, `remove-inactive-widgets`, `remove-inactive-widgets`, `save-sidebar-widgets`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'widgets.php?error=0' )` | `wp-admin/widgets-form.php` | 148 |
| `admin_url( 'widgets.php?message=0' )` | `wp-admin/widgets-form.php` | 200 |
| `admin_url( 'widgets.php?message=0' )` | `wp-admin/widgets-form.php` | 222 |

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/widgets-form.php:393`.
- **Origem da requisição**: 4 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 6 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: instalar-tema

**ID no inventário**: `SCR-064`  
**Grupo**: Painel  
**Origem**: `wp-admin/theme-install.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/theme-install.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `install_themes`, `update_core`, `update_php`, `upload_themes`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{user}}`, `{{aria_label}}`, `{{printf_args}} (15 mensagens com placeholder posicional)`  
**Transições de saída**: `theme-install.php`  
**Linha no `ui/inventory.md` do Visor**: Instalar tema

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/theme-install.php"
spec.route: "/wp-admin/theme-install.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Add Themes" (`wp-admin/theme-install.php:25`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/theme-install.php:166`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/theme-install.php` com 619 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/theme-install.php` | 221 | *(vazio: posta na própria URL)* | `get` |

#### 3. Campos

**1** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/theme-install.php` | `_wpnonce` | `hidden` | não | 237 |

> ⚠️ **Nenhum** dos 1 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**75** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to install themes on this site. | `wp-admin/theme-install.php` | 16 |
| Add Themes | `wp-admin/theme-install.php` | 25 |
| Add Theme | `wp-admin/theme-install.php` | 57 |
| Search Themes | `wp-admin/theme-install.php` | 58 |
| Upload Theme | `wp-admin/theme-install.php` | 59 |
| Back | `wp-admin/theme-install.php` | 60 |
| An unexpected error occurred. Something may be wrong with WordPress.org or this server&#8217;s configuration. If you continue to have problems, please… | `wp-admin/theme-install.php` | 63 |
| https://wordpress.org/support/forums/ | `wp-admin/theme-install.php` | 64 |
| Try Again | `wp-admin/theme-install.php` | 66 |
| Number of Themes found: %d | `wp-admin/theme-install.php` | 68 |
| No themes found. Try a different search. | `wp-admin/theme-install.php` | 69 |
| Theme details: %s | `wp-admin/theme-install.php` | 71 |
| … | `wp-admin/theme-install.php` | +63 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to install themes on this site." (`wp-admin/theme-install.php:16`)

#### 5. Eventos e transições

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_admin_url( 'theme-install.php' )` | `wp-admin/theme-install.php` | 20 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 4 checagens `current_user_can()`, 4 capacidades distintas. Primeira em `wp-admin/theme-install.php:15`.
- **Obrigatoriedade no cliente**: 0 de 1 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: editor-de-arquivo-de-tema

**ID no inventário**: `SCR-065`  
**Grupo**: Painel  
**Origem**: `wp-admin/theme-editor.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/theme-editor.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `customize`, `edit_theme_options`, `edit_themes`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{content}}`, `{{relative_file}}`, `{{theme}}`, `{{docs_select}}`, `{{return_url}}`, `{{printf_args}} (8 mensagens com placeholder posicional)`  
**Transições de saída**: `theme-editor.php`  
**Linha no `ui/inventory.md` do Visor**: Editor de arquivos de tema

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/theme-editor.php"
spec.route: "/wp-admin/theme-editor.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Edit Themes" (`wp-admin/theme-editor.php:22`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/theme-editor.php:190`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/theme-editor.php` com 474 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **2**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/theme-editor.php` | 291 | `theme-editor.php` | `get` |
| `wp-admin/theme-editor.php` | 358 | `theme-editor.php` | `post` |

#### 3. Campos

**5** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/theme-editor.php` | `docs-list` | `select` | não | 173 |
| `wp-admin/theme-editor.php` | `theme` | `select` | não | 293 |
| `wp-admin/theme-editor.php` | `newcontent` | `textarea` | não | 362 |
| `wp-admin/theme-editor.php` | `action` | `hidden` | não | 363 |
| `wp-admin/theme-editor.php` | `file` | `hidden` | não | 364 |

> ⚠️ **Nenhum** dos 5 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**52** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to edit templates for this site. | `wp-admin/theme-editor.php` | 18 |
| Edit Themes | `wp-admin/theme-editor.php` | 22 |
| Overview | `wp-admin/theme-editor.php` | 28 |
| You can use the theme file editor to edit the individual CSS and PHP files which make up your theme. | `wp-admin/theme-editor.php` | 30 |
| Begin by choosing a theme to edit from the dropdown menu and clicking the Select button. A list then appears of the theme&#8217;s template files. Clic… | `wp-admin/theme-editor.php` | 31 |
| For PHP files, you can use the documentation dropdown to select from functions recognized in that file. Look Up takes you to a web page with reference… | `wp-admin/theme-editor.php` | 32 |
| When using a keyboard to navigate: | `wp-admin/theme-editor.php` | 33 |
| In the editing area, the Tab key enters a tab character. | `wp-admin/theme-editor.php` | 35 |
| To move away from this area, press the Esc key followed by the Tab key. | `wp-admin/theme-editor.php` | 36 |
| Screen reader users: when in forms mode, you may need to press the Esc key twice. | `wp-admin/theme-editor.php` | 37 |
| After typing in your edits, click Update File. | `wp-admin/theme-editor.php` | 39 |
| <strong>Advice:</strong> Think very carefully about your site crashing if you are live-editing the theme currently in use. | `wp-admin/theme-editor.php` | 40 |
| … | `wp-admin/theme-editor.php` | +40 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "The requested theme does not exist." (`wp-admin/theme-editor.php:73`)

Rótulos de botão de envio: "Select", "Update File".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `edit-theme_`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_admin_url( 'theme-editor.php' )` | `wp-admin/theme-editor.php` | 13 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 3 checagens `current_user_can()`, 3 capacidades distintas. Primeira em `wp-admin/theme-editor.php:17`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 5 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: lista-de-extensoes

**ID no inventário**: `SCR-066`  
**Grupo**: Painel  
**Origem**: `wp-admin/plugins.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/plugins.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `activate_plugin`, `activate_plugins`, `deactivate_plugin`, `deactivate_plugins`, `delete_plugins`, `install_plugins`, `resume_plugin`, `update_plugins`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{_SERVER}}`, `{{referer}}`, `{{status}}`, `{{page}}`, `{{printf_args}} (7 mensagens com placeholder posicional)`  
**Transições de saída**: `plugins.php?plugin_status=$status&paged=$page&s=$s`, `import.php?import=`, `press-this.php`, `plugins.php?activate=true&plugin_status=$status&paged=$page&s=$s`, `plugins.php?activate-multi=true&plugin_status=$status&paged=$page&s=$s`, `plugins.php?deactivate=true&plugin_status=$status&paged=$page&s=$s`, `plugins.php?deactivate-multi=true&plugin_status=$status&paged=$page&s=$s`, `plugins.php?error=true&main=true&plugin_status=$status&paged=$page&s=$s`, `plugins.php?deleted=$plugins_to_delete&plugin_status=$status&paged=$page&`, `plugins.php?resume=true&plugin_status=$status&paged=$page&s=$s`  
**Linha no `ui/inventory.md` do Visor**: Installed Plugins

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/plugins.php"
spec.route: "/wp-admin/plugins.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Update Plugins" (`wp-admin/plugins.php:159`)
- **Primeiro `<h1>`**: `' . esc_html( $title ) . '` (`wp-admin/plugins.php:166`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/plugins.php` com 826 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **4**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/plugins.php` | 400 | expressão PHP — `<?php echo esc_url( $_SERVER[ … )` | `post` |
| `wp-admin/plugins.php` | 418 | expressão PHP — `<?php echo $referer ? esc_url( $referer ) : … )` | `post` |
| `wp-admin/plugins.php` | 805 | *(vazio: posta na própria URL)* | `get` |
| `wp-admin/plugins.php` | 809 | *(vazio: posta na própria URL)* | `post` |

Tabela de listagem: `WP_Plugins_List_Table` (`wp-admin/plugins.php:16`).

#### 3. Campos

**5** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/plugins.php` | `verify-delete` | `hidden` | não | 401 |
| `wp-admin/plugins.php` | `action` | `hidden` | não | 402 |
| `wp-admin/plugins.php` | `checked[]` | `hidden` | não | 406 |
| `wp-admin/plugins.php` | `plugin_status` | `hidden` | não | 811 |
| `wp-admin/plugins.php` | `paged` | `hidden` | não | 812 |

> ⚠️ **Nenhum** dos 5 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**70** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage plugins for this site. | `wp-admin/plugins.php` | 13 |
| Sorry, you are not allowed to activate this plugin. | `wp-admin/plugins.php` | 50 |
| Sorry, you are not allowed to activate plugins for this site. | `wp-admin/plugins.php` | 94 |
| Update Plugins | `wp-admin/plugins.php` | 159 |
| Sorry, you are not allowed to deactivate this plugin. | `wp-admin/plugins.php` | 201 |
| Sorry, you are not allowed to deactivate plugins for this site. | `wp-admin/plugins.php` | 228 |
| Sorry, you are not allowed to delete plugins for this site. | `wp-admin/plugins.php` | 271 |
| Delete Plugin | `wp-admin/plugins.php` | 343 |
| Caution: | `wp-admin/plugins.php` | 346 |
| This plugin may be active on other sites in the network. | `wp-admin/plugins.php` | 346 |
| You are about to remove the following plugin: | `wp-admin/plugins.php` | 355 |
| Delete Plugins | `wp-admin/plugins.php` | 357 |
| … | `wp-admin/plugins.php` | +58 strings |

Mensagens de recusa (`wp_die`), **9** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage plugins for this site." (`wp-admin/plugins.php:13`)
- "Sorry, you are not allowed to activate this plugin." (`wp-admin/plugins.php:50`)
- "Sorry, you are not allowed to activate plugins for this site." (`wp-admin/plugins.php:94`)
- "Sorry, you are not allowed to deactivate this plugin." (`wp-admin/plugins.php:201`)
- "Sorry, you are not allowed to deactivate plugins for this site." (`wp-admin/plugins.php:228`)
- "Sorry, you are not allowed to delete plugins for this site." (`wp-admin/plugins.php:271`)
- (+3 mensagens em `wp-admin/plugins.php`)

Rótulos de botão de envio: "No, return me to the plugin list".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **12** ações distintas: `activate-plugin_`, `bulk-plugins`, `bulk-plugins`, `plugin-activation-error_`, `deactivate-plugin_`, `bulk-plugins`, `bulk-plugins`, `bulk-plugins` (+4).
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **21**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `self_admin_url( "plugins.php?plugin_status=$status&paged=$page&s=$s" )` | `wp-admin/plugins.php` | 54 |
| `add_query_arg( '_error_nonce', wp_create_nonce( 'plugin-activation-error_' . $plugin ), $r` | `wp-admin/plugins.php` | 64 |
| `self_admin_url( 'import.php?import=' . str_replace( '-importer', '', dirname( $plugin ) ) ` | `wp-admin/plugins.php` | 83 |
| `self_admin_url( 'press-this.php' )` | `wp-admin/plugins.php` | 85 |
| `self_admin_url( "plugins.php?activate=true&plugin_status=$status&paged=$page&s=$s" )` | `wp-admin/plugins.php` | 88 |
| `self_admin_url( "plugins.php?plugin_status=$status&paged=$page&s=$s" )` | `wp-admin/plugins.php` | 122 |
| `self_admin_url( "plugins.php?activate-multi=true&plugin_status=$status&paged=$page&s=$s" )` | `wp-admin/plugins.php` | 144 |
| `self_admin_url( "plugins.php?plugin_status=$status&paged=$page&s=$s" )` | `wp-admin/plugins.php` | 207 |
| `self_admin_url( "plugins.php?deactivate=true&plugin_status=$status&paged=$page&s=$s" )` | `wp-admin/plugins.php` | 222 |
| `self_admin_url( "plugins.php?plugin_status=$status&paged=$page&s=$s" )` | `wp-admin/plugins.php` | 249 |
| +11 | `wp-admin/plugins.php` | |

Transição de recusa: qualquer um dos 9 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 8 checagens `current_user_can()`, 8 capacidades distintas. Primeira em `wp-admin/plugins.php:12`.
- **Origem da requisição**: 12 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 5 campos com `required`.
- **Recusa**: 9 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: instalar-extensao

**ID no inventário**: `SCR-067`  
**Grupo**: Painel  
**Origem**: `wp-admin/plugin-install.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/plugin-install.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `install_plugins`, `upload_plugins`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: `plugin-install.php`  
**Linha no `ui/inventory.md` do Visor**: Add Plugin

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/plugin-install.php"
spec.route: "/wp-admin/plugin-install.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Add Plugins" (`wp-admin/plugin-install.php:60`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/plugin-install.php` com 223 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tabela de listagem: `WP_Plugin_Install_List_Table` (`wp-admin/plugin-install.php:27`).

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**20** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to install plugins on this site. | `wp-admin/plugin-install.php` | 19 |
| Add Plugins | `wp-admin/plugin-install.php` | 60 |
| Overview | `wp-admin/plugin-install.php` | 105 |
| Plugins hook into WordPress to extend its functionality with custom features. Plugins are developed independently from the core WordPress application … | `wp-admin/plugin-install.php` | 109 |
| https://wordpress.org/plugins/ | `wp-admin/plugin-install.php` | 110 |
| You can find new plugins to install by searching or browsing the directory right here in your own Plugins section. | `wp-admin/plugin-install.php` | 112 |
| The search results will be updated as you type. | `wp-admin/plugin-install.php` | 112 |
| Adding Plugins | `wp-admin/plugin-install.php` | 119 |
| If you know what you are looking for, Search is your best bet. The Search screen has options to search the WordPress Plugin Directory for a particular… | `wp-admin/plugin-install.php` | 121 |
| If you just want to get an idea of what&#8217;s available, you can browse Featured and Popular plugins by using the links above the plugins list. Thes… | `wp-admin/plugin-install.php` | 122 |
| You can also browse a user&#8217;s favorite plugins, by using the Favorites link above the plugins list and entering their WordPress.org username. | `wp-admin/plugin-install.php` | 123 |
| If you want to install a plugin that you&#8217;ve downloaded elsewhere, click the Upload Plugin button above the plugins list. You will be prompted to… | `wp-admin/plugin-install.php` | 124 |
| … | `wp-admin/plugin-install.php` | +8 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to install plugins on this site." (`wp-admin/plugin-install.php:19`)

#### 5. Eventos e transições

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_admin_url( 'plugin-install.php' )` | `wp-admin/plugin-install.php` | 23 |
| `$location` | `wp-admin/plugin-install.php` | 37 |
| `add_query_arg( 'paged', $total_pages )` | `wp-admin/plugin-install.php` | 55 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/plugin-install.php:18`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: editor-de-arquivo-de-extensao

**ID no inventário**: `SCR-068`  
**Grupo**: Painel  
**Origem**: `wp-admin/plugin-editor.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/plugin-editor.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `edit_plugins`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{content}}`, `{{file}}`, `{{plugin}}`, `{{docs_select}}`, `{{return_url}}`, `{{printf_args}} (6 mensagens com placeholder posicional)`  
**Transições de saída**: `plugin-editor.php`  
**Linha no `ui/inventory.md` do Visor**: Plugin File Editor

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/plugin-editor.php"
spec.route: "/wp-admin/plugin-editor.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Edit Plugins" (`wp-admin/plugin-editor.php:22`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/plugin-editor.php:31`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/plugin-editor.php` com 386 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **2**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/plugin-editor.php` | 255 | `plugin-editor.php` | `get` |
| `wp-admin/plugin-editor.php` | 298 | `plugin-editor.php` | `post` |

#### 3. Campos

**5** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/plugin-editor.php` | `docs-list` | `select` | não | 183 |
| `wp-admin/plugin-editor.php` | `plugin` | `select` | não | 257 |
| `wp-admin/plugin-editor.php` | `newcontent` | `textarea` | não | 302 |
| `wp-admin/plugin-editor.php` | `action` | `hidden` | não | 303 |
| `wp-admin/plugin-editor.php` | `file` | `hidden` | não | 304 |

> ⚠️ **Nenhum** dos 5 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**42** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to edit plugins for this site. | `wp-admin/plugin-editor.php` | 18 |
| Edit Plugins | `wp-admin/plugin-editor.php` | 22 |
| No plugins are currently available. | `wp-admin/plugin-editor.php` | 34 |
| File does not exist! Please double check the name and try again. | `wp-admin/plugin-editor.php` | 123 |
| Files of this type are not editable. | `wp-admin/plugin-editor.php` | 131 |
| Overview | `wp-admin/plugin-editor.php` | 139 |
| You can use the plugin file editor to make changes to any of your plugins&#8217; individual PHP files. Be aware that if you make changes, plugins upda… | `wp-admin/plugin-editor.php` | 141 |
| Choose a plugin to edit from the dropdown menu and click the Select button. Click once on any file name to load it in the editor, and make your change… | `wp-admin/plugin-editor.php` | 142 |
| The documentation menu below the editor lists the PHP functions recognized in the plugin file. Clicking Look Up takes you to a web page about that par… | `wp-admin/plugin-editor.php` | 143 |
| When using a keyboard to navigate: | `wp-admin/plugin-editor.php` | 144 |
| In the editing area, the Tab key enters a tab character. | `wp-admin/plugin-editor.php` | 146 |
| To move away from this area, press the Esc key followed by the Tab key. | `wp-admin/plugin-editor.php` | 147 |
| … | `wp-admin/plugin-editor.php` | +30 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to edit plugins for this site." (`wp-admin/plugin-editor.php:18`)

Rótulos de botão de envio: "Select", "Update File".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `edit-plugin_`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_admin_url( 'plugin-editor.php' )` | `wp-admin/plugin-editor.php` | 13 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/plugin-editor.php:17`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 5 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: progresso-de-instalacao

**ID no inventário**: `SCR-069`  
**Grupo**: Painel  
**Origem**: `wp-admin/update.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/update.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `install_plugins`, `install_themes`, `update_plugins`, `update_themes`, `upload_plugins`, `upload_themes`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (4 mensagens com placeholder posicional)`  
**Transições de saída**: `update.php?action=activate-plugin&failure=true&plugin=`, `update.php?action=activate-plugin&success=true&plugin=`, `plugin-install.php`, `theme-install.php`  
**Linha no `ui/inventory.md` do Visor**: Progresso de instalacao/atualizacao

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/update.php"
spec.route: "/wp-admin/update.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Update Plugin" (`wp-admin/update.php:63`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/update.php` com 373 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**18** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to update plugins for this site. | `wp-admin/update.php` | 29 |
| Update Plugin | `wp-admin/update.php` | 63 |
| Plugin Reactivation | `wp-admin/update.php` | 90 |
| Plugin reactivated successfully. | `wp-admin/update.php` | 92 |
| Plugin failed to reactivate due to a fatal error. | `wp-admin/update.php` | 96 |
| Sorry, you are not allowed to install plugins on this site. | `wp-admin/update.php` | 107 |
| Plugin Installation | `wp-admin/update.php` | 128 |
| Installing Plugin: %s | `wp-admin/update.php` | 135 |
| Only .zip archives may be uploaded. | `wp-admin/update.php` | 158 |
| Upload Plugin | `wp-admin/update.php` | 164 |
| Installing plugin from uploaded file: %s | `wp-admin/update.php` | 171 |
| Sorry, you are not allowed to update themes for this site. | `wp-admin/update.php` | 211 |
| … | `wp-admin/update.php` | +6 strings |

Mensagens de recusa (`wp_die`), **5** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to update plugins for this site." (`wp-admin/update.php:29`)
- "Sorry, you are not allowed to install plugins on this site." (`wp-admin/update.php:107`)
- "Only .zip archives may be uploaded." (`wp-admin/update.php:158`)
- "Sorry, you are not allowed to update themes for this site." (`wp-admin/update.php:211`)
- "Sorry, you are not allowed to install themes on this site." (`wp-admin/update.php:262`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **11** ações distintas: `bulk-update-plugins`, `upgrade-plugin_`, `activate-plugin_`, `install-plugin_`, `plugin-upload`, `plugin-upload-cancel-overwrite`, `upgrade-theme_`, `bulk-update-themes` (+3).
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **4**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'update.php?action=activate-plugin&failure=true&plugin=' . urlencode( $plugin )` | `wp-admin/update.php` | 85 |
| `admin_url( 'update.php?action=activate-plugin&success=true&plugin=' . urlencode( $plugin )` | `wp-admin/update.php` | 87 |
| `self_admin_url( 'plugin-install.php' )` | `wp-admin/update.php` | 206 |
| `self_admin_url( 'theme-install.php' )` | `wp-admin/update.php` | 358 |

Transição de recusa: qualquer um dos 5 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 6 checagens `current_user_can()`, 6 capacidades distintas. Primeira em `wp-admin/update.php:28`.
- **Origem da requisição**: 11 ações de `nonce`. A falha leva a `SCR-112`.
- **Recusa**: 5 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: lista-de-usuarios

**ID no inventário**: `SCR-070`  
**Grupo**: Painel  
**Origem**: `wp-admin/users.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/users.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `create_users`, `delete_user`, `delete_users`, `edit_user`, `edit_users`, `list_users`, `manage_network_users`, `promote_user` (+3)  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{referer}}`, `{{id}}`, `{{printf_args}} (8 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: All Users

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/users.php"
spec.route: "/wp-admin/users.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Users" (`wp-admin/users.php:25`)
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/users.php:15`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/users.php` com 883 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **3**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/users.php` | 316 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/users.php` | 545 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/users.php` | 863 | *(vazio: posta na própria URL)* | `get` |

Tabela de listagem: `WP_Users_List_Table` (`wp-admin/users.php:21`).

#### 3. Campos

**5** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/users.php` | `wp_http_referer` | `hidden` | não | 96 |
| `wp-admin/users.php` | `users[]` | `hidden` | não | 360 |
| `wp-admin/users.php` | `delete_option[<?php echo esc_attr( $id ); ?>]` | `hidden` | sim | 399 |
| `wp-admin/users.php` | `action` | `hidden` | não | 475 |
| `wp-admin/users.php` | `role` | `hidden` | não | 868 |

#### 4. Mensagens literais

**77** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You need a higher level of permission. | `wp-admin/users.php` | 15 |
| Sorry, you are not allowed to list users. | `wp-admin/users.php` | 16 |
| Users | `wp-admin/users.php` | 25 |
| Overview | `wp-admin/users.php` | 34 |
| This screen lists all the existing users for your site. Each user has one of five defined roles as set by the site admin: Site Administrator, Editor, … | `wp-admin/users.php` | 35 |
| To add a new user for your site, click the Add User button at the top of the screen or Add User in the Users menu section. | `wp-admin/users.php` | 36 |
| Screen Content | `wp-admin/users.php` | 43 |
| You can customize the display of this screen in a number of ways: | `wp-admin/users.php` | 44 |
| You can hide/display columns based on your needs and decide how many users to list per screen using the Screen Options tab. | `wp-admin/users.php` | 46 |
| You can filter the list of users by User Role using the text links above the users list to show All, Administrator, Editor, Author, Contributor, or Su… | `wp-admin/users.php` | 47 |
| You can view all posts made by a user by clicking on the number under the Posts column. | `wp-admin/users.php` | 48 |
| Hovering over a row in the users list will display action links that allow you to manage users. You can perform the following actions: | `wp-admin/users.php` | 53 |
| … | `wp-admin/users.php` | +65 strings |

Mensagens de recusa (`wp_die`), **8** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to edit this user." (`wp-admin/users.php:114`)
- "Sorry, you are not allowed to give users that role." (`wp-admin/users.php:131`)
- "Sorry, you cannot remove your own role." (`wp-admin/users.php:149`)
- "User deletion is not allowed from this screen." (`wp-admin/users.php:180`)
- "Sorry, you are not allowed to delete users." (`wp-admin/users.php:200`)
- "Sorry, you are not allowed to delete that user." (`wp-admin/users.php:208`)
- (+2 mensagens em `wp-admin/users.php`)

Rótulos de botão de envio: "Confirm Deletion", "Confirm Removal".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **8** ações distintas: `bulk-users`, `delete-users`, `bulk-users`, `bulk-users`, `delete-users`, `remove-users`, `bulk-users`, `remove-users`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **14**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$redirect` | `wp-admin/users.php` | 118 |
| `add_query_arg( 'update', $update, $redirect )` | `wp-admin/users.php` | 175 |
| `$redirect` | `wp-admin/users.php` | 186 |
| `$url` | `wp-admin/users.php` | 195 |
| `$redirect` | `wp-admin/users.php` | 240 |
| `$redirect` | `wp-admin/users.php` | 251 |
| `$redirect` | `wp-admin/users.php` | 283 |
| `$redirect` | `wp-admin/users.php` | 294 |
| `$redirect` | `wp-admin/users.php` | 497 |
| `$redirect` | `wp-admin/users.php` | 518 |
| +4 | `wp-admin/users.php` | |

Transição de recusa: qualquer um dos 8 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 11 checagens `current_user_can()`, 11 capacidades distintas. Primeira em `wp-admin/users.php:13`.
- **Origem da requisição**: 8 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 1 de 5 campos com `required`.
- **Recusa**: 8 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: cadastro-de-usuario

**ID no inventário**: `SCR-071`  
**Grupo**: Painel  
**Origem**: `wp-admin/user-new.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/user-new.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `create_users`, `list_users`, `manage_network_users`, `promote_user`, `promote_users`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{label}}`, `{{type}}`, `{{new_user_login}}`, `{{new_user_email}}`, `{{new_user_firstname}}`, `{{new_user_lastname}}`, `{{new_user_uri}}`, `{{initial_password}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Add User

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/user-new.php"
spec.route: "/wp-admin/user-new.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Add User" (`wp-admin/user-new.php:269`)
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/user-new.php:15`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/user-new.php` com 674 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **2**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/user-new.php` | 459 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/user-new.php` | 519 | *(vazio: posta na própria URL)* | `post` |

#### 3. Campos

**12** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/user-new.php` | `action` | `hidden` | não | 469 |
| `wp-admin/user-new.php` | `email` | `text` | não | 475 |
| `wp-admin/user-new.php` | `role` | `select` | não | 479 |
| `wp-admin/user-new.php` | `noconfirmation` | `checkbox` | não | 488 |
| `wp-admin/user-new.php` | `user_login` | `text` | não | 544 |
| `wp-admin/user-new.php` | `first_name` | `text` | não | 553 |
| `wp-admin/user-new.php` | `last_name` | `text` | não | 557 |
| `wp-admin/user-new.php` | `url` | `url` | não | 561 |
| `wp-admin/user-new.php` | `pass1` | `password` | não | 603 |
| `wp-admin/user-new.php` | `pass2` | `password` | não | 616 |
| `wp-admin/user-new.php` | `pw_weak` | `checkbox` | não | 624 |
| `wp-admin/user-new.php` | `send_user_notification` | `checkbox` | não | 632 |

> ⚠️ **Nenhum** dos 12 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**57** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You need a higher level of permission. | `wp-admin/user-new.php` | 15 |
| Sorry, you are not allowed to add users to this network. | `wp-admin/user-new.php` | 16 |
| Sorry, you are not allowed to create users. | `wp-admin/user-new.php` | 23 |
| [%s] Joining Confirmation | `wp-admin/user-new.php` | 140 |
| Add User | `wp-admin/user-new.php` | 269 |
| To add a new user to your site, fill in the form on this screen and click the Add User button at the bottom. | `wp-admin/user-new.php` | 277 |
| Because this is a multisite installation, you may add accounts that already exist on the Network by specifying a username or email, and defining a rol… | `wp-admin/user-new.php` | 280 |
| New users will receive an email letting them know they&#8217;ve been added as a user for your site. This email will also contain their password. Check… | `wp-admin/user-new.php` | 281 |
| New users are automatically assigned a password, which they can change after logging in. You can view or edit the assigned password by clicking the Sh… | `wp-admin/user-new.php` | 283 |
| By default, new users will receive an email letting them know they&#8217;ve been added as a user for your site. This email will also contain a passwor… | `wp-admin/user-new.php` | 285 |
| Remember to click the Add User button at the bottom of this screen when you are finished. | `wp-admin/user-new.php` | 288 |
| Overview | `wp-admin/user-new.php` | 293 |
| … | `wp-admin/user-new.php` | +45 strings |

Rótulos de botão de envio: "Add Existing User", "Add User".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **4** ações distintas: `add-user`, `create-user`, `add-user`, `create-user`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **5**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `add_query_arg( array( 'update' => 'enter_email' ), 'user-new.php' )` | `wp-admin/user-new.php` | 44 |
| `add_query_arg( array( 'update' => 'does_not_exist' ), 'user-new.php' )` | `wp-admin/user-new.php` | 50 |
| `$redirect` | `wp-admin/user-new.php` | 187 |
| `$redirect` | `wp-admin/user-new.php` | 212 |
| `$redirect` | `wp-admin/user-new.php` | 262 |

#### 6. Validações

- **Autorização**: 5 checagens `current_user_can()`, 5 capacidades distintas. Primeira em `wp-admin/user-new.php:13`.
- **Origem da requisição**: 4 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 12 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: perfil-proprio

**ID no inventário**: `SCR-072`  
**Grupo**: Painel  
**Origem**: `wp-admin/profile.php`  
**Corpo renderizado em**: `wp-admin/user-edit.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/profile.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `create_users`, `edit_pages`, `edit_posts`, `edit_user`, `edit_users`, `install_languages`, `manage_network_options`, `manage_network_users` (+2)  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{wp_http_referer}}`, `{{profile_user}}`, `{{item}}`, `{{name}}`, `{{user_id}}`, `{{printf_args}} (8 mensagens com placeholder posicional)`  
**Transições de saída**: `profile.php`  
**Linha no `ui/inventory.md` do Visor**: Profile

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/profile.php"
spec.route: "/wp-admin/profile.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Profile" (`wp-admin/user-edit.php:41`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/profile.php` com 19 linhas, `wp-admin/user-edit.php` com 1037 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/user-edit.php` | 277 | expressão PHP — `<?php echo esc_url( self_admin_url( IS_PROFILE_PAGE ? … )` | `get` |

Tabela de listagem: `WP_Application_Passwords_List_Table` (`wp-admin/user-edit.php:878`).

#### 3. Campos

**25** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/user-edit.php` | `wp_http_referer` | `hidden` | não | 289 |
| `wp-admin/user-edit.php` | `from` | `hidden` | não | 292 |
| `wp-admin/user-edit.php` | `checkuser_id` | `hidden` | não | 293 |
| `wp-admin/user-edit.php` | `rich_editing` | `checkbox` | não | 303 |
| `wp-admin/user-edit.php` | `syntax_highlighting` | `checkbox` | não | 327 |
| `wp-admin/user-edit.php` | `comment_shortcuts` | `checkbox` | não | 361 |
| `wp-admin/user-edit.php` | `admin_bar_front` | `checkbox` | não | 373 |
| `wp-admin/user-edit.php` | `infinite_scrolling` | `checkbox` | não | 383 |
| `wp-admin/user-edit.php` | `user_login` | `text` | não | 457 |
| `wp-admin/user-edit.php` | `role` | `select` | não | 464 |
| `wp-admin/user-edit.php` | `super_admin` | `checkbox` | não | 489 |
| `wp-admin/user-edit.php` | `first_name` | `text` | não | 498 |
| `wp-admin/user-edit.php` | `last_name` | `text` | não | 509 |
| `wp-admin/user-edit.php` | `nickname` | `text` | não | 520 |
| `wp-admin/user-edit.php` | `display_name` | `select` | não | 532 |
| `wp-admin/user-edit.php` | `email` | `email` | não | 574 |
| `wp-admin/user-edit.php` | `url` | `url` | não | 609 |
| `wp-admin/user-edit.php` | `<?php echo $name; ?>` | `text` | não | 632 |
| `wp-admin/user-edit.php` | `description` | `textarea` | não | 643 |
| `wp-admin/user-edit.php` | `pass1` | `password` | não | 706 |
| `wp-admin/user-edit.php` | `pass2` | `password` | não | 723 |
| `wp-admin/user-edit.php` | `pw_weak` | `checkbox` | não | 735 |
| `wp-admin/user-edit.php` | … | | | +3 campos |

#### 4. Mensagens literais

**101** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Invalid user ID. | `wp-admin/user-edit.php` | 28 |
| Profile | `wp-admin/user-edit.php` | 41 |
| Edit User %s | `wp-admin/user-edit.php` | 45 |
| Your profile contains information about you (your &#8220;account&#8221;) as well as some personal options related to using WordPress. | `wp-admin/user-edit.php` | 60 |
| You can change your password, turn on keyboard shortcuts, change the color scheme of your WordPress administration screens, and turn off the WYSIWYG (… | `wp-admin/user-edit.php` | 61 |
| You can select the language you wish to use while using the WordPress administration screen without affecting the language site visitors see. | `wp-admin/user-edit.php` | 62 |
| Your username cannot be changed, but you can use other fields to enter your real name or a nickname, and change which name to display on your posts. | `wp-admin/user-edit.php` | 63 |
| You can log out of other devices, such as your phone or a public computer, by clicking the Log Out Everywhere Else button. | `wp-admin/user-edit.php` | 64 |
| Required fields are indicated; the rest are optional. Profile information will only be displayed if your theme is set up to do so. | `wp-admin/user-edit.php` | 65 |
| Remember to click the Update Profile button when you are finished. | `wp-admin/user-edit.php` | 66 |
| Overview | `wp-admin/user-edit.php` | 71 |
| For more information: | `wp-admin/user-edit.php` | 77 |
| … | `wp-admin/user-edit.php` | +89 strings |

Mensagens de recusa (`wp_die`), **2** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Invalid user ID." (`wp-admin/user-edit.php:28`)
- "Sorry, you are not allowed to edit this user." (`wp-admin/user-edit.php:104`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **3** ações distintas: `dismiss-`, `update-user_`, `update-user_`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **4**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `add_query_arg( array( 'updated' => 'true' ), self_admin_url( 'profile.php' ) )` | `wp-admin/user-edit.php` | 119 |
| `add_query_arg( array( 'error' => 'new-email' ), self_admin_url( 'profile.php' ) )` | `wp-admin/user-edit.php` | 122 |
| `add_query_arg( array( 'updated' => 'true' ), self_admin_url( 'profile.php' ) )` | `wp-admin/user-edit.php` | 127 |
| `$redirect` | `wp-admin/user-edit.php` | 186 |

Transição de recusa: qualquer um dos 2 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 10 checagens `current_user_can()`, 10 capacidades distintas. Primeira em `wp-admin/user-edit.php:48`.
- **Origem da requisição**: 3 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 1 de 25 campos com `required`.
- **Recusa**: 2 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: edicao-de-usuario

**ID no inventário**: `SCR-073`  
**Grupo**: Painel  
**Origem**: `wp-admin/user-edit.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/user-edit.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `create_users`, `edit_pages`, `edit_posts`, `edit_user`, `edit_users`, `install_languages`, `manage_network_options`, `manage_network_users` (+2)  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{wp_http_referer}}`, `{{profile_user}}`, `{{item}}`, `{{name}}`, `{{user_id}}`, `{{printf_args}} (8 mensagens com placeholder posicional)`  
**Transições de saída**: `profile.php`  
**Linha no `ui/inventory.md` do Visor**: Editar outro usuario

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/user-edit.php"
spec.route: "/wp-admin/user-edit.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Profile" (`wp-admin/user-edit.php:41`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/user-edit.php` com 1037 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/user-edit.php` | 277 | expressão PHP — `<?php echo esc_url( self_admin_url( IS_PROFILE_PAGE ? … )` | `get` |

Tabela de listagem: `WP_Application_Passwords_List_Table` (`wp-admin/user-edit.php:878`).

#### 3. Campos

**25** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/user-edit.php` | `wp_http_referer` | `hidden` | não | 289 |
| `wp-admin/user-edit.php` | `from` | `hidden` | não | 292 |
| `wp-admin/user-edit.php` | `checkuser_id` | `hidden` | não | 293 |
| `wp-admin/user-edit.php` | `rich_editing` | `checkbox` | não | 303 |
| `wp-admin/user-edit.php` | `syntax_highlighting` | `checkbox` | não | 327 |
| `wp-admin/user-edit.php` | `comment_shortcuts` | `checkbox` | não | 361 |
| `wp-admin/user-edit.php` | `admin_bar_front` | `checkbox` | não | 373 |
| `wp-admin/user-edit.php` | `infinite_scrolling` | `checkbox` | não | 383 |
| `wp-admin/user-edit.php` | `user_login` | `text` | não | 457 |
| `wp-admin/user-edit.php` | `role` | `select` | não | 464 |
| `wp-admin/user-edit.php` | `super_admin` | `checkbox` | não | 489 |
| `wp-admin/user-edit.php` | `first_name` | `text` | não | 498 |
| `wp-admin/user-edit.php` | `last_name` | `text` | não | 509 |
| `wp-admin/user-edit.php` | `nickname` | `text` | não | 520 |
| `wp-admin/user-edit.php` | `display_name` | `select` | não | 532 |
| `wp-admin/user-edit.php` | `email` | `email` | não | 574 |
| `wp-admin/user-edit.php` | `url` | `url` | não | 609 |
| `wp-admin/user-edit.php` | `<?php echo $name; ?>` | `text` | não | 632 |
| `wp-admin/user-edit.php` | `description` | `textarea` | não | 643 |
| `wp-admin/user-edit.php` | `pass1` | `password` | não | 706 |
| `wp-admin/user-edit.php` | `pass2` | `password` | não | 723 |
| `wp-admin/user-edit.php` | `pw_weak` | `checkbox` | não | 735 |
| `wp-admin/user-edit.php` | … | | | +3 campos |

#### 4. Mensagens literais

**101** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Invalid user ID. | `wp-admin/user-edit.php` | 28 |
| Profile | `wp-admin/user-edit.php` | 41 |
| Edit User %s | `wp-admin/user-edit.php` | 45 |
| Your profile contains information about you (your &#8220;account&#8221;) as well as some personal options related to using WordPress. | `wp-admin/user-edit.php` | 60 |
| You can change your password, turn on keyboard shortcuts, change the color scheme of your WordPress administration screens, and turn off the WYSIWYG (… | `wp-admin/user-edit.php` | 61 |
| You can select the language you wish to use while using the WordPress administration screen without affecting the language site visitors see. | `wp-admin/user-edit.php` | 62 |
| Your username cannot be changed, but you can use other fields to enter your real name or a nickname, and change which name to display on your posts. | `wp-admin/user-edit.php` | 63 |
| You can log out of other devices, such as your phone or a public computer, by clicking the Log Out Everywhere Else button. | `wp-admin/user-edit.php` | 64 |
| Required fields are indicated; the rest are optional. Profile information will only be displayed if your theme is set up to do so. | `wp-admin/user-edit.php` | 65 |
| Remember to click the Update Profile button when you are finished. | `wp-admin/user-edit.php` | 66 |
| Overview | `wp-admin/user-edit.php` | 71 |
| For more information: | `wp-admin/user-edit.php` | 77 |
| … | `wp-admin/user-edit.php` | +89 strings |

Mensagens de recusa (`wp_die`), **2** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Invalid user ID." (`wp-admin/user-edit.php:28`)
- "Sorry, you are not allowed to edit this user." (`wp-admin/user-edit.php:104`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **3** ações distintas: `dismiss-`, `update-user_`, `update-user_`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **4**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `add_query_arg( array( 'updated' => 'true' ), self_admin_url( 'profile.php' ) )` | `wp-admin/user-edit.php` | 119 |
| `add_query_arg( array( 'error' => 'new-email' ), self_admin_url( 'profile.php' ) )` | `wp-admin/user-edit.php` | 122 |
| `add_query_arg( array( 'updated' => 'true' ), self_admin_url( 'profile.php' ) )` | `wp-admin/user-edit.php` | 127 |
| `$redirect` | `wp-admin/user-edit.php` | 186 |

Transição de recusa: qualquer um dos 2 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 10 checagens `current_user_can()`, 10 capacidades distintas. Primeira em `wp-admin/user-edit.php:48`.
- **Origem da requisição**: 3 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 1 de 25 campos com `required`.
- **Recusa**: 2 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: autorizar-aplicacao

**ID no inventário**: `SCR-074`  
**Grupo**: Painel  
**Origem**: `wp-admin/authorize-application.php`  
**Modo aplicado**: **literal**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/authorize-application.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{app_id}}`, `{{success_url}}`, `{{reject_url}}`, `{{app_name}}`, `{{printf_args}} (3 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Autorizar aplicacao

> 🚫 **Bloqueada por RF-13.** Esta tela está em modo literal e **não há captura do legado** para ela. A spec abaixo não contém nenhuma afirmação de pixel: o que ela fixa é o contrato de DOM e de nome de campo, extraído do código com `arquivo:linha` em cada item. A deviation `DEV-002` está `pendente` e **bloqueia o handoff ao Inspector** desta tela até que alguém capture o legado rodando ou aceite explicitamente modernizado para ela.
>
> Razão de estar em literal: C: fluxo de senha de aplicacao negociado com aplicacao externa


### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: literal
spec.legacy_origin: "wp-admin/authorize-application.php"
spec.route: "/wp-admin/authorize-application.php"
spec.deviations: [DEV-001, DEV-002]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: dom-and-field-names   # não pixel; ver DEV-002
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Authorize Application" (`wp-admin/authorize-application.php:66`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/authorize-application.php:138`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/authorize-application.php` com 334 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/authorize-application.php` | 239 | expressão PHP — `<?php echo esc_url( admin_url( … )` | `get` |

#### 3. Campos

**5** campos distintos. O nome do campo é contrato **e, nesta tela, contrato externo** (ver o aviso de RF-13 acima): não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/authorize-application.php` | `action` | `hidden` | não | 241 |
| `wp-admin/authorize-application.php` | `app_id` | `hidden` | não | 242 |
| `wp-admin/authorize-application.php` | `success_url` | `hidden` | não | 243 |
| `wp-admin/authorize-application.php` | `reject_url` | `hidden` | não | 244 |
| `wp-admin/authorize-application.php` | `app_name` | `text` | não | 248 |

> ⚠️ **Nenhum** dos 5 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**18** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Authorize Application | `wp-admin/authorize-application.php` | 66 |
| The Authorize Application request is not allowed. | `wp-admin/authorize-application.php` | 87 |
| Cannot Authorize Application | `wp-admin/authorize-application.php` | 88 |
| Your website appears to use Basic Authentication, which is not currently compatible with application passwords. | `wp-admin/authorize-application.php` | 94 |
| Go Back | `wp-admin/authorize-application.php` | 98 |
| Application passwords are not available for your account. Please contact the site administrator for assistance. | `wp-admin/authorize-application.php` | 106 |
| Application passwords are not available. | `wp-admin/authorize-application.php` | 108 |
| An application would like to connect to your account. | `wp-admin/authorize-application.php` | 152 |
| Would you like to give the application identifying itself as %s access to your account? You should only do this if you trust the application in questi… | `wp-admin/authorize-application.php` | 158 |
| Would you like to give this application access to your account? You should only do this if you trust the application in question. | `wp-admin/authorize-application.php` | 164 |
| Your new password for %s is: | `wp-admin/authorize-application.php` | 209 |
| Be sure to save this in a safe location. You will not be able to retrieve it. | `wp-admin/authorize-application.php` | 215 |
| … | `wp-admin/authorize-application.php` | +6 strings |

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `authorize_application_password`, `authorize_application_password`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$redirect` | `wp-admin/authorize-application.php` | 60 |

#### 6. Validações

- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 5 campos com `required`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-002`: modo literal sem captura do legado — RF-13. **Pendente, bloqueia o handoff ao Inspector** ([`screen_deviation_log.md`](screen_deviation_log.md#dev-002)).

### Estados

Preserva os estados do legado. Esta tela está em modo **literal** e o legado não tem disposição explícita de estado: a página é montada inteira no servidor. Nenhum estado novo foi inventado.

---

## Tela: ferramentas-disponiveis

**ID no inventário**: `SCR-075`  
**Grupo**: Painel  
**Origem**: `wp-admin/tools.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/tools.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `import`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: `options-privacy.php?tab=policyguide`, `export-personal-data.php`, `erase-personal-data.php`  
**Linha no `ui/inventory.md` do Visor**: Available Tools

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/tools.php"
spec.route: "/wp-admin/tools.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Tools" (`wp-admin/tools.php:43`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/tools.php:64`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/tools.php` com 100 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**8** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Tools | `wp-admin/tools.php` | 43 |
| Categories and Tags Converter | `wp-admin/tools.php` | 48 |
| Categories have hierarchy, meaning that you can nest sub-categories. Tags do not have hierarchy and cannot be nested. Sometimes people start out using… | `wp-admin/tools.php` | 49 |
| The Categories and Tags Converter link on this screen will take you to the Import screen, where that Converter is one of the plugins you can install. … | `wp-admin/tools.php` | 50 |
| For more information: | `wp-admin/tools.php` | 55 |
| <a href="https://wordpress.org/documentation/article/tools-screen/">Documentation on Tools</a> | `wp-admin/tools.php` | 56 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/tools.php` | 57 |
| If you want to convert your categories to tags (or vice versa), use the <a href="%s">Categories and Tags Converter</a> available from the Import scree… | `wp-admin/tools.php` | 78 |

#### 5. Eventos e transições

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'options-privacy.php?tab=policyguide' ), 301` | `wp-admin/tools.php` | 24 |
| `admin_url( 'export-personal-data.php' ), 301` | `wp-admin/tools.php` | 30 |
| `admin_url( 'erase-personal-data.php' ), 301` | `wp-admin/tools.php` | 34 |

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/tools.php:67`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: importar

**ID no inventário**: `SCR-076`  
**Grupo**: Painel  
**Origem**: `wp-admin/import.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/import.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `import`, `install_plugins`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (6 mensagens com placeholder posicional)`  
**Transições de saída**: `admin.php?import=`  
**Linha no `ui/inventory.md` do Visor**: Import

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/import.php"
spec.route: "/wp-admin/import.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Import" (`wp-admin/import.php:19`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/import.php:62`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/import.php` com 254 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**20** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to import content into this site. | `wp-admin/import.php` | 15 |
| Import | `wp-admin/import.php` | 19 |
| Overview | `wp-admin/import.php` | 24 |
| This screen lists links to plugins to import data from blogging/content management platforms. Choose the platform you want to import from, and click I… | `wp-admin/import.php` | 25 |
| In previous versions of WordPress, all importers were built-in. They have been turned into plugins since most people only use them once or infrequentl… | `wp-admin/import.php` | 26 |
| For more information: | `wp-admin/import.php` | 31 |
| <a href="https://wordpress.org/documentation/article/tools-import-screen/">Documentation on Import</a> | `wp-admin/import.php` | 32 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/import.php` | 33 |
| Error: | `wp-admin/import.php` | 65 |
| The %s importer is invalid or is not installed. | `wp-admin/import.php` | 67 |
| If you have posts or comments in another system, WordPress can import those into this site. To get started, choose a system to import from below: | `wp-admin/import.php` | 78 |
| No importers are available. | `wp-admin/import.php` | 102 |
| … | `wp-admin/import.php` | +8 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to import content into this site." (`wp-admin/import.php:15`)

#### 5. Eventos e transições

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'admin.php?import=' . $importer_id )` | `wp-admin/import.php` | 47 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/import.php:14`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: exportar

**ID no inventário**: `SCR-077`  
**Grupo**: Painel  
**Origem**: `wp-admin/export.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/export.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `export`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{status}}`, `{{post_type}}`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Export

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/export.php"
spec.route: "/wp-admin/export.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Export" (`wp-admin/export.php:20`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/export.php:174`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/export.php` com 350 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/export.php` | 181 | *(vazio: posta na própria URL)* | `get` |

#### 3. Campos

**10** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/export.php` | `download` | `hidden` | não | 189 |
| `wp-admin/export.php` | `content` | `radio` | não | 190 |
| `wp-admin/export.php` | `post_start_date` | `select` | não | 225 |
| `wp-admin/export.php` | `post_end_date` | `select` | não | 230 |
| `wp-admin/export.php` | `post_status` | `select` | não | 238 |
| `wp-admin/export.php` | `page_start_date` | `select` | não | 277 |
| `wp-admin/export.php` | `page_end_date` | `select` | não | 282 |
| `wp-admin/export.php` | `page_status` | `select` | não | 290 |
| `wp-admin/export.php` | `attachment_start_date` | `select` | não | 322 |
| `wp-admin/export.php` | `attachment_end_date` | `select` | não | 327 |

> ⚠️ **Nenhum** dos 10 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**27** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to export the content of this site. | `wp-admin/export.php` | 13 |
| Export | `wp-admin/export.php` | 20 |
| Overview | `wp-admin/export.php` | 51 |
| You can export a file of your site&#8217;s content in order to import it into another installation or platform. The export file will be an XML file fo… | `wp-admin/export.php` | 52 |
| Once generated, your WXR file can be imported by another WordPress site or by another blogging platform able to access this format. | `wp-admin/export.php` | 53 |
| For more information: | `wp-admin/export.php` | 58 |
| <a href="https://wordpress.org/documentation/article/tools-export-screen/">Documentation on Export</a> | `wp-admin/export.php` | 59 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/export.php` | 60 |
| When you click the button below WordPress will create an XML file for you to save to your computer. | `wp-admin/export.php` | 176 |
| This format, which is called WordPress eXtended RSS or WXR, will contain your posts, pages, comments, custom fields, categories, and tags. | `wp-admin/export.php` | 177 |
| Once you&#8217;ve saved the download file, you can use the Import function in another WordPress installation to import the content from this site. | `wp-admin/export.php` | 178 |
| Choose what to export | `wp-admin/export.php` | 180 |
| … | `wp-admin/export.php` | +15 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to export the content of this site." (`wp-admin/export.php:13`)

Rótulos de botão de envio: "Download Export File".

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/export.php:12`.
- **Obrigatoriedade no cliente**: 0 de 10 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: saude-do-site

**ID no inventário**: `SCR-078`  
**Grupo**: Painel  
**Origem**: `wp-admin/site-health.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/site-health.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `update_https`, `view_site_health_checks`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (4 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Site Health

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/site-health.php"
spec.route: "/wp-admin/site-health.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: dinâmico — `sprintf(` (`wp-admin/site-health.php:41`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/site-health.php` com 325 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**29** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Status | `wp-admin/site-health.php` | 16 |
| Info | `wp-admin/site-health.php` | 18 |
| Site Health - %s | `wp-admin/site-health.php` | 43 |
| Sorry, you are not allowed to access site health information. | `wp-admin/site-health.php` | 48 |
| Sorry, you are not allowed to update this site to HTTPS. | `wp-admin/site-health.php` | 62 |
| It looks like HTTPS is not supported for your website at this point. | `wp-admin/site-health.php` | 66 |
| Overview | `wp-admin/site-health.php` | 80 |
| This screen allows you to obtain a health diagnosis of your site, and displays an overall rating of the status of your installation. | `wp-admin/site-health.php` | 82 |
| In the Status tab, you can see critical information about your WordPress configuration, along with anything else that requires your attention. | `wp-admin/site-health.php` | 83 |
| In the Info tab, you will find all the details about the configuration of your WordPress site, server, and database. There is also an export feature t… | `wp-admin/site-health.php` | 84 |
| For more information: | `wp-admin/site-health.php` | 89 |
| <a href="https://wordpress.org/documentation/article/site-health-screen/">Documentation on Site Health tool</a> | `wp-admin/site-health.php` | 90 |
| … | `wp-admin/site-health.php` | +17 strings |

Mensagens de recusa (`wp_die`), **3** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to access site health information." (`wp-admin/site-health.php:48`)
- "Sorry, you are not allowed to update this site to HTTPS." (`wp-admin/site-health.php:62`)
- "It looks like HTTPS is not supported for your website at this point." (`wp-admin/site-health.php:66`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `wp_update_https`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `add_query_arg( 'https_updated', (int) $result, wp_get_referer() )` | `wp-admin/site-health.php` | 71 |

Transição de recusa: qualquer um dos 3 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/site-health.php:47`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Recusa**: 3 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: saude-do-site-informacoes

**ID no inventário**: `SCR-079`  
**Grupo**: Painel  
**Origem**: `wp-admin/site-health-info.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/site-health-info.php`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{section}}`, `{{details}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Site Health -> Info

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/site-health-info.php"
spec.route: "/wp-admin/site-health-info.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/site-health-info.php` com 143 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. **Não é rota.** Abre com `if ( ! defined( "ABSPATH" ) ) exit;` (`wp-admin/site-health-info.php:10`): é a aba *Info* incluída por `wp-admin/site-health.php`, que é quem carrega a moldura.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**6** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| The Site Health check requires JavaScript. | `wp-admin/site-health-info.php` | 24 |
| Site Health Info | `wp-admin/site-health-info.php` | 42 |
| This page can show you every detail about the configuration of your WordPress website. For any improvements that could be made, see the <a href="%s">S… | `wp-admin/site-health-info.php` | 48 |
| If you want to export a handy list of all the information on this page, you can use the button below to copy it to the clipboard. You can then paste i… | `wp-admin/site-health-info.php` | 52 |
| Copy site info to clipboard | `wp-admin/site-health-info.php` | 58 |
| Copied! | `wp-admin/site-health-info.php` | 60 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: exportar-dados-pessoais

**ID no inventário**: `SCR-080`  
**Grupo**: Painel  
**Origem**: `wp-admin/export-personal-data.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/export-personal-data.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `export_others_personal_data`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Export Personal Data

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/export-personal-data.php"
spec.route: "/wp-admin/export-personal-data.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Export Personal Data" (`wp-admin/export-personal-data.php:17`)
- **Primeiro `<h1>`**: `<?php esc_html_e( 'Export Personal Data' ); ?>` (`wp-admin/export-personal-data.php:107`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/export-personal-data.php` com 166 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **3**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/export-personal-data.php` | 113 | expressão PHP — `<?php echo esc_url( admin_url( … )` | `get` |
| `wp-admin/export-personal-data.php` | 149 | *(vazio: posta na própria URL)* | `get` |
| `wp-admin/export-personal-data.php` | 156 | *(vazio: posta na própria URL)* | `post` |

Tabela de listagem: `WP_Privacy_Data_Export_Requests_List_Table` (`wp-admin/export-personal-data.php:90`).

#### 3. Campos

**7** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/export-personal-data.php` | `username_or_email_for_privacy_request` | `text` | sim | 122 |
| `wp-admin/export-personal-data.php` | `send_confirmation_email` | `checkbox` | não | 130 |
| `wp-admin/export-personal-data.php` | `action` | `hidden` | não | 142 |
| `wp-admin/export-personal-data.php` | `type_of_action` | `hidden` | não | 143 |
| `wp-admin/export-personal-data.php` | `filter-status` | `hidden` | não | 151 |
| `wp-admin/export-personal-data.php` | `orderby` | `hidden` | não | 152 |
| `wp-admin/export-personal-data.php` | `order` | `hidden` | não | 153 |

#### 4. Mensagens literais

**31** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to export personal data on this site. | `wp-admin/export-personal-data.php` | 13 |
| Export Personal Data | `wp-admin/export-personal-data.php` | 17 |
| Overview | `wp-admin/export-personal-data.php` | 23 |
| This screen is where you manage requests for an export of personal data. | `wp-admin/export-personal-data.php` | 25 |
| Privacy Laws around the world require businesses and online services to provide an export of some of the data they collect about an individual, and to… | `wp-admin/export-personal-data.php` | 26 |
| The tool associates data stored in WordPress with a supplied email address, including profile data and comments. | `wp-admin/export-personal-data.php` | 27 |
| Note: Since this tool only gathers data from WordPress and participating plugins, you may need to do more to comply with export requests. For example,… | `wp-admin/export-personal-data.php` | 28 |
| Default Data | `wp-admin/export-personal-data.php` | 35 |
| WordPress collects (but <em>never</em> publishes) a limited amount of data from registered users who have logged in to the site. Generally, these user… | `wp-admin/export-personal-data.php` | 37 |
| <strong>Profile Information</strong> &mdash; user email address, username, display name, nickname, first name, last name, description/bio, and registr… | `wp-admin/export-personal-data.php` | 38 |
| <strong>Community Events Location</strong> &mdash; The IP Address of the user, which populates the Upcoming Community Events dashboard widget with rel… | `wp-admin/export-personal-data.php` | 39 |
| <strong>Session Tokens</strong> &mdash; User login information, IP Addresses, Expiration Date, User Agent (Browser/OS), and Last Login. | `wp-admin/export-personal-data.php` | 40 |
| … | `wp-admin/export-personal-data.php` | +19 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to export personal data on this site." (`wp-admin/export-personal-data.php:13`)

Rótulos de botão de envio: "Send Request".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `personal-data-request`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/export-personal-data.php:12`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 1 de 7 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: apagar-dados-pessoais

**ID no inventário**: `SCR-081`  
**Grupo**: Painel  
**Origem**: `wp-admin/erase-personal-data.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/erase-personal-data.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `delete_users`, `erase_others_personal_data`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Erase Personal Data

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/erase-personal-data.php"
spec.route: "/wp-admin/erase-personal-data.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Erase Personal Data" (`wp-admin/erase-personal-data.php:17`)
- **Primeiro `<h1>`**: `<?php esc_html_e( 'Erase Personal Data' ); ?>` (`wp-admin/erase-personal-data.php:107`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/erase-personal-data.php` com 166 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **3**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/erase-personal-data.php` | 113 | expressão PHP — `<?php echo esc_url( admin_url( … )` | `get` |
| `wp-admin/erase-personal-data.php` | 149 | *(vazio: posta na própria URL)* | `get` |
| `wp-admin/erase-personal-data.php` | 156 | *(vazio: posta na própria URL)* | `post` |

Tabela de listagem: `WP_Privacy_Data_Removal_Requests_List_Table` (`wp-admin/erase-personal-data.php:90`).

#### 3. Campos

**7** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/erase-personal-data.php` | `username_or_email_for_privacy_request` | `text` | sim | 122 |
| `wp-admin/erase-personal-data.php` | `send_confirmation_email` | `checkbox` | não | 130 |
| `wp-admin/erase-personal-data.php` | `action` | `hidden` | não | 142 |
| `wp-admin/erase-personal-data.php` | `type_of_action` | `hidden` | não | 143 |
| `wp-admin/erase-personal-data.php` | `filter-status` | `hidden` | não | 151 |
| `wp-admin/erase-personal-data.php` | `orderby` | `hidden` | não | 152 |
| `wp-admin/erase-personal-data.php` | `order` | `hidden` | não | 153 |

#### 4. Mensagens literais

**31** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to erase personal data on this site. | `wp-admin/erase-personal-data.php` | 13 |
| Erase Personal Data | `wp-admin/erase-personal-data.php` | 17 |
| Overview | `wp-admin/erase-personal-data.php` | 23 |
| This screen is where you manage requests to erase personal data. | `wp-admin/erase-personal-data.php` | 25 |
| Privacy Laws around the world require businesses and online services to delete, anonymize, or forget the data they collect about an individual. The ri… | `wp-admin/erase-personal-data.php` | 26 |
| The tool associates data stored in WordPress with a supplied email address, including profile data and comments. | `wp-admin/erase-personal-data.php` | 27 |
| Note: As this tool only gathers data from WordPress and participating plugins, you may need to do more to comply with erasure requests. For example, y… | `wp-admin/erase-personal-data.php` | 28 |
| Default Data | `wp-admin/erase-personal-data.php` | 35 |
| WordPress collects (but <em>never</em> publishes) a limited amount of data from logged-in users but then deletes it or anonymizes it. That data can in… | `wp-admin/erase-personal-data.php` | 37 |
| <strong>Profile Information</strong> &mdash; user email address, username, display name, nickname, first name, last name, description/bio, and registr… | `wp-admin/erase-personal-data.php` | 38 |
| <strong>Community Events Location</strong> &mdash; The IP Address of the user which is used for the Upcoming Community Events shown in the dashboard w… | `wp-admin/erase-personal-data.php` | 39 |
| <strong>Session Tokens</strong> &mdash; User login information, IP Addresses, Expiration Date, User Agent (Browser/OS), and Last Login. | `wp-admin/erase-personal-data.php` | 40 |
| … | `wp-admin/erase-personal-data.php` | +19 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to erase personal data on this site." (`wp-admin/erase-personal-data.php:13`)

Rótulos de botão de envio: "Send Request".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `personal-data-request`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/erase-personal-data.php:12`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 1 de 7 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: apagar-site-da-rede

**ID no inventário**: `SCR-082`  
**Grupo**: Painel  
**Origem**: `wp-admin/ms-delete-site.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/ms-delete-site.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `delete_site`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (4 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Delete Site

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/ms-delete-site.php"
spec.route: "/wp-admin/ms-delete-site.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Delete Site" (`wp-admin/ms-delete-site.php:39`)
- **Primeiro `<h1>`**: `' . esc_html( $title ) . '` (`wp-admin/ms-delete-site.php:45`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/ms-delete-site.php` com 146 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/ms-delete-site.php` | 127 | *(vazio: posta na própria URL)* | `post` |

#### 3. Campos

**2** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/ms-delete-site.php` | `action` | `hidden` | não | 129 |
| `wp-admin/ms-delete-site.php` | `confirmdelete` | `checkbox` | não | 130 |

> ⚠️ **Nenhum** dos 2 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**11** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Multisite support is not enabled. | `wp-admin/ms-delete-site.php` | 13 |
| Sorry, you are not allowed to delete this site. | `wp-admin/ms-delete-site.php` | 17 |
| Thank you for using %s, your site has been deleted. Happy trails to you until we meet again. | `wp-admin/ms-delete-site.php` | 26 |
| Sorry, the link you clicked is stale. Please select another option. | `wp-admin/ms-delete-site.php` | 31 |
| Delete Site | `wp-admin/ms-delete-site.php` | 39 |
| [%s] Delete My Site | `wp-admin/ms-delete-site.php` | 100 |
| Thank you. Please check your email for a link to confirm your action. Your site will not be deleted until this link is clicked. | `wp-admin/ms-delete-site.php` | 111 |
| If you do not want to use your %s site any more, you can delete it using the form below. When you click <strong>Delete My Site Permanently</strong> yo… | `wp-admin/ms-delete-site.php` | 120 |
| Remember, once deleted your site cannot be restored. | `wp-admin/ms-delete-site.php` | 125 |
| I'm sure I want to permanently delete my site, and I am aware I can never get it back or use %s again. | `wp-admin/ms-delete-site.php` | 134 |
| Delete My Site Permanently | `wp-admin/ms-delete-site.php` | 139 |

Mensagens de recusa (`wp_die`), **3** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Multisite support is not enabled." (`wp-admin/ms-delete-site.php:13`)
- "Sorry, you are not allowed to delete this site." (`wp-admin/ms-delete-site.php:17`)
- "Sorry, the link you clicked is stale. Please select another option." (`wp-admin/ms-delete-site.php:31`)

Rótulos de botão de envio: "Delete My Site Permanently".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `delete-blog`, `delete-blog`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 3 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/ms-delete-site.php:16`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 2 campos com `required`.
- **Recusa**: 3 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: instalacao-de-rede

**ID no inventário**: `SCR-083`  
**Grupo**: Painel  
**Origem**: `wp-admin/network.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `setup_network`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: `setup.php`  
**Linha no `ui/inventory.md` do Visor**: Network Setup

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network.php"
spec.route: "/wp-admin/network.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Network Setup" (`wp-admin/network.php:53`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/network.php:89`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/network.php` com 124 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**16** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage options for this site. | `wp-admin/network.php` | 19 |
| The Network creation panel is not for WordPress MU networks. | `wp-admin/network.php` | 29 |
| You must define the %1$s constant as true in your %2$s file to allow creation of a Network. | `wp-admin/network.php` | 44 |
| Network Setup | `wp-admin/network.php` | 53 |
| Create a Network of WordPress Sites | `wp-admin/network.php` | 57 |
| This screen allows you to configure a network as having subdomains (<code>site1.example.com</code>) or subdirectories (<code>example.com/site1</code>)… | `wp-admin/network.php` | 61 |
| Choose subdomains or subdirectories; this can only be switched afterwards by reconfiguring your installation. Fill out the network details, and click … | `wp-admin/network.php` | 62 |
| The next screen for Network Setup will give you individually-generated lines of code to add to your wp-config.php and .htaccess files. Make sure the s… | `wp-admin/network.php` | 63 |
| Add the designated lines of code to wp-config.php (just before <code>/*...stop editing...*/</code>) and <code>.htaccess</code> (replacing the existing… | `wp-admin/network.php` | 64 |
| Once you add this code and refresh your browser, multisite should be enabled. This screen, now in the Network Admin navigation menu, will keep an arch… | `wp-admin/network.php` | 65 |
| The choice of subdirectory sites is disabled if this setup is more than a month old because of permalink problems with &#8220;/blog/&#8221; from the m… | `wp-admin/network.php` | 66 |
| For more information: | `wp-admin/network.php` | 67 |
| … | `wp-admin/network.php` | +4 strings |

Mensagens de recusa (`wp_die`), **2** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage options for this site." (`wp-admin/network.php:19`)
- "The Network creation panel is not for WordPress MU networks." (`wp-admin/network.php:29`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **1** ações distintas: `install-network-1`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_admin_url( 'setup.php' )` | `wp-admin/network.php` | 24 |

Transição de recusa: qualquer um dos 2 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/network.php:18`.
- **Origem da requisição**: 1 ações de `nonce`. A falha leva a `SCR-112`.
- **Recusa**: 2 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: press-this

**ID no inventário**: `SCR-084`  
**Grupo**: Painel  
**Origem**: `wp-admin/press-this.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/press-this.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `activate_plugins`, `edit_posts`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Press This

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/press-this.php"
spec.route: "/wp-admin/press-this.php"
spec.deviations: [DEV-001, DEV-005]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/press-this.php` com 88 linhas

#### 2. Layout

⚠️ **Esta tela não carrega a moldura do painel.** Ela não referencia `admin-header.php` em nenhuma linha — são **12** telas de `wp-admin/` nessa situação, e cada uma tem chrome próprio. Define `IFRAME_REQUEST` em `wp-admin/press-this.php:9` e, nesta árvore, **nunca** chega a abrir documento: ver `DEV-005`.

> Consequência para o porte: a moldura do painel não pode ser um envelope aplicado a toda rota de `/wp-admin/`. São dois contratos de documento, não um.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**8** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to create posts as this user. | `wp-admin/press-this.php` | 20 |
| You need a higher level of permission. | `wp-admin/press-this.php` | 21 |
| Activate Press This | `wp-admin/press-this.php` | 44 |
| Install Now | `wp-admin/press-this.php` | 63 |
| Press This is not installed. Please install Press This from <a href="%s">the main site</a>. | `wp-admin/press-this.php` | 68 |
| The Press This plugin is required. | `wp-admin/press-this.php` | 74 |
| Installation Required | `wp-admin/press-this.php` | 75 |
| Press This is not available. Please contact your site administrator. | `wp-admin/press-this.php` | 80 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/press-this.php:18`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-005`: esta tela **nunca** renderiza UI nesta árvore. Os quatro caminhos de `wp_load_press_this()` terminam em `wp_die()` (`wp-admin/press-this.php:19`, `:73`, `:79`), porque o plugin `press-this/press-this-plugin.php` não está em `wp-content/plugins/`, que tem só `akismet` e `hello.php` ([`screen_deviation_log.md`](screen_deviation_log.md#dev-005)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: opcoes-gerais

**ID no inventário**: `SCR-085`  
**Grupo**: Painel  
**Origem**: `wp-admin/options-general.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/options-general.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `install_languages`, `manage_options`, `upload_files`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{tagline_description}}`, `{{site_icon_url}}`, `{{classes_for_wrapper}}`, `{{app_icon_alt_value}}`, `{{browser_icon_alt_value}}`, `{{classes_for_button}}`, `{{classes_for_button_on_change}}`, `{{wp_site_url_class}}`, `{{wp_home_class}}`, `{{membership_title}}`, `{{date_format_title}}`, `{{time_format_title}}`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: General

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/options-general.php"
spec.route: "/wp-admin/options-general.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "General Settings" (`wp-admin/options-general.php:20`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/options-general.php:68`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/options-general.php` com 603 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/options-general.php` | 70 | `options.php` | `post` |

Seções da API de opções: grupo `general` — os campos são registrados fora da tela, por `register_setting()`, e renderizados por `do_settings_sections()` (`wp-admin/options-general.php:71`).

#### 3. Campos

**14** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/options-general.php` | `blogname` | `text` | não | 77 |
| `wp-admin/options-general.php` | `blogdescription` | `text` | não | 96 |
| `wp-admin/options-general.php` | `site_icon` | `hidden` | não | 183 |
| `wp-admin/options-general.php` | `siteurl` | `url` | não | 242 |
| `wp-admin/options-general.php` | `home` | `url` | não | 247 |
| `wp-admin/options-general.php` | `new_admin_email` | `email` | não | 266 |
| `wp-admin/options-general.php` | `users_can_register` | `checkbox` | não | 299 |
| `wp-admin/options-general.php` | `default_role` | `select` | não | 328 |
| `wp-admin/options-general.php` | `timezone_string` | `select` | não | 404 |
| `wp-admin/options-general.php` | `date_format` | `radio` | não | 503 |
| `wp-admin/options-general.php` | `date_format_custom` | `text` | não | 521 |
| `wp-admin/options-general.php` | `time_format` | `radio` | não | 548 |
| `wp-admin/options-general.php` | `time_format_custom` | `text` | não | 566 |
| `wp-admin/options-general.php` | `start_of_week` | `select` | não | 578 |

> ⚠️ **Nenhum** dos 14 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**66** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage options for this site. | `wp-admin/options-general.php` | 16 |
| General Settings | `wp-admin/options-general.php` | 20 |
| Y-m-d H:i:s | `wp-admin/options-general.php` | 23 |
| The fields on this screen determine some of the basics of your site setup. | `wp-admin/options-general.php` | 27 |
| Most themes show the site title at the top of every page, in the title bar of the browser, and as the identifying name for syndicated feeds. Many them… | `wp-admin/options-general.php` | 28 |
| Two terms you will want to know are the WordPress URL and the site URL. The WordPress URL is where the core WordPress installation files are, and the … | `wp-admin/options-general.php` | 31 |
| Though the terms refer to two different concepts, in practice, they can be the same address or different. For example, you can have the core WordPress… | `wp-admin/options-general.php` | 34 |
| https://developer.wordpress.org/advanced-administration/server/wordpress-in-directory/ | `wp-admin/options-general.php` | 35 |
| Both WordPress URL and site URL can start with either %1$s or %2$s. A URL starting with %2$s requires an SSL certificate, so be sure that you have one… | `wp-admin/options-general.php` | 39 |
| If you want site visitors to be able to register themselves, check the membership box. If you want the site administrator to register every new user, … | `wp-admin/options-general.php` | 43 |
| You can set the language, and WordPress will automatically download and install the translation files (available if your filesystem is writable). | `wp-admin/options-general.php` | 46 |
| UTC means Coordinated Universal Time. | `wp-admin/options-general.php` | 47 |
| … | `wp-admin/options-general.php` | +54 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage options for this site." (`wp-admin/options-general.php:16`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 3 checagens `current_user_can()`, 3 capacidades distintas. Primeira em `wp-admin/options-general.php:15`.
- **Obrigatoriedade no cliente**: 0 de 14 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).
- **Saneamento**: delegado a `register_setting()` fora da tela. A tela não valida: ela posta para `wp-admin/options.php`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: opcoes-de-conectores

**ID no inventário**: `SCR-086`  
**Grupo**: Painel  
**Origem**: `wp-admin/options-connectors.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/options-connectors.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `manage_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Connectors

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/options-connectors.php"
spec.route: "/wp-admin/options-connectors.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Connectors" (`wp-admin/options-connectors.php:30`)
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/options-connectors.php:15`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/options-connectors.php` com 57 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**6** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| You need a higher level of permission. | `wp-admin/options-connectors.php` | 15 |
| Sorry, you are not allowed to manage connectors on this site. | `wp-admin/options-connectors.php` | 16 |
| Connectors are not available. | `wp-admin/options-connectors.php` | 23 |
| The Connectors page requires build files. Please run <code>npm install</code> to build the necessary files. | `wp-admin/options-connectors.php` | 24 |
| Connectors | `wp-admin/options-connectors.php` | 30 |
| The Connectors screen requires JavaScript. Please enable JavaScript in your browser settings to manage your connectors. | `wp-admin/options-connectors.php` | 31 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/options-connectors.php:13`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: opcoes-de-escrita

**ID no inventário**: `SCR-087`  
**Grupo**: Painel  
**Origem**: `wp-admin/options-writing.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/options-writing.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `manage_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{formatting_title}}`, `{{format_slug}}`, `{{format_name}}`, `{{printf_args}} (3 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Writing

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/options-writing.php"
spec.route: "/wp-admin/options-writing.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Writing Settings" (`wp-admin/options-writing.php:17`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/options-writing.php:63`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/options-writing.php` com 254 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/options-writing.php` | 65 | `options.php` | `post` |

Seções da API de opções: grupo `writing` — os campos são registrados fora da tela, por `register_setting()`, e renderizados por `do_settings_sections()` (`wp-admin/options-writing.php:66`).

#### 3. Campos

**8** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/options-writing.php` | `use_smilies` | `checkbox` | não | 75 |
| `wp-admin/options-writing.php` | `use_balanceTags` | `checkbox` | não | 77 |
| `wp-admin/options-writing.php` | `default_post_format` | `select` | não | 104 |
| `wp-admin/options-writing.php` | `mailserver_url` | `text` | não | 160 |
| `wp-admin/options-writing.php` | `mailserver_port` | `text` | não | 162 |
| `wp-admin/options-writing.php` | `mailserver_login` | `text` | não | 167 |
| `wp-admin/options-writing.php` | `mailserver_pass` | `text` | não | 178 |
| `wp-admin/options-writing.php` | `ping_sites` | `textarea` | não | 229 |

> ⚠️ **Nenhum** dos 8 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**29** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage options for this site. | `wp-admin/options-writing.php` | 13 |
| Writing Settings | `wp-admin/options-writing.php` | 17 |
| Overview | `wp-admin/options-writing.php` | 23 |
| You can submit content in several different ways; this screen holds the settings for all of them. The top section controls the editor within the dashb… | `wp-admin/options-writing.php` | 24 |
| You must click the Save Changes button at the bottom of the screen for new settings to take effect. | `wp-admin/options-writing.php` | 25 |
| Post Via Email | `wp-admin/options-writing.php` | 34 |
| Post via email settings allow you to send your WordPress installation an email with the content of your post. You must set up a secret email account w… | `wp-admin/options-writing.php` | 35 |
| Update Services | `wp-admin/options-writing.php` | 45 |
| If desired, WordPress will automatically alert various services of your new posts. | `wp-admin/options-writing.php` | 46 |
| For more information: | `wp-admin/options-writing.php` | 52 |
| <a href="https://wordpress.org/documentation/article/settings-writing-screen/">Documentation on Writing Settings</a> | `wp-admin/options-writing.php` | 53 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/options-writing.php` | 54 |
| … | `wp-admin/options-writing.php` | +17 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage options for this site." (`wp-admin/options-writing.php:13`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/options-writing.php:12`.
- **Obrigatoriedade no cliente**: 0 de 8 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).
- **Saneamento**: delegado a `register_setting()` fora da tela. A tela não valida: ela posta para `wp-admin/options.php`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: opcoes-de-leitura

**ID no inventário**: `SCR-088`  
**Grupo**: Painel  
**Origem**: `wp-admin/options-reading.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/options-reading.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `manage_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{your_homepage_displays_title}}`, `{{rss_use_excerpt_title}}`, `{{blog_privacy_selector_title}}`, `{{printf_args}} (6 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Reading

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/options-reading.php"
spec.route: "/wp-admin/options-reading.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Reading Settings" (`wp-admin/options-reading.php:17`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/options-reading.php:61`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/options-reading.php` com 254 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/options-reading.php` | 63 | `options.php` | `post` |

Seções da API de opções: grupo `reading` — os campos são registrados fora da tela, por `register_setting()`, e renderizados por `do_settings_sections()` (`wp-admin/options-reading.php:65`).

#### 3. Campos

**5** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/options-reading.php` | `show_on_front` | `hidden` | não | 73 |
| `wp-admin/options-reading.php` | `posts_per_page` | `number` | não | 180 |
| `wp-admin/options-reading.php` | `posts_per_rss` | `number` | não | 185 |
| `wp-admin/options-reading.php` | `rss_use_excerpt` | `radio` | não | 194 |
| `wp-admin/options-reading.php` | `blog_public` | `radio` | não | 215 |

> ⚠️ **Nenhum** dos 5 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**35** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage options for this site. | `wp-admin/options-reading.php` | 13 |
| Reading Settings | `wp-admin/options-reading.php` | 17 |
| Overview | `wp-admin/options-reading.php` | 25 |
| This screen contains the settings that affect the display of your content. | `wp-admin/options-reading.php` | 26 |
| You can choose what&#8217;s displayed on the homepage of your site. It can be posts in reverse chronological order (classic blog), or a fixed/static p… | `wp-admin/options-reading.php` | 29 |
| You can also control the display of your content in RSS feeds, including the maximum number of posts to display and whether to show full text or an ex… | `wp-admin/options-reading.php` | 34 |
| https://developer.wordpress.org/advanced-administration/wordpress/feeds/ | `wp-admin/options-reading.php` | 35 |
| You must click the Save Changes button at the bottom of the screen for new settings to take effect. | `wp-admin/options-reading.php` | 37 |
| Site visibility | `wp-admin/options-reading.php` | 44 |
| Search engine visibility | `wp-admin/options-reading.php` | 44 |
| You can choose whether or not your site will be crawled by robots, ping services, and spiders. If you want those services to ignore your site, click t… | `wp-admin/options-reading.php` | 45 |
| Note that even when set to discourage search engines, your site is still visible on the web and not all search engines adhere to this directive. | `wp-admin/options-reading.php` | 46 |
| … | `wp-admin/options-reading.php` | +23 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage options for this site." (`wp-admin/options-reading.php:13`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/options-reading.php:12`.
- **Obrigatoriedade no cliente**: 0 de 5 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).
- **Saneamento**: delegado a `register_setting()` fora da tela. A tela não valida: ela posta para `wp-admin/options.php`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: opcoes-de-discussao

**ID no inventário**: `SCR-089`  
**Grupo**: Painel  
**Origem**: `wp-admin/options-discussion.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/options-discussion.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `manage_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{default_post_settings_title}}`, `{{other_comment_settings_title}}`, `{{thread_comments_depth}}`, `{{comment_pagination_title}}`, `{{email_me_whenever_title}}`, `{{before_comment_appears_title}}`, `{{comment_moderation_title}}`, `{{disallowed_comment_keys_title}}`, `{{show_avatars_class}}`, `{{maximum_rating_title}}`, `{{default_avatar_title}}`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Discussion

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/options-discussion.php"
spec.route: "/wp-admin/options-discussion.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Discussion Settings" (`wp-admin/options-discussion.php:16`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/options-discussion.php:40`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/options-discussion.php` com 328 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/options-discussion.php` | 42 | `options.php` | `post` |

Seções da API de opções: grupo `discussion` — os campos são registrados fora da tela, por `register_setting()`, e renderizados por `do_settings_sections()` (`wp-admin/options-discussion.php:43`).

#### 3. Campos

**25** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/options-discussion.php` | `default_pingback_flag` | `checkbox` | não | 51 |
| `wp-admin/options-discussion.php` | `default_ping_status` | `checkbox` | não | 55 |
| `wp-admin/options-discussion.php` | `default_comment_status` | `checkbox` | não | 59 |
| `wp-admin/options-discussion.php` | `require_name_email` | `checkbox` | não | 69 |
| `wp-admin/options-discussion.php` | `comment_registration` | `checkbox` | não | 72 |
| `wp-admin/options-discussion.php` | `close_comments_for_old_posts` | `checkbox` | não | 81 |
| `wp-admin/options-discussion.php` | `close_comments_days_old` | `number` | não | 85 |
| `wp-admin/options-discussion.php` | `show_comments_cookies_opt_in` | `checkbox` | não | 89 |
| `wp-admin/options-discussion.php` | `thread_comments` | `checkbox` | não | 92 |
| `wp-admin/options-discussion.php` | `thread_comments_depth` | `select` | não | 105 |
| `wp-admin/options-discussion.php` | `page_comments` | `checkbox` | não | 128 |
| `wp-admin/options-discussion.php` | `comments_per_page` | `number` | não | 133 |
| `wp-admin/options-discussion.php` | `default_comments_page` | `select` | não | 137 |
| `wp-admin/options-discussion.php` | `comment_order` | `select` | não | 144 |
| `wp-admin/options-discussion.php` | `comments_notify` | `checkbox` | não | 157 |
| `wp-admin/options-discussion.php` | `moderation_notify` | `checkbox` | não | 161 |
| `wp-admin/options-discussion.php` | `wp_notes_notify` | `checkbox` | não | 165 |
| `wp-admin/options-discussion.php` | `comment_moderation` | `checkbox` | não | 175 |
| `wp-admin/options-discussion.php` | `comment_previously_approved` | `checkbox` | não | 178 |
| `wp-admin/options-discussion.php` | `comment_max_links` | `number` | não | 186 |
| `wp-admin/options-discussion.php` | `moderation_keys` | `textarea` | não | 192 |
| `wp-admin/options-discussion.php` | `disallowed_keys` | `textarea` | não | 202 |
| `wp-admin/options-discussion.php` | … | | | +3 campos |

> ⚠️ **Nenhum** dos 25 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**65** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage options for this site. | `wp-admin/options-discussion.php` | 12 |
| Discussion Settings | `wp-admin/options-discussion.php` | 16 |
| Overview | `wp-admin/options-discussion.php` | 24 |
| This screen provides many options for controlling the management and display of comments and links to your posts/pages. So many, in fact, they will no… | `wp-admin/options-discussion.php` | 25 |
| You must click the Save Changes button at the bottom of the screen for new settings to take effect. | `wp-admin/options-discussion.php` | 26 |
| For more information: | `wp-admin/options-discussion.php` | 31 |
| <a href="https://wordpress.org/documentation/article/settings-discussion-screen/">Documentation on Discussion Settings</a> | `wp-admin/options-discussion.php` | 32 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/options-discussion.php` | 33 |
| Default post settings | `wp-admin/options-discussion.php` | 46 |
| Attempt to notify any blogs linked to from the post | `wp-admin/options-discussion.php` | 52 |
| Allow link notifications from other blogs (pingbacks and trackbacks) on new posts | `wp-admin/options-discussion.php` | 56 |
| Allow people to submit comments on new posts | `wp-admin/options-discussion.php` | 60 |
| … | `wp-admin/options-discussion.php` | +53 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage options for this site." (`wp-admin/options-discussion.php:12`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/options-discussion.php:11`.
- **Obrigatoriedade no cliente**: 0 de 25 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).
- **Saneamento**: delegado a `register_setting()` fora da tela. A tela não valida: ela posta para `wp-admin/options.php`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: opcoes-de-midia

**ID no inventário**: `SCR-090`  
**Grupo**: Painel  
**Origem**: `wp-admin/options-media.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/options-media.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `manage_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{thumbnail_size_title}}`, `{{medium_size_title}}`, `{{large_size_title}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Media

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/options-media.php"
spec.route: "/wp-admin/options-media.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Media Settings" (`wp-admin/options-media.php:17`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/options-media.php:50`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/options-media.php` com 169 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/options-media.php` | 52 | `options.php` | `post` |

Seções da API de opções: grupo `media` — os campos são registrados fora da tela, por `register_setting()`, e renderizados por `do_settings_sections()` (`wp-admin/options-media.php:53`).

#### 3. Campos

**10** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/options-media.php` | `thumbnail_size_w` | `number` | não | 64 |
| `wp-admin/options-media.php` | `thumbnail_size_h` | `number` | não | 67 |
| `wp-admin/options-media.php` | `thumbnail_crop` | `checkbox` | não | 69 |
| `wp-admin/options-media.php` | `medium_size_w` | `number` | não | 79 |
| `wp-admin/options-media.php` | `medium_size_h` | `number` | não | 82 |
| `wp-admin/options-media.php` | `large_size_w` | `number` | não | 91 |
| `wp-admin/options-media.php` | `large_size_h` | `number` | não | 94 |
| `wp-admin/options-media.php` | `upload_path` | `text` | não | 127 |
| `wp-admin/options-media.php` | `upload_url_path` | `text` | não | 139 |
| `wp-admin/options-media.php` | `uploads_use_yearmonth_folders` | `checkbox` | não | 150 |

> ⚠️ **Nenhum** dos 10 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**26** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage options for this site. | `wp-admin/options-media.php` | 13 |
| Media Settings | `wp-admin/options-media.php` | 17 |
| You can set maximum sizes for images inserted into your written content; you can also insert an image as Full Size. | `wp-admin/options-media.php` | 20 |
| Uploading Files allows you to choose the folder and path for storing your uploaded files. | `wp-admin/options-media.php` | 26 |
| You must click the Save Changes button at the bottom of the screen for new settings to take effect. | `wp-admin/options-media.php` | 29 |
| Overview | `wp-admin/options-media.php` | 34 |
| For more information: | `wp-admin/options-media.php` | 40 |
| <a href="https://wordpress.org/documentation/article/settings-media-screen/">Documentation on Media Settings</a> | `wp-admin/options-media.php` | 41 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/options-media.php` | 42 |
| Image sizes | `wp-admin/options-media.php` | 55 |
| The sizes listed below determine the maximum dimensions in pixels to use when adding an image to the Media Library. | `wp-admin/options-media.php` | 56 |
| Thumbnail size | `wp-admin/options-media.php` | 59 |
| … | `wp-admin/options-media.php` | +14 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage options for this site." (`wp-admin/options-media.php:13`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/options-media.php:12`.
- **Obrigatoriedade no cliente**: 0 de 10 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).
- **Saneamento**: delegado a `register_setting()` fora da tela. A tela não valida: ela posta para `wp-admin/options.php`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: opcoes-de-links-permanentes

**ID no inventário**: `SCR-091`  
**Grupo**: Painel  
**Origem**: `wp-admin/options-permalink.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/options-permalink.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `manage_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{permalink_structure_title}}`, `{{input}}`, `{{url_base}}`, `{{permalink_structure}}`, `{{category_base}}`, `{{blog_prefix}}`, `{{tag_base}}`, `{{wp_rewrite}}`, `{{printf_args}} (25 mensagens com placeholder posicional)`  
**Transições de saída**: `options-permalink.php?settings-updated=true`  
**Linha no `ui/inventory.md` do Visor**: Permalinks

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/options-permalink.php"
spec.route: "/wp-admin/options-permalink.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Permalink Settings" (`wp-admin/options-permalink.php:17`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/options-permalink.php:217`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/options-permalink.php` com 571 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **4**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/options-permalink.php` | 219 | `options-permalink.php` | `post` |
| `wp-admin/options-permalink.php` | 487 | `options-permalink.php` | `post` |
| `wp-admin/options-permalink.php` | 519 | `options-permalink.php` | `post` |
| `wp-admin/options-permalink.php` | 554 | `options-permalink.php` | `post` |

Seções da API de opções: grupo `permalink` — os campos são registrados fora da tela, por `register_setting()`, e renderizados por `do_settings_sections()` (`wp-admin/options-permalink.php:460`).

#### 3. Campos

**3** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/options-permalink.php` | `permalink_structure` | `text` | não | 371 |
| `wp-admin/options-permalink.php` | `category_base` | `text` | não | 428 |
| `wp-admin/options-permalink.php` | `tag_base` | `text` | não | 447 |

> ⚠️ **Nenhum** dos 3 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**58** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage options for this site. | `wp-admin/options-permalink.php` | 13 |
| Permalink Settings | `wp-admin/options-permalink.php` | 17 |
| Overview | `wp-admin/options-permalink.php` | 23 |
| Permalinks are the permanent URLs to your individual pages and blog posts, as well as your category and tag archives. A permalink is the web address u… | `wp-admin/options-permalink.php` | 24 |
| This screen allows you to choose your permalink structure. You can choose from common settings or create custom URL structures. | `wp-admin/options-permalink.php` | 25 |
| You must click the Save Changes button at the bottom of the screen for new settings to take effect. | `wp-admin/options-permalink.php` | 26 |
| Permalinks can contain useful information, such as the post date, title, or other elements. You can choose from any of the suggested permalink formats… | `wp-admin/options-permalink.php` | 34 |
| If you pick an option other than Plain, your general URL path with structure tags (terms surrounded by %s) will also appear in the custom structure fi… | `wp-admin/options-permalink.php` | 37 |
| When you assign multiple categories or tags to a post, only one can show up in the permalink: the lowest numbered category. This applies if your custo… | `wp-admin/options-permalink.php` | 42 |
| Custom Structures | `wp-admin/options-permalink.php` | 53 |
| The Optional fields let you customize the &#8220;category&#8221; and &#8220;tag&#8221; base names that will appear in archive URLs. For example, the p… | `wp-admin/options-permalink.php` | 54 |
| For more information: | `wp-admin/options-permalink.php` | 59 |
| … | `wp-admin/options-permalink.php` | +46 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage options for this site." (`wp-admin/options-permalink.php:13`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **5** ações distintas: `update-permalink`, `update-permalink`, `update-permalink`, `update-permalink`, `update-permalink`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'options-permalink.php?settings-updated=true' )` | `wp-admin/options-permalink.php` | 208 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/options-permalink.php:12`.
- **Origem da requisição**: 5 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 3 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).
- **Saneamento**: delegado a `register_setting()` fora da tela. A tela não valida: ela posta para `wp-admin/options.php`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: opcoes-de-privacidade

**ID no inventário**: `SCR-092`  
**Grupo**: Painel  
**Origem**: `wp-admin/options-privacy.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/options-privacy.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `edit_theme_options`, `manage_privacy_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (5 mensagens com placeholder posicional)`  
**Transições de saída**: `post.php?post=`  
**Linha no `ui/inventory.md` do Visor**: Privacy

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/options-privacy.php"
spec.route: "/wp-admin/options-privacy.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Privacy" (`wp-admin/options-privacy.php:22`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/options-privacy.php` com 332 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **2**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/options-privacy.php` | 283 | *(vazio: posta na própria URL)* | `post` |
| `wp-admin/options-privacy.php` | 306 | *(vazio: posta na própria URL)* | `post` |

#### 3. Campos

**1** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/options-privacy.php` | `action` | `hidden` | não | 284 |

> ⚠️ **Nenhum** dos 1 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**36** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage privacy options on this site. | `wp-admin/options-privacy.php` | 13 |
| Privacy | `wp-admin/options-privacy.php` | 22 |
| Overview | `wp-admin/options-privacy.php` | 38 |
| The Privacy screen lets you either build a new privacy-policy page or choose one you already have to show. | `wp-admin/options-privacy.php` | 40 |
| This screen includes suggestions to help you write your own privacy policy. However, it is your responsibility to use these resources correctly, to pr… | `wp-admin/options-privacy.php` | 41 |
| For more information: | `wp-admin/options-privacy.php` | 46 |
| <a href="https://wordpress.org/documentation/article/settings-privacy-screen/">Documentation on Privacy Settings</a> | `wp-admin/options-privacy.php` | 47 |
| Privacy Policy page updated successfully. | `wp-admin/options-privacy.php` | 61 |
| Privacy Policy page setting updated successfully. Remember to <a href="%s">update your menus</a>! | `wp-admin/options-privacy.php` | 77 |
| Privacy Policy page removed. | `wp-admin/options-privacy.php` | 83 |
| No Privacy Policy page is currently set. | `wp-admin/options-privacy.php` | 86 |
| Privacy Policy | `wp-admin/options-privacy.php` | 100 |
| … | `wp-admin/options-privacy.php` | +24 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage privacy options on this site." (`wp-admin/options-privacy.php:13`)

Rótulos de botão de envio: "Create", "Use This Page".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `create-privacy-page`, `set-privacy-page`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'post.php?post=' . $privacy_policy_page_id . '&action=edit' )` | `wp-admin/options-privacy.php` | 118 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/options-privacy.php:12`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 1 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: guia-da-politica-de-privacidade

**ID no inventário**: `SCR-093`  
**Grupo**: Painel  
**Origem**: `wp-admin/privacy-policy-guide.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/privacy-policy-guide.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `manage_privacy_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Guia da politica de privacidade

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/privacy-policy-guide.php"
spec.route: "/wp-admin/privacy-policy-guide.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Privacy Policy Guide" (`wp-admin/privacy-policy-guide.php:21`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/privacy-policy-guide.php` com 103 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**13** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage privacy options on this site. | `wp-admin/privacy-policy-guide.php` | 13 |
| Privacy Policy Guide | `wp-admin/privacy-policy-guide.php` | 21 |
| Privacy | `wp-admin/privacy-policy-guide.php` | 40 |
| Secondary menu | `wp-admin/privacy-policy-guide.php` | 44 |
| Settings | `wp-admin/privacy-policy-guide.php` | 48 |
| Policy Guide | `wp-admin/privacy-policy-guide.php` | 55 |
| The Privacy Settings require JavaScript. | `wp-admin/privacy-policy-guide.php` | 65 |
| Introduction | `wp-admin/privacy-policy-guide.php` | 75 |
| This text template will help you to create your website&#8217;s privacy policy. | `wp-admin/privacy-policy-guide.php` | 76 |
| The template contains a suggestion of sections you most likely will need. Under each section heading, you will find a short summary of what informatio… | `wp-admin/privacy-policy-guide.php` | 77 |
| Please edit your privacy policy content, making sure to delete the summaries, and adding any information from your theme and plugins. Once you publish… | `wp-admin/privacy-policy-guide.php` | 78 |
| It is your responsibility to write a comprehensive privacy policy, to make sure it reflects all national and international legal requirements on priva… | `wp-admin/privacy-policy-guide.php` | 79 |
| … | `wp-admin/privacy-policy-guide.php` | +1 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage privacy options on this site." (`wp-admin/privacy-policy-guide.php:13`)

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/privacy-policy-guide.php:12`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: gravacao-generica-de-opcoes

**ID no inventário**: `SCR-094`  
**Grupo**: Painel  
**Origem**: `wp-admin/options.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/options.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `install_languages`, `manage_network_options`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{name}}`, `{{option}}`, `{{class}}`, `{{value}}`, `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: `$redirect`, `options-general.php?updated=true`  
**Linha no `ui/inventory.md` do Visor**: Gravacao generica de opcoes

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/options.php"
spec.route: "/wp-admin/options.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Settings" (`wp-admin/options.php:22`)
- **Primeiro `<h1>`**: `' . __( 'You need a higher level of permission.' ) . '` (`wp-admin/options.php:51`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/options.php` com 465 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/options.php` | 393 | `options.php` | `post` |

#### 3. Campos

**3** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/options.php` | `action` | `hidden` | não | 395 |
| `wp-admin/options.php` | `option_page` | `hidden` | não | 396 |
| `wp-admin/options.php` | `page_options` | `hidden` | não | 456 |

> ⚠️ **Nenhum** dos 3 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**16** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Settings | `wp-admin/options.php` | 22 |
| You need a higher level of permission. | `wp-admin/options.php` | 51 |
| Sorry, you are not allowed to manage options for this site. | `wp-admin/options.php` | 52 |
| Sorry, you are not allowed to delete these items. | `wp-admin/options.php` | 85 |
| Please consider writing more inclusive code. | `wp-admin/options.php` | 228 |
| <strong>Error:</strong> The %s options page is not in the allowed options list. | `wp-admin/options.php` | 253 |
| Sorry, you are not allowed to modify unregistered settings for this site. | `wp-admin/options.php` | 261 |
| The timezone you have entered is not valid. Please select a valid timezone. | `wp-admin/options.php` | 301 |
| The %1$s setting is unregistered. Unregistered settings are deprecated. See <a href="%2$s">documentation on the Settings API</a>. | `wp-admin/options.php` | 329 |
| https://developer.wordpress.org/plugins/settings/settings-api/ | `wp-admin/options.php` | 331 |
| Settings save failed. | `wp-admin/options.php` | 359 |
| Settings saved. | `wp-admin/options.php` | 368 |
| … | `wp-admin/options.php` | +4 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to modify unregistered settings for this site." (`wp-admin/options.php:261`)

Rótulos de botão de envio: "Save Changes".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **3** ações distintas: `dismiss-`, `update-options`, `options-options`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( $redirect )` | `wp-admin/options.php` | 72 |
| `admin_url( 'options-general.php?updated=true' )` | `wp-admin/options.php` | 78 |
| `$goback` | `wp-admin/options.php` | 375 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/options.php:82`.
- **Origem da requisição**: 3 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 3 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: sobre-o-wordpress

**ID no inventário**: `SCR-095`  
**Grupo**: Painel  
**Origem**: `wp-admin/about.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/about.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `update_core`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{version_text}}`, `{{release_page_url}}`, `{{release_notes_url}}`, `{{field_guide_url}}`, `{{printf_args}} (17 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: About WordPress

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/about.php"
spec.route: "/wp-admin/about.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "About" (`wp-admin/about.php:14`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $version_text ); ?>` (`wp-admin/about.php:49`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/about.php` com 386 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**55** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| About | `wp-admin/about.php` | 14 |
| https://wordpress.org/documentation/wordpress-version/version-%s/ | `wp-admin/about.php` | 21 |
| https://make.wordpress.org/core/wordpress-%s-field-guide/ | `wp-admin/about.php` | 27 |
| https://wordpress.org/download/releases/%s/ | `wp-admin/about.php` | 33 |
| WordPress %s | `wp-admin/about.php` | 39 |
| Secondary menu | `wp-admin/about.php` | 53 |
| What&#8217;s New | `wp-admin/about.php` | 54 |
| Credits | `wp-admin/about.php` | 55 |
| Freedoms | `wp-admin/about.php` | 56 |
| Privacy | `wp-admin/about.php` | 57 |
| Get Involved | `wp-admin/about.php` | 58 |
| Maintenance and Security Releases | `wp-admin/about.php` | 63 |
| … | `wp-admin/about.php` | +43 strings |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/about.php:316`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: creditos

**ID no inventário**: `SCR-096`  
**Grupo**: Painel  
**Origem**: `wp-admin/credits.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/credits.php`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Credits

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/credits.php"
spec.route: "/wp-admin/credits.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Credits" (`wp-admin/credits.php:14`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/credits.php` com 150 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**37** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Credits | `wp-admin/credits.php` | 14 |
| Contributors | `wp-admin/credits.php` | 25 |
| Created by a worldwide team of passionate individuals | `wp-admin/credits.php` | 30 |
| Secondary menu | `wp-admin/credits.php` | 34 |
| What&#8217;s New | `wp-admin/credits.php` | 35 |
| Freedoms | `wp-admin/credits.php` | 37 |
| Privacy | `wp-admin/credits.php` | 38 |
| Get Involved | `wp-admin/credits.php` | 39 |
| WordPress is created by a <a href="%1$s">worldwide team</a> of passionate individuals. | `wp-admin/credits.php` | 50 |
| https://wordpress.org/about/ | `wp-admin/credits.php` | 51 |
| https://make.wordpress.org/contribute/ | `wp-admin/credits.php` | 55 |
| Get involved in WordPress. | `wp-admin/credits.php` | 55 |
| … | `wp-admin/credits.php` | +25 strings |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: liberdades

**ID no inventário**: `SCR-097`  
**Grupo**: Painel  
**Origem**: `wp-admin/freedoms.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/freedoms.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `activate_plugins`, `switch_themes`  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (3 mensagens com placeholder posicional)`  
**Transições de saída**: `privacy.php`  
**Linha no `ui/inventory.md` do Visor**: Freedoms

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/freedoms.php"
spec.route: "/wp-admin/freedoms.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Freedoms" (`wp-admin/freedoms.php:19`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/freedoms.php` com 110 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**22** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Freedoms | `wp-admin/freedoms.php` | 19 |
| The Four Freedoms | `wp-admin/freedoms.php` | 28 |
| WordPress is free and open source software | `wp-admin/freedoms.php` | 33 |
| Secondary menu | `wp-admin/freedoms.php` | 37 |
| What&#8217;s New | `wp-admin/freedoms.php` | 38 |
| Credits | `wp-admin/freedoms.php` | 39 |
| Privacy | `wp-admin/freedoms.php` | 41 |
| Get Involved | `wp-admin/freedoms.php` | 42 |
| WordPress comes with some awesome, worldview-changing rights courtesy of its <a href="%s">license</a>, the GPL. | `wp-admin/freedoms.php` | 50 |
| https://wordpress.org/about/license/ | `wp-admin/freedoms.php` | 51 |
| The 1st Freedom | `wp-admin/freedoms.php` | 60 |
| To run the program for any purpose. | `wp-admin/freedoms.php` | 61 |
| … | `wp-admin/freedoms.php` | +10 strings |

#### 5. Eventos e transições

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `admin_url( 'privacy.php' ), 301` | `wp-admin/freedoms.php` | 14 |

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/freedoms.php:94`.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: contribuir

**ID no inventário**: `SCR-098`  
**Grupo**: Painel  
**Origem**: `wp-admin/contribute.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/contribute.php`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Contribute

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/contribute.php"
spec.route: "/wp-admin/contribute.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Get Involved" (`wp-admin/contribute.php:13`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/contribute.php` com 108 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**37** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Get Involved | `wp-admin/contribute.php` | 13 |
| Be the future of WordPress | `wp-admin/contribute.php` | 27 |
| Secondary menu | `wp-admin/contribute.php` | 31 |
| What&#8217;s New | `wp-admin/contribute.php` | 32 |
| Credits | `wp-admin/contribute.php` | 33 |
| Freedoms | `wp-admin/contribute.php` | 34 |
| Privacy | `wp-admin/contribute.php` | 35 |
| Do you use WordPress for work, for personal projects, or even just for fun? You can help shape the long-term success of the open source project that p… | `wp-admin/contribute.php` | 44 |
| Join the diverse WordPress contributor community and connect with other people who are passionate about maintaining a free and open web. | `wp-admin/contribute.php` | 45 |
| Be part of a global open source community. | `wp-admin/contribute.php` | 48 |
| Apply your skills or learn new ones. | `wp-admin/contribute.php` | 49 |
| Grow your network and make friends. | `wp-admin/contribute.php` | 50 |
| … | `wp-admin/contribute.php` | +25 strings |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: privacidade-do-projeto

**ID no inventário**: `SCR-099`  
**Grupo**: Painel  
**Origem**: `wp-admin/privacy.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/privacy.php`  
**Tela crítica?**: não  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$menu-background`, `$menu-text`, `$menu-highlight-background`, `$adminbar-input-background`, `$body-background`, `$card-bg`, `$card-border-color`, `$card-border-radius` (+12)  
**Pontos de interpolação**: `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Privacy (do projeto)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/privacy.php"
spec.route: "/wp-admin/privacy.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Privacy" (`wp-admin/privacy.php:13`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/privacy.php` com 70 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**12** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Privacy | `wp-admin/privacy.php` | 13 |
| WordPress.org takes privacy and transparency very seriously | `wp-admin/privacy.php` | 27 |
| Secondary menu | `wp-admin/privacy.php` | 31 |
| What&#8217;s New | `wp-admin/privacy.php` | 32 |
| Credits | `wp-admin/privacy.php` | 33 |
| Freedoms | `wp-admin/privacy.php` | 34 |
| Get Involved | `wp-admin/privacy.php` | 36 |
| From time to time, your WordPress site may send data to WordPress.org &#8212; including, but not limited to &#8212; the version you are using, and a l… | `wp-admin/privacy.php` | 44 |
| This data is used to provide general enhancements to WordPress, which includes helping to protect your site by finding and automatically installing ne… | `wp-admin/privacy.php` | 50 |
| https://wordpress.org/about/stats/ | `wp-admin/privacy.php` | 51 |
| WordPress.org takes privacy and transparency very seriously. To learn more about what data is collected, and how it is used, please visit <a href="%s"… | `wp-admin/privacy.php` | 60 |
| https://wordpress.org/about/privacy/ | `wp-admin/privacy.php` | 61 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-painel

**ID no inventário**: `SCR-100`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/index.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/index.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `manage_network`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Painel da rede

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/index.php"
spec.route: "/wp-admin/network/index.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Dashboard" (`wp-admin/network/index.php:21`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/network/index.php:71`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/network/index.php` com 85 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**19** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to access this page. | `wp-admin/network/index.php` | 17 |
| Dashboard | `wp-admin/network/index.php` | 21 |
| Welcome to your Network Admin. This area of the Administration Screens is used for managing all aspects of your Multisite Network. | `wp-admin/network/index.php` | 24 |
| From here you can: | `wp-admin/network/index.php` | 25 |
| Add and manage sites or users | `wp-admin/network/index.php` | 26 |
| Install and activate themes or plugins | `wp-admin/network/index.php` | 27 |
| Update your network | `wp-admin/network/index.php` | 28 |
| Modify global network settings | `wp-admin/network/index.php` | 29 |
| Overview | `wp-admin/network/index.php` | 34 |
| The Right Now widget on this screen provides current user and site counts on your network. | `wp-admin/network/index.php` | 39 |
| To add a new user, <strong>click Create a New User</strong>. | `wp-admin/network/index.php` | 40 |
| To add a new site, <strong>click Create a New Site</strong>. | `wp-admin/network/index.php` | 41 |
| … | `wp-admin/network/index.php` | +7 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to access this page." (`wp-admin/network/index.php:17`)

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/network/index.php:16`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-lista-de-sites

**ID no inventário**: `SCR-101`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/sites.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/sites.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `create_sites`, `delete_site`, `delete_sites`, `manage_sites`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{site_action}}`, `{{id}}`, `{{site_address}}`, `{{site_id}}`, `{{msg}}`, `{{printf_args}} (11 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Sites - lista

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/sites.php"
spec.route: "/wp-admin/network/sites.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Sites" (`wp-admin/network/sites.php:21`)
- **Primeiro `<h1>`**: `<?php _e( 'Confirm your action' ); ?>` (`wp-admin/network/sites.php:114`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/network/sites.php` com 438 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **4**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/sites.php` | 115 | `sites.php?action=<?php echo esc_attr( $site_action ); ?` | `get` |
| `wp-admin/network/sites.php` | 215 | `sites.php?action=delete_sites` | `post` |
| `wp-admin/network/sites.php` | 426 | *(vazio: posta na própria URL)* | `get` |
| `wp-admin/network/sites.php` | 431 | `sites.php?action=allblogs` | `post` |

Tabela de listagem: `WP_MS_Sites_List_Table` (`wp-admin/network/sites.php:17`).

#### 3. Campos

**4** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/network/sites.php` | `action` | `hidden` | não | 116 |
| `wp-admin/network/sites.php` | `id` | `hidden` | não | 117 |
| `wp-admin/network/sites.php` | `_wp_http_referer` | `hidden` | não | 118 |
| `wp-admin/network/sites.php` | `site_ids[]` | `hidden` | não | 233 |

> ⚠️ **Nenhum** dos 4 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**51** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to access this page. | `wp-admin/network/sites.php` | 14 |
| Sites | `wp-admin/network/sites.php` | 21 |
| Overview | `wp-admin/network/sites.php` | 29 |
| Add Site takes you to the screen for adding a new site to the network. You can search for a site by Name, ID number, or IP address. Screen Options all… | `wp-admin/network/sites.php` | 31 |
| This is the main table of all sites on this network. Switch between list and excerpt views by using the icons above the right side of the table. | `wp-admin/network/sites.php` | 32 |
| Hovering over each site reveals seven options (three for the primary site): | `wp-admin/network/sites.php` | 33 |
| An Edit link to a separate Edit Site screen. | `wp-admin/network/sites.php` | 34 |
| Dashboard leads to the Dashboard for that site. | `wp-admin/network/sites.php` | 35 |
| Flag for Deletion, Archive, and Spam which lead to confirmation screens. These actions can be reversed later. | `wp-admin/network/sites.php` | 36 |
| Delete Permanently which is a permanent action after the confirmation screen. | `wp-admin/network/sites.php` | 37 |
| Visit to go to the front-end of the live site. | `wp-admin/network/sites.php` | 38 |
| For more information: | `wp-admin/network/sites.php` | 43 |
| … | `wp-admin/network/sites.php` | +39 strings |

Mensagens de recusa (`wp_die`), **3** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to access this page." (`wp-admin/network/sites.php:14`)
- "The requested action is not valid." (`wp-admin/network/sites.php:88`)
- "Sorry, you are not allowed to change the current site." (`wp-admin/network/sites.php:104`)

Rótulos de botão de envio: "Delete these sites permanently".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **4** ações distintas: `confirm`, `bulk-sites`, `ms-delete-sites`, `ms-delete-sites`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$redirect_to` | `wp-admin/network/sites.php` | 263 |
| `$location` | `wp-admin/network/sites.php` | 273 |
| `add_query_arg( array( 'updated' => $updated_action ), wp_get_referer() )` | `wp-admin/network/sites.php` | 326 |

Transição de recusa: qualquer um dos 3 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 4 checagens `current_user_can()`, 4 capacidades distintas. Primeira em `wp-admin/network/sites.php:13`.
- **Origem da requisição**: 4 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 4 campos com `required`.
- **Recusa**: 3 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-site-informacoes

**ID no inventário**: `SCR-102`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/site-info.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/site-info.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `manage_sites`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{id}}`, `{{parsed_scheme}}`, `{{details}}`, `{{site_attributes_title}}`, `{{field_key}}`, `{{field_label}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Site - informacoes

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/site-info.php"
spec.route: "/wp-admin/network/site-info.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: dinâmico — `sprintf( __( 'Edit Site: %s' ), esc_html( $details->blogname ) )` (`wp-admin/network/site-info.php:135`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Primeiro `<h1>`**: `<?php echo $title; ?>` (`wp-admin/network/site-info.php:145`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/network/site-info.php` com 240 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/site-info.php` | 168 | `site-info.php?action=update-site` | `post` |

#### 3. Campos

**5** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/network/site-info.php` | `id` | `hidden` | não | 170 |
| `wp-admin/network/site-info.php` | `blog[url]` | `url` | não | 186 |
| `wp-admin/network/site-info.php` | `blog[registered]` | `text` | não | 192 |
| `wp-admin/network/site-info.php` | `blog[last_updated]` | `text` | não | 196 |
| `wp-admin/network/site-info.php` | `blog[<?php echo $field_key; ?>]` | `checkbox` | não | 215 |

> ⚠️ **Nenhum** dos 5 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**17** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to edit this site. | `wp-admin/network/site-info.php` | 14 |
| Invalid site ID. | `wp-admin/network/site-info.php` | 23 |
| The requested site does not exist. | `wp-admin/network/site-info.php` | 28 |
| Sorry, you are not allowed to access this page. | `wp-admin/network/site-info.php` | 32 |
| Site info updated. | `wp-admin/network/site-info.php` | 129 |
| Edit Site: %s | `wp-admin/network/site-info.php` | 135 |
| Visit | `wp-admin/network/site-info.php` | 146 |
| Dashboard | `wp-admin/network/site-info.php` | 146 |
| Site Address (URL) | `wp-admin/network/site-info.php` | 177 |
| Registered | `wp-admin/network/site-info.php` | 191 |
| Last Updated | `wp-admin/network/site-info.php` | 195 |
| Attributes | `wp-admin/network/site-info.php` | 199 |
| … | `wp-admin/network/site-info.php` | +5 strings |

Mensagens de recusa (`wp_die`), **4** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to edit this site." (`wp-admin/network/site-info.php:14`)
- "Invalid site ID." (`wp-admin/network/site-info.php:23`)
- "The requested site does not exist." (`wp-admin/network/site-info.php:28`)
- "Sorry, you are not allowed to access this page." (`wp-admin/network/site-info.php:32`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `edit-site`, `edit-site`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 4 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/network/site-info.php:13`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 5 campos com `required`.
- **Recusa**: 4 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-site-configuracoes

**ID no inventário**: `SCR-103`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/site-settings.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/site-settings.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `manage_sites`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{id}}`, `{{option}}`, `{{class}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Site - configuracoes

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/site-settings.php"
spec.route: "/wp-admin/network/site-settings.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: dinâmico — `sprintf( __( 'Edit Site: %s' ), esc_html( $details->blogname ) )` (`wp-admin/network/site-settings.php:84`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Primeiro `<h1>`**: `<?php echo $title; ?>` (`wp-admin/network/site-settings.php:94`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/network/site-settings.php` com 209 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/site-settings.php` | 118 | `site-settings.php?action=update-site` | `post` |

#### 3. Campos

**1** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/network/site-settings.php` | `id` | `hidden` | não | 120 |

> ⚠️ **Nenhum** dos 1 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**8** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to edit this site. | `wp-admin/network/site-settings.php` | 14 |
| Invalid site ID. | `wp-admin/network/site-settings.php` | 23 |
| The requested site does not exist. | `wp-admin/network/site-settings.php` | 28 |
| Sorry, you are not allowed to access this page. | `wp-admin/network/site-settings.php` | 32 |
| Site options updated. | `wp-admin/network/site-settings.php` | 78 |
| Edit Site: %s | `wp-admin/network/site-settings.php` | 84 |
| Visit | `wp-admin/network/site-settings.php` | 95 |
| Dashboard | `wp-admin/network/site-settings.php` | 95 |

Mensagens de recusa (`wp_die`), **4** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to edit this site." (`wp-admin/network/site-settings.php:14`)
- "Invalid site ID." (`wp-admin/network/site-settings.php:23`)
- "The requested site does not exist." (`wp-admin/network/site-settings.php:28`)
- "Sorry, you are not allowed to access this page." (`wp-admin/network/site-settings.php:32`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `edit-site`, `edit-site`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 4 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/network/site-settings.php:13`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 1 campos com `required`.
- **Recusa**: 4 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-site-temas

**ID no inventário**: `SCR-104`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/site-themes.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/site-themes.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `manage_sites`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{id}}`, `{{printf_args}} (3 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Site - temas

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/site-themes.php"
spec.route: "/wp-admin/network/site-themes.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: dinâmico — `sprintf( __( 'Edit Site: %s' ), esc_html( $details->blogname ) )` (`wp-admin/network/site-themes.php:171`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Primeiro `<h1>`**: `<?php echo $title; ?>` (`wp-admin/network/site-themes.php:180`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/network/site-themes.php` com 255 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **2**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/site-themes.php` | 239 | *(vazio: posta na própria URL)* | `get` |
| `wp-admin/network/site-themes.php` | 246 | `site-themes.php?action=update-site` | `post` |

Tabela de listagem: `WP_MS_Themes_List_Table` (`wp-admin/network/site-themes.php:28`).

#### 3. Campos

**1** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/network/site-themes.php` | `id` | `hidden` | não | 241 |

> ⚠️ **Nenhum** dos 1 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**17** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage themes for this site. | `wp-admin/network/site-themes.php` | 14 |
| Filter site themes list | `wp-admin/network/site-themes.php` | 22 |
| Site themes list navigation | `wp-admin/network/site-themes.php` | 23 |
| Site themes list | `wp-admin/network/site-themes.php` | 24 |
| Invalid site ID. | `wp-admin/network/site-themes.php` | 46 |
| The requested site does not exist. | `wp-admin/network/site-themes.php` | 53 |
| Sorry, you are not allowed to access this page. | `wp-admin/network/site-themes.php` | 57 |
| Edit Site: %s | `wp-admin/network/site-themes.php` | 171 |
| Visit | `wp-admin/network/site-themes.php` | 181 |
| Dashboard | `wp-admin/network/site-themes.php` | 181 |
| Theme enabled. | `wp-admin/network/site-themes.php` | 194 |
| %s theme enabled. | `wp-admin/network/site-themes.php` | 197 |
| … | `wp-admin/network/site-themes.php` | +5 strings |

Mensagens de recusa (`wp_die`), **4** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage themes for this site." (`wp-admin/network/site-themes.php:14`)
- "Invalid site ID." (`wp-admin/network/site-themes.php:46`)
- "The requested site does not exist." (`wp-admin/network/site-themes.php:53`)
- "Sorry, you are not allowed to access this page." (`wp-admin/network/site-themes.php:57`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **5** ações distintas: `enable-theme_`, `disable-theme_`, `bulk-themes`, `bulk-themes`, `bulk-themes`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **1**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `$referer` | `wp-admin/network/site-themes.php` | 162 |

Transição de recusa: qualquer um dos 4 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/network/site-themes.php:13`.
- **Origem da requisição**: 5 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 1 campos com `required`.
- **Recusa**: 4 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-site-usuarios

**ID no inventário**: `SCR-105`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/site-users.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/site-users.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `create_users`, `manage_sites`, `promote_user`, `promote_users`, `remove_users`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{id}}`, `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Site - usuarios

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/site-users.php"
spec.route: "/wp-admin/network/site-users.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: dinâmico — `sprintf( __( 'Edit Site: %s' ), esc_html( $details->blogname ) )` (`wp-admin/network/site-users.php:220`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Primeiro `<h1>`**: `' . __( 'An error occurred.' ) . '` (`wp-admin/network/site-users.php:176`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/network/site-users.php` com 406 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **4**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/site-users.php` | 311 | *(vazio: posta na própria URL)* | `get` |
| `wp-admin/network/site-users.php` | 318 | `site-users.php?action=update-site` | `post` |
| `wp-admin/network/site-users.php` | 337 | `site-users.php?action=adduser` | `post` |
| `wp-admin/network/site-users.php` | 374 | expressão PHP — `<?php echo esc_url( network_admin_url( … )` | `get` |

Tabela de listagem: `WP_Users_List_Table` (`wp-admin/network/site-users.php:17`).

#### 3. Campos

**5** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/network/site-users.php` | `id` | `hidden` | não | 313 |
| `wp-admin/network/site-users.php` | `newuser` | `text` | não | 342 |
| `wp-admin/network/site-users.php` | `new_role` | `select` | não | 346 |
| `wp-admin/network/site-users.php` | `user[username]` | `text` | não | 379 |
| `wp-admin/network/site-users.php` | `user[email]` | `text` | não | 383 |

> ⚠️ **Nenhum** dos 5 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**35** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to edit this site. | `wp-admin/network/site-users.php` | 14 |
| Filter site users list | `wp-admin/network/site-users.php` | 25 |
| Site users list navigation | `wp-admin/network/site-users.php` | 26 |
| Site users list | `wp-admin/network/site-users.php` | 27 |
| Invalid site ID. | `wp-admin/network/site-users.php` | 41 |
| The requested site does not exist. | `wp-admin/network/site-users.php` | 46 |
| Sorry, you are not allowed to access this page. | `wp-admin/network/site-users.php` | 50 |
| Sorry, you are not allowed to remove users. | `wp-admin/network/site-users.php` | 120 |
| Sorry, you are not allowed to edit this user. | `wp-admin/network/site-users.php` | 144 |
| &mdash; No role for this site &mdash; | `wp-admin/network/site-users.php` | 152 |
| Sorry, you are not allowed to give users that role. | `wp-admin/network/site-users.php` | 156 |
| An error occurred. | `wp-admin/network/site-users.php` | 176 |
| … | `wp-admin/network/site-users.php` | +23 strings |

Mensagens de recusa (`wp_die`), **7** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to edit this site." (`wp-admin/network/site-users.php:14`)
- "Invalid site ID." (`wp-admin/network/site-users.php:41`)
- "The requested site does not exist." (`wp-admin/network/site-users.php:46`)
- "Sorry, you are not allowed to access this page." (`wp-admin/network/site-users.php:50`)
- "Sorry, you are not allowed to remove users." (`wp-admin/network/site-users.php:120`)
- "Sorry, you are not allowed to edit this user." (`wp-admin/network/site-users.php:144`)
- (+1 mensagens em `wp-admin/network/site-users.php`)

Rótulos de botão de envio: "Add User".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **7** ações distintas: `add-user`, `add-user`, `bulk-users`, `bulk-users`, `bulk-users`, `add-user`, `add-user`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **2**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `add_query_arg( 'update', $update, $referer )` | `wp-admin/network/site-users.php` | 205 |
| `$referer` | `wp-admin/network/site-users.php` | 212 |

Transição de recusa: qualquer um dos 7 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 5 checagens `current_user_can()`, 5 capacidades distintas. Primeira em `wp-admin/network/site-users.php:13`.
- **Origem da requisição**: 7 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 5 campos com `required`.
- **Recusa**: 7 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-adicionar-site

**ID no inventário**: `SCR-106`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/site-new.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/site-new.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `create_sites`, `install_languages`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Adicionar site

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/site-new.php"
spec.route: "/wp-admin/network/site-new.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Add Site" (`wp-admin/network/site-new.php:182`)
- **Primeiro `<h1>`**: `<?php _e( 'Add Site' ); ?>` (`wp-admin/network/site-new.php:192`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/network/site-new.php` com 306 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/site-new.php` | 207 | expressão PHP — `<?php echo esc_url( network_admin_url( … )` | `post` |

#### 3. Campos

**3** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/network/site-new.php` | `blog[domain]` | `text` | sim | 222 |
| `wp-admin/network/site-new.php` | `blog[title]` | `text` | sim | 243 |
| `wp-admin/network/site-new.php` | `blog[email]` | `email` | sim | 285 |

#### 4. Mensagens literais

**24** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to add sites to this network. | `wp-admin/network/site-new.php` | 17 |
| Overview | `wp-admin/network/site-new.php` | 23 |
| This screen is for Super Admins to add new sites to the network. This is not affected by the registration settings. | `wp-admin/network/site-new.php` | 25 |
| If the admin email for the new site does not exist in the database, a new user will also be created. | `wp-admin/network/site-new.php` | 26 |
| For more information: | `wp-admin/network/site-new.php` | 31 |
| <a href="https://developer.wordpress.org/advanced-administration/multisite/admin/#network-admin-sites-screen">Documentation on Site Management</a> | `wp-admin/network/site-new.php` | 32 |
| <a href="https://wordpress.org/support/forum/multisite/">Support forums</a> | `wp-admin/network/site-new.php` | 33 |
| Cannot create an empty site. | `wp-admin/network/site-new.php` | 40 |
| The following words are reserved for use by WordPress functions and cannot be used as site names: %s | `wp-admin/network/site-new.php` | 59 |
| Missing site title. | `wp-admin/network/site-new.php` | 87 |
| Missing or invalid site address. | `wp-admin/network/site-new.php` | 91 |
| Missing email address. | `wp-admin/network/site-new.php` | 95 |
| … | `wp-admin/network/site-new.php` | +12 strings |

Mensagens de recusa (`wp_die`), **8** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to add sites to this network." (`wp-admin/network/site-new.php:17`)
- "Cannot create an empty site." (`wp-admin/network/site-new.php:40`)
- "Missing site title." (`wp-admin/network/site-new.php:87`)
- "Missing or invalid site address." (`wp-admin/network/site-new.php:91`)
- "Missing email address." (`wp-admin/network/site-new.php:95`)
- "Invalid email address." (`wp-admin/network/site-new.php:100`)
- (+2 mensagens em `wp-admin/network/site-new.php`)

Rótulos de botão de envio: "Add Site".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `add-blog`, `add-blog`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 8 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/network/site-new.php:16`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 3 de 3 campos com `required`.
- **Recusa**: 8 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-lista-de-usuarios

**ID no inventário**: `SCR-107`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/users.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/users.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `create_users`, `delete_user`, `delete_users`, `manage_network_users`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{printf_args}} (2 mensagens com placeholder posicional)`  
**Transições de saída**: `users.php`  
**Linha no `ui/inventory.md` do Visor**: Usuarios da rede

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/users.php"
spec.route: "/wp-admin/network/users.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Users" (`wp-admin/network/users.php:34`)
- **Primeiro `<h1>`**: `<?php esc_html_e( 'Users' ); ?>` (`wp-admin/network/users.php:353`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/network/users.php` com 387 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **2**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/users.php` | 377 | *(vazio: posta na própria URL)* | `get` |
| `wp-admin/network/users.php` | 381 | `users.php?action=allusers` | `post` |

Tabela de listagem: `WP_MS_Users_List_Table` (`wp-admin/network/users.php:265`).

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**25** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to access this page. | `wp-admin/network/users.php` | 14 |
| Users | `wp-admin/network/users.php` | 34 |
| Warning! User cannot be modified. The user %s is a network administrator. | `wp-admin/network/users.php` | 88 |
| Overview | `wp-admin/network/users.php` | 284 |
| This table shows all users across the network and the sites to which they are assigned. | `wp-admin/network/users.php` | 286 |
| Hover over any user on the list to make the edit links appear. The Edit link on the left will take you to their Edit User profile page; the Edit link … | `wp-admin/network/users.php` | 287 |
| You can also go to the user&#8217;s profile page by clicking on the individual username. | `wp-admin/network/users.php` | 288 |
| You can sort the table by clicking on any of the table headings and switch between list and excerpt views by using the icons above the users list. | `wp-admin/network/users.php` | 289 |
| The bulk action will permanently delete selected users, or mark/unmark those selected as spam. Spam users will have posts removed and will be unable t… | `wp-admin/network/users.php` | 290 |
| You can make an existing user an additional super admin by going to the Edit User profile page and checking the box to grant that privilege. | `wp-admin/network/users.php` | 291 |
| For more information: | `wp-admin/network/users.php` | 296 |
| <a href="https://codex.wordpress.org/Network_Admin_Users_Screen">Documentation on Network Users</a> | `wp-admin/network/users.php` | 297 |
| … | `wp-admin/network/users.php` | +13 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to access this page." (`wp-admin/network/users.php:14`)

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **3** ações distintas: `deleteuser`, `bulk-users-network`, `ms-users-delete`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **4**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_admin_url( 'users.php' )` | `wp-admin/network/users.php` | 45 |
| `$sendback` | `wp-admin/network/users.php` | 163 |
| `$location` | `wp-admin/network/users.php` | 182 |
| `add_query_arg( 'paged', $total_pages )` | `wp-admin/network/users.php` | 271 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 4 checagens `current_user_can()`, 4 capacidades distintas. Primeira em `wp-admin/network/users.php:13`.
- **Origem da requisição**: 3 ações de `nonce`. A falha leva a `SCR-112`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-adicionar-usuario

**ID no inventário**: `SCR-108`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/user-new.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/user-new.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `create_users`, `manage_network_users`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: nenhum detectado  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Adicionar usuario a rede

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/user-new.php"
spec.route: "/wp-admin/network/user-new.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Add User" (`wp-admin/network/user-new.php:100`)
- **Primeiro `<h1>`**: `<?php _e( 'Add User' ); ?>` (`wp-admin/network/user-new.php:107`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/network/user-new.php` com 167 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/user-new.php` | 137 | expressão PHP — `<?php echo esc_url( network_admin_url( … )` | `get` |

#### 3. Campos

**2** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/network/user-new.php` | `user[username]` | `text` | sim | 142 |
| `wp-admin/network/user-new.php` | `user[email]` | `email` | sim | 146 |

#### 4. Mensagens literais

**16** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to add users to this network. | `wp-admin/network/user-new.php` | 14 |
| Overview | `wp-admin/network/user-new.php` | 20 |
| Add User will set up a new user account on the network and send that person an email with username and password. | `wp-admin/network/user-new.php` | 22 |
| Users who are signed up to the network without a site are added as subscribers to the main or primary dashboard site, giving them profile pages to man… | `wp-admin/network/user-new.php` | 23 |
| For more information: | `wp-admin/network/user-new.php` | 28 |
| <a href="https://codex.wordpress.org/Network_Admin_Users_Screen">Documentation on Network Users</a> | `wp-admin/network/user-new.php` | 29 |
| <a href="https://wordpress.org/support/forum/multisite/">Support forums</a> | `wp-admin/network/user-new.php` | 30 |
| Sorry, you are not allowed to access this page. | `wp-admin/network/user-new.php` | 37 |
| Cannot create an empty user. | `wp-admin/network/user-new.php` | 41 |
| Cannot add user. | `wp-admin/network/user-new.php` | 55 |
| User added. | `wp-admin/network/user-new.php` | 91 |
| Edit user | `wp-admin/network/user-new.php` | 94 |
| … | `wp-admin/network/user-new.php` | +4 strings |

Mensagens de recusa (`wp_die`), **3** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to add users to this network." (`wp-admin/network/user-new.php:14`)
- "Sorry, you are not allowed to access this page." (`wp-admin/network/user-new.php:37`)
- "Cannot create an empty user." (`wp-admin/network/user-new.php:41`)

Rótulos de botão de envio: "Add User".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **2** ações distintas: `add-user`, `add-user`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transição de recusa: qualquer um dos 3 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/network/user-new.php:13`.
- **Origem da requisição**: 2 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 2 de 2 campos com `required`.
- **Recusa**: 3 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-lista-de-temas

**ID no inventário**: `SCR-109`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/themes.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/themes.php`  
**Tela crítica?**: não  
**Capacidade exigida**: `delete_themes`, `install_themes`, `manage_network_themes`, `update_themes`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{_SERVER}}`, `{{referer}}`, `{{status}}`, `{{page}}`, `{{printf_args}} (7 mensagens com placeholder posicional)`  
**Transições de saída**: `themes.php?enabled=1`  
**Linha no `ui/inventory.md` do Visor**: Temas da rede

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/themes.php"
spec.route: "/wp-admin/network/themes.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Update Themes" (`wp-admin/network/themes.php:85`)
- **Primeiro `<h1>`**: `' . esc_html( $title ) . '` (`wp-admin/network/themes.php:91`)
- **Tipo estrutural**: `list`
- **Tamanho do arquivo de origem**: `wp-admin/network/themes.php` com 489 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **4**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/themes.php` | 176 | expressão PHP — `<?php echo esc_url( $_SERVER[ … )` | `post` |
| `wp-admin/network/themes.php` | 196 | expressão PHP — `<?php echo $referer ? esc_url( $referer ) : … )` | `post` |
| `wp-admin/network/themes.php` | 462 | *(vazio: posta na própria URL)* | `get` |
| `wp-admin/network/themes.php` | 474 | *(vazio: posta na própria URL)* | `post` |

Tabela de listagem: `WP_MS_Themes_List_Table` (`wp-admin/network/themes.php:17`).

#### 3. Campos

**5** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/network/themes.php` | `verify-delete` | `hidden` | não | 177 |
| `wp-admin/network/themes.php` | `action` | `hidden` | não | 178 |
| `wp-admin/network/themes.php` | `checked[]` | `hidden` | não | 182 |
| `wp-admin/network/themes.php` | `theme_status` | `hidden` | não | 475 |
| `wp-admin/network/themes.php` | `paged` | `hidden` | não | 476 |

> ⚠️ **Nenhum** dos 5 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**48** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to manage network themes. | `wp-admin/network/themes.php` | 14 |
| Update Themes | `wp-admin/network/themes.php` | 85 |
| Sorry, you are not allowed to delete themes for this site. | `wp-admin/network/themes.php` | 102 |
| Delete Theme | `wp-admin/network/themes.php` | 137 |
| Caution: | `wp-admin/network/themes.php` | 140 |
| This theme may be active on other sites in the network. | `wp-admin/network/themes.php` | 140 |
| You are about to remove the following theme: | `wp-admin/network/themes.php` | 146 |
| Delete Themes | `wp-admin/network/themes.php` | 148 |
| These themes may be active on other sites in the network. | `wp-admin/network/themes.php` | 151 |
| You are about to remove the following themes: | `wp-admin/network/themes.php` | 157 |
| %1$s by %2$s | `wp-admin/network/themes.php` | 164 |
| Are you sure you want to delete this theme? | `wp-admin/network/themes.php` | 172 |
| … | `wp-admin/network/themes.php` | +36 strings |

Mensagens de recusa (`wp_die`), **3** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to manage network themes." (`wp-admin/network/themes.php:14`)
- "Sorry, you are not allowed to delete themes for this site." (`wp-admin/network/themes.php:102`)
- "Sorry, you are not allowed to change themes automatic update settings." (`wp-admin/network/themes.php:240`)

Rótulos de botão de envio: "Yes, delete this theme", "Yes, delete these themes", "No, return me to the theme list".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **10** ações distintas: `enable-theme_`, `disable-theme_`, `bulk-themes`, `bulk-themes`, `bulk-themes`, `bulk-themes`, `bulk-themes`, `updates` (+2).
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **13**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_admin_url( 'themes.php?enabled=1' )` | `wp-admin/network/themes.php` | 43 |
| `add_query_arg( 'enabled', 1, $referer )` | `wp-admin/network/themes.php` | 45 |
| `add_query_arg( 'disabled', '1', $referer )` | `wp-admin/network/themes.php` | 51 |
| `add_query_arg( 'error', 'none', $referer )` | `wp-admin/network/themes.php` | 57 |
| `add_query_arg( 'enabled', count( $themes ), $referer )` | `wp-admin/network/themes.php` | 61 |
| `add_query_arg( 'error', 'none', $referer )` | `wp-admin/network/themes.php` | 67 |
| `add_query_arg( 'disabled', count( $themes ), $referer )` | `wp-admin/network/themes.php` | 71 |
| `add_query_arg( 'error', 'none', $referer )` | `wp-admin/network/themes.php` | 110 |
| `add_query_arg( 'error', 'main', $referer )` | `wp-admin/network/themes.php` | 117 |
| `add_query_arg( 'error', 'none', $referer )` | `wp-admin/network/themes.php` | 248 |
| +3 | `wp-admin/network/themes.php` | |

Transição de recusa: qualquer um dos 3 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 4 checagens `current_user_can()`, 4 capacidades distintas. Primeira em `wp-admin/network/themes.php:13`.
- **Origem da requisição**: 10 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 5 campos com `required`.
- **Recusa**: 3 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | tabela paginada com os itens da consulta corrente, filtros e ações em massa |
| Loading | operação assíncrona em curso | esqueleto de linha enquanto a consulta corre |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de resultado da ação em massa, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-configuracoes

**ID no inventário**: `SCR-110`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/settings.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/settings.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `install_languages`, `manage_network_options`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{new_registrations_settings_title}}`, `{{illegal_names}}`, `{{limited_email_domains}}`, `{{banned_email_domains}}`, `{{enable_administration_menus_title}}`, `{{printf_args}} (4 mensagens com placeholder posicional)`  
**Transições de saída**: `$redirect`, `settings.php?updated=true`, `settings.php`  
**Linha no `ui/inventory.md` do Visor**: Configuracoes da rede

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/settings.php"
spec.route: "/wp-admin/network/settings.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Network Settings" (`wp-admin/network/settings.php:21`)
- **Primeiro `<h1>`**: `<?php echo esc_html( $title ); ?>` (`wp-admin/network/settings.php:153`)
- **Tipo estrutural**: `form`
- **Tamanho do arquivo de origem**: `wp-admin/network/settings.php` com 542 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Formulários desta tela: **1**.

| Arquivo | Linha | `action` | `method` |
|---|---|---|---|
| `wp-admin/network/settings.php` | 154 | `settings.php` | `post` |

#### 3. Campos

**21** campos distintos. O nome do campo é contrato: não renomear.

| Arquivo | `name` | `type` | Obrigatório no HTML | Linha |
|---|---|---|---|---|
| `wp-admin/network/settings.php` | `site_name` | `text` | não | 161 |
| `wp-admin/network/settings.php` | `new_admin_email` | `email` | não | 168 |
| `wp-admin/network/settings.php` | `registration` | `radio` | não | 214 |
| `wp-admin/network/settings.php` | `registrationnotification` | `checkbox` | não | 242 |
| `wp-admin/network/settings.php` | `add_new_users` | `checkbox` | não | 249 |
| `wp-admin/network/settings.php` | `illegal_names` | `text` | não | 265 |
| `wp-admin/network/settings.php` | `limited_email_domains` | `textarea` | não | 289 |
| `wp-admin/network/settings.php` | `banned_email_domains` | `textarea` | não | 309 |
| `wp-admin/network/settings.php` | `welcome_email` | `textarea` | não | 324 |
| `wp-admin/network/settings.php` | `welcome_user_email` | `textarea` | não | 334 |
| `wp-admin/network/settings.php` | `first_post` | `textarea` | não | 344 |
| `wp-admin/network/settings.php` | `first_page` | `textarea` | não | 354 |
| `wp-admin/network/settings.php` | `first_comment` | `textarea` | não | 364 |
| `wp-admin/network/settings.php` | `first_comment_author` | `text` | não | 374 |
| `wp-admin/network/settings.php` | `first_comment_email` | `text` | não | 383 |
| `wp-admin/network/settings.php` | `first_comment_url` | `text` | não | 392 |
| `wp-admin/network/settings.php` | `upload_space_check_disabled` | `checkbox` | não | 404 |
| `wp-admin/network/settings.php` | `blog_upload_space` | `number` | não | 409 |
| `wp-admin/network/settings.php` | `upload_filetypes` | `text` | não | 425 |
| `wp-admin/network/settings.php` | `fileupload_maxk` | `number` | não | 439 |
| `wp-admin/network/settings.php` | `menu_items[` | `checkbox` | não | 517 |

> ⚠️ **Nenhum** dos 21 campos tem atributo `required` no HTML. A validação é toda do lado servidor. Reproduzir isso importa: um alvo que acrescenta `required` muda o comportamento observável da tela sem que ninguém tenha decidido.

#### 4. Mensagens literais

**69** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Sorry, you are not allowed to access this page. | `wp-admin/network/settings.php` | 17 |
| Network Settings | `wp-admin/network/settings.php` | 21 |
| Overview | `wp-admin/network/settings.php` | 49 |
| This screen sets and changes options for the network as a whole. The first site is the main site in the network and network options are pulled from th… | `wp-admin/network/settings.php` | 51 |
| Operational settings has fields for the network&#8217;s name and admin email. | `wp-admin/network/settings.php` | 52 |
| Registration settings can disable/enable public signups. If you let others sign up for a site, install spam plugins. Spaces, not commas, should separa… | `wp-admin/network/settings.php` | 53 |
| New site settings are defaults applied when a new site is created in the network. These include welcome email for when a new site or user account is r… | `wp-admin/network/settings.php` | 54 |
| Upload settings control the size of the uploaded files and the amount of available upload space for each site. You can change the default value for sp… | `wp-admin/network/settings.php` | 55 |
| You can set the language, and WordPress will automatically download and install the translation files (available if your filesystem is writable). | `wp-admin/network/settings.php` | 56 |
| Menu setting enables/disables the plugin menus from appearing for non super admins, so that only super admins, not site admins, have access to activat… | `wp-admin/network/settings.php` | 57 |
| Super admins can no longer be added on the Options screen. You must now go to the list of existing users on Network Admin > Users and click on Usernam… | `wp-admin/network/settings.php` | 58 |
| For more information: | `wp-admin/network/settings.php` | 63 |
| … | `wp-admin/network/settings.php` | +57 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to access this page." (`wp-admin/network/settings.php:17`)

Rótulos de botão de envio: "<padrao: Save Changes>".

#### 5. Eventos e transições

Conferência de origem da requisição (`nonce`), **3** ações distintas: `dismiss_new_network_admin_email`, `siteoptions`, `siteoptions`.
O nome da ação do `nonce` é contrato: ele muda o valor do campo oculto que o formulário envia.

Transições por redirecionamento, **3**:

| Destino (expressão do legado) | Arquivo | Linha |
|---|---|---|
| `network_admin_url( $redirect )` | `wp-admin/network/settings.php` | 34 |
| `network_admin_url( 'settings.php?updated=true' )` | `wp-admin/network/settings.php` | 40 |
| `add_query_arg( 'updated', 'true', network_admin_url( 'settings.php' ) )` | `wp-admin/network/settings.php` | 134 |

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 2 checagens `current_user_can()`, 2 capacidades distintas. Primeira em `wp-admin/network/settings.php:16`.
- **Origem da requisição**: 3 ações de `nonce`. A falha leva a `SCR-112`.
- **Obrigatoriedade no cliente**: 0 de 21 campos com `required`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | campos preenchidos com o valor corrente |
| Loading | operação assíncrona em curso | botão de gravar desabilitado durante o envio |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de gravação do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: rede-atualizacao

**ID no inventário**: `SCR-111`  
**Grupo**: Rede  
**Origem**: `wp-admin/network/upgrade.php`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `/wp-admin/network/upgrade.php`  
**Tela crítica?**: sim  
**Capacidade exigida**: `upgrade_network`  
**Componentes do design-system**: `$menu-background`, `$body-background`, `$card-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-20`, `$button-height-default`, `$alert-red-bg`  
**Pontos de interpolação**: `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Atualizacao da rede

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-admin/network/upgrade.php"
spec.route: "/wp-admin/network/upgrade.php"
spec.deviations: [DEV-001]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**, literal do legado: "Upgrade Network" (`wp-admin/network/upgrade.php:21`)
- **Primeiro `<h1>`**: `' . __( 'Upgrade Network' ) . '` (`wp-admin/network/upgrade.php:48`)
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-admin/network/upgrade.php` com 160 linhas

#### 2. Layout

Moldura do painel, a mesma nas **68** telas que carregam `admin-header.php`:

1. `wp-admin/admin-header.php` abre o documento, a barra de administração e o aviso de rede.
2. `wp-admin/menu-header.php` (314 linhas) monta o menu lateral a partir de `wp-admin/menu.php`; o item corrente sai de `$parent_file` e `$submenu_file`.
3. O corpo da tela entra num `<div class="wrap">`, com `<h1 class="wp-heading-inline">` e os avisos de `settings_errors()`.
4. `wp-admin/admin-footer.php` fecha.

> A moldura **não** é desenho desta tela: é plataforma. Em [`target_architecture.md`](target_architecture.md) § *BC-10* o arcabouço de `telas-do-painel` está na camada de plataforma, separado das telas. Especificá-la 68 vezes seria repetir o mesmo contrato.

Tela sem formulário e sem tabela de listagem: o corpo é conteúdo e navegação.

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**16** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| Upgrade Network | `wp-admin/network/upgrade.php` | 21 |
| Overview | `wp-admin/network/upgrade.php` | 27 |
| Only use this screen once you have updated to a new version of WordPress through Updates/Available Updates (via the Network Administration navigation … | `wp-admin/network/upgrade.php` | 29 |
| If a version update to core has not happened, clicking this button will not affect anything. | `wp-admin/network/upgrade.php` | 30 |
| If this process fails for any reason, users logging in to their sites will force the same update. | `wp-admin/network/upgrade.php` | 31 |
| For more information: | `wp-admin/network/upgrade.php` | 36 |
| <a href="https://developer.wordpress.org/advanced-administration/multisite/admin/#network-admin-updates-screen">Documentation on Upgrade Network</a> | `wp-admin/network/upgrade.php` | 37 |
| <a href="https://wordpress.org/support/forums/">Support forums</a> | `wp-admin/network/upgrade.php` | 38 |
| Sorry, you are not allowed to access this page. | `wp-admin/network/upgrade.php` | 44 |
| All done! | `wp-admin/network/upgrade.php` | 75 |
| Warning! Problem updating %1$s. Your server may not be able to connect to sites running on it. Error message: %2$s | `wp-admin/network/upgrade.php` | 100 |
| If your browser does not start loading the next page automatically, click this link: | `wp-admin/network/upgrade.php` | 126 |
| … | `wp-admin/network/upgrade.php` | +4 strings |

Mensagens de recusa (`wp_die`), **1** nesta tela. Todas renderizam na tela compartilhada `tela-de-erro-generica` (`SCR-112`):

- "Sorry, you are not allowed to access this page." (`wp-admin/network/upgrade.php:44`)

#### 5. Eventos e transições

Transição de recusa: qualquer um dos 1 `wp_die()` leva a `SCR-112`, com resposta HTTP própria.

#### 6. Validações

- **Autorização**: 1 checagens `current_user_can()`, 1 capacidades distintas. Primeira em `wp-admin/network/upgrade.php:43`.
- **Recusa**: 1 caminhos de `wp_die()`, cada um com sua mensagem literal (§ 4).

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: tela-de-erro-generica

**ID no inventário**: `SCR-112`  
**Grupo**: Erro e recuperacao  
**Origem**: `wp-includes/functions.php:3907`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: renderizada por wp_die() sobre a rota que falhou`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$alert-red`, `$alert-red-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-30`  
**Pontos de interpolação**: `{{dir_attr}}`, `{{parsed_args}}`, `{{message}}`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: 🔴 **ausente** — tela que o Visor não cataloga (ver `EC-03` na decisão)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-includes/functions.php:3907"
spec.route: "nenhuma: renderizada por wp_die() sobre a rota que falhou"
spec.deviations: [DEV-001, DEV-003]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: dinâmico — `'', $args = array() ) {` (`wp-includes/functions.php:3907`). O alvo resolve a mesma expressão; o texto não é escolhido aqui.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-includes/functions.php` com 9399 linhas, faixa 3907–4095

#### 2. Layout

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**1** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| &laquo; Back | `wp-includes/functions.php` | 3937 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-003`: a folha de estilo desta tela é embutida e usa 12 valores sem token em `tokens.md`; os tokens derivados estão em [`../design-system/tokens-derived.md`](../design-system/tokens-derived.md) § 2 ([`screen_deviation_log.md`](screen_deviation_log.md#dev-003)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Tela: tela-de-erro-critico

**ID no inventário**: `SCR-113`  
**Grupo**: Erro e recuperacao  
**Origem**: `wp-includes/class-wp-fatal-error-handler.php:174`  
**Modo aplicado**: **modernizado**  
**Rota no alvo** (preservada, `topology_decision.md`): `nenhuma: renderizada pelo tratador de erro fatal sobre qualquer rota`  
**Tela crítica?**: sim  
**Capacidade exigida**: nenhuma checagem `current_user_can()` neste arquivo  
**Componentes do design-system**: `$alert-red`, `$alert-red-bg`, `$text-primary`, `$font-size-m`, `$grid-unit-30`  
**Pontos de interpolação**: `{{printf_args}} (1 mensagens com placeholder posicional)`  
**Transições de saída**: nenhum `wp_redirect` neste arquivo  
**Linha no `ui/inventory.md` do Visor**: Modo de recuperacao (erro fatal)

### Especificação

```yaml
spec.kind: raw-prose          # EC-01: par origem->alvo sem adapter na v1
spec.mode: modernizado
spec.legacy_origin: "wp-includes/class-wp-fatal-error-handler.php:174"
spec.route: "nenhuma: renderizada pelo tratador de erro fatal sobre qualquer rota"
spec.deviations: [DEV-001, DEV-003]
spec.normalize:
  - line_endings: "\n"
  - trim_trailing_spaces: false
  - normalize_utf8: true
  - compare: semantic-contract     # evento, transição, texto, estado
```

#### 1. Identidade

- **Título da tela**: não há `$title` literal nem `login_header()` neste arquivo. O título é montado pelo chamador.
- **Tipo estrutural**: `page`
- **Tamanho do arquivo de origem**: `wp-includes/class-wp-fatal-error-handler.php` com 248 linhas, faixa 174–246

#### 2. Layout

#### 3. Campos

Nenhum campo de entrada neste arquivo.

#### 4. Mensagens literais

**7** strings literais. O princípio 2 do SKILL preserva o texto **verbatim**, e nenhuma revisão linguística foi aprovada na decisão desta etapa: `diff` de string tem de ser zero, ignorando espaço à direita. No legado cada uma delas passa por `__()`, e o `msgid` em inglês **é** a chave do catálogo (`EC-05`) — por isso as linhas abaixo estão em inglês, e é assim que têm de chegar ao alvo.

| `msgid` (chave do catálogo, literal) | Arquivo | Linha |
|---|---|---|
| There has been a critical error on this website, putting it in recovery mode. Please check the Themes and Plugins screens for more details. If you jus… | `wp-includes/class-wp-fatal-error-handler.php` | 188 |
| There has been a critical error on this website. Please reach out to your site administrator, and inform them of this error for further assistance. | `wp-includes/class-wp-fatal-error-handler.php` | 191 |
| There has been a critical error on this website. Please check your site admin email inbox for instructions. If you continue to have problems, please t… | `wp-includes/class-wp-fatal-error-handler.php` | 195 |
| https://wordpress.org/support/forums/ | `wp-includes/class-wp-fatal-error-handler.php` | 196 |
| There has been a critical error on this website. | `wp-includes/class-wp-fatal-error-handler.php` | 200 |
| https://wordpress.org/documentation/article/faq-troubleshooting/ | `wp-includes/class-wp-fatal-error-handler.php` | 207 |
| Learn more about troubleshooting WordPress. | `wp-includes/class-wp-fatal-error-handler.php` | 208 |

#### 5. Eventos e transições

Nenhum redirecionamento, `nonce` ou `wp_die` neste arquivo: a tela é terminal, ou a navegação está no chamador.

#### 6. Validações

- Nenhuma validação neste arquivo. A validação está no chamador ou na camada de dados.

> O que **não** se deduz daqui: o legado valida quase tudo no servidor, por filtro, e o filtro é ponto de extensão. Nenhuma validação desta seção pode ser endurecida no alvo sem decisão registrada — endurecer produz um sistema mais fechado que o legado, que é o erro que [`../backlog/backlog.md`](../backlog/backlog.md) já registrou em REQ-004, REQ-008, REQ-044 e REQ-051.

### Pontos de divergência aceitos

- `DEV-001`: o par `php-server-rendered → node-ts-server-rendered` não tem adapter na v1; esta spec está em `raw-prose` e o codificador interpreta prosa, não um formato canônico ([`screen_deviation_log.md`](screen_deviation_log.md#dev-001)).
- `DEV-003`: a folha de estilo desta tela é embutida e usa 12 valores sem token em `tokens.md`; os tokens derivados estão em [`../design-system/tokens-derived.md`](../design-system/tokens-derived.md) § 2 ([`screen_deviation_log.md`](screen_deviation_log.md#dev-003)).

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | estado padrão antes de qualquer ação | conteúdo da tela montado |
| Loading | operação assíncrona em curso | esqueleto de bloco enquanto os dados carregam |
| Error | falha na operação ou dado inválido | a mensagem de erro do legado, preservada literal |
| Success | operação concluída | o aviso de conclusão do legado, preservado literal |

> ⚠️ Os quatro estados são **declaração do modo modernizado**, não leitura do legado. O legado não tem estado `loading`: ele monta a página inteira no servidor e a entrega pronta. O princípio 6 do SKILL manda declará-los explicitamente em modo modernizado, e é o que está feito — com a ressalva de que `Loading` é **tela nova**, não paridade. O texto de `Error` e `Success`, ao contrário, é o do legado, literal (§ 4).

---

## Apêndice A: rastreabilidade ao inventário

| Tela | Modo | Origem no `ui/inventory.md` do Visor | Id no inventário interno |
|---|---|---|---|
| `login` | literal | Login | `SCR-001` |
| `recuperacao-de-senha-pedido` | modernizado | Recuperacao de senha - pedido | `SCR-002` |
| `recuperacao-de-senha-redefinicao` | literal | Recuperacao de senha - redefinicao | `SCR-003` |
| `confirmacao-de-saida-do-sistema` | modernizado | Logout / confirmacao | `SCR-004` |
| `registro-de-usuario` | literal | Registro de usuario | `SCR-005` |
| `aviso-de-e-mail-enviado` | modernizado | 🔴 ausente | `SCR-006` |
| `confirmacao-de-acao-por-chave` | modernizado | 🔴 ausente | `SCR-007` |
| `confirmacao-de-e-mail-de-administracao` | modernizado | 🔴 ausente | `SCR-008` |
| `cadastro-de-site-ou-usuario-na-rede` | modernizado | Cadastro de site/usuario (multisite) | `SCR-009` |
| `ativacao-de-conta-na-rede` | modernizado | Ativacao de conta (multisite) | `SCR-010` |
| `formulario-de-senha-de-conteudo` | literal | 🔴 ausente | `SCR-011` |
| `front-end-home-twentytwentyfive` | modernizado | T-01 | `SCR-012` |
| `front-end-home-twentytwentyfour` | modernizado | T-02 | `SCR-013` |
| `front-end-home-twentytwentythree` | modernizado | T-03 | `SCR-014` |
| `front-end-fallback-index` | modernizado | 🔴 ausente | `SCR-015` |
| `front-end-post-individual` | modernizado | Front-end: post individual | `SCR-016` |
| `front-end-pagina` | modernizado | Front-end: pagina | `SCR-017` |
| `front-end-arquivo` | modernizado | Front-end: arquivo | `SCR-018` |
| `front-end-busca` | modernizado | Front-end: busca | `SCR-019` |
| `front-end-404` | modernizado | Front-end: 404 | `SCR-020` |
| `front-end-pagina-sem-titulo` | modernizado | 🔴 ausente | `SCR-021` |
| `front-end-pagina-larga` | modernizado | 🔴 ausente | `SCR-022` |
| `front-end-pagina-com-barra-lateral` | modernizado | 🔴 ausente | `SCR-023` |
| `front-end-post-com-barra-lateral` | modernizado | 🔴 ausente | `SCR-024` |
| `front-end-tela-em-branco` | modernizado | 🔴 ausente | `SCR-025` |
| `front-end-blog-alternativo` | modernizado | 🔴 ausente | `SCR-026` |
| `front-end-fragmento-cabecalho` | modernizado | 🔴 ausente | `SCR-027` |
| `front-end-fragmento-rodape` | modernizado | Front-end: rodape | `SCR-028` |
| `front-end-fragmento-barra-lateral` | modernizado | 🔴 ausente | `SCR-029` |
| `front-end-fragmento-meta-do-post` | modernizado | 🔴 ausente | `SCR-030` |
| `front-end-fragmento-comentarios` | modernizado | 🔴 ausente | `SCR-031` |
| `configuracao-do-wp-config` | modernizado | Configuracao do wp-config.php | `SCR-032` |
| `instalador` | modernizado | Instalador (5 passos) | `SCR-033` |
| `atualizacao-do-banco` | modernizado | Atualizacao do banco | `SCR-034` |
| `reparo-do-banco` | modernizado | Reparo do banco | `SCR-035` |
| `painel-inicial` | modernizado | Home | `SCR-036` |
| `meus-sites` | modernizado | My Sites | `SCR-037` |
| `atualizacoes` | modernizado | Updates | `SCR-038` |
| `lista-de-conteudo` | modernizado | All Posts / All Pages (list table) | `SCR-039` |
| `editor-de-blocos-novo` | literal | Add Post / Add Page (editor) | `SCR-040` |
| `editor-de-blocos-edicao` | literal | Editar post existente | `SCR-041` |
| `editor-classico` | modernizado | Editor classico (fallback) | `SCR-042` |
| `comparacao-de-revisoes` | modernizado | Comparacao de revisoes | `SCR-043` |
| `lista-de-termos` | modernizado | Categories / Tags (list table) | `SCR-044` |
| `edicao-de-termo` | modernizado | Editar termo | `SCR-045` |
| `biblioteca-de-midia` | modernizado | Library | `SCR-046` |
| `envio-de-midia` | modernizado | Add Media File | `SCR-047` |
| `modal-de-selecao-de-midia` | literal | Modal de selecao de midia | `SCR-048` |
| `editor-de-imagem` | literal | Editor de imagem (recorte/rotacao) | `SCR-049` |
| `lista-de-links` | modernizado | All Links | `SCR-050` |
| `cadastro-de-link` | modernizado | Add Link | `SCR-051` |
| `importacao-de-opml` | modernizado | Importar OPML | `SCR-052` |
| `fila-de-comentarios` | modernizado | All Comments | `SCR-053` |
| `edicao-de-comentario` | modernizado | Editar comentario | `SCR-054` |
| `lista-de-temas` | modernizado | Themes | `SCR-055` |
| `editor-do-site` | literal | Editor / Design / Patterns | `SCR-056` |
| `biblioteca-de-fontes` | modernizado | Fonts | `SCR-057` |
| `personalizador` | literal | Customize | `SCR-058` |
| `menus-de-navegacao` | literal | Menus | `SCR-059` |
| `cabecalho-personalizado` | modernizado | Header | `SCR-060` |
| `fundo-personalizado` | modernizado | Background | `SCR-061` |
| `widgets-em-blocos` | literal | Widgets (blocos) | `SCR-062` |
| `widgets-classico` | literal | Widgets (classico) | `SCR-063` |
| `instalar-tema` | modernizado | Instalar tema | `SCR-064` |
| `editor-de-arquivo-de-tema` | modernizado | Editor de arquivos de tema | `SCR-065` |
| `lista-de-extensoes` | modernizado | Installed Plugins | `SCR-066` |
| `instalar-extensao` | modernizado | Add Plugin | `SCR-067` |
| `editor-de-arquivo-de-extensao` | modernizado | Plugin File Editor | `SCR-068` |
| `progresso-de-instalacao` | modernizado | Progresso de instalacao/atualizacao | `SCR-069` |
| `lista-de-usuarios` | modernizado | All Users | `SCR-070` |
| `cadastro-de-usuario` | modernizado | Add User | `SCR-071` |
| `perfil-proprio` | modernizado | Profile | `SCR-072` |
| `edicao-de-usuario` | modernizado | Editar outro usuario | `SCR-073` |
| `autorizar-aplicacao` | literal | Autorizar aplicacao | `SCR-074` |
| `ferramentas-disponiveis` | modernizado | Available Tools | `SCR-075` |
| `importar` | modernizado | Import | `SCR-076` |
| `exportar` | modernizado | Export | `SCR-077` |
| `saude-do-site` | modernizado | Site Health | `SCR-078` |
| `saude-do-site-informacoes` | modernizado | Site Health -> Info | `SCR-079` |
| `exportar-dados-pessoais` | modernizado | Export Personal Data | `SCR-080` |
| `apagar-dados-pessoais` | modernizado | Erase Personal Data | `SCR-081` |
| `apagar-site-da-rede` | modernizado | Delete Site | `SCR-082` |
| `instalacao-de-rede` | modernizado | Network Setup | `SCR-083` |
| `press-this` | modernizado | Press This | `SCR-084` |
| `opcoes-gerais` | modernizado | General | `SCR-085` |
| `opcoes-de-conectores` | modernizado | Connectors | `SCR-086` |
| `opcoes-de-escrita` | modernizado | Writing | `SCR-087` |
| `opcoes-de-leitura` | modernizado | Reading | `SCR-088` |
| `opcoes-de-discussao` | modernizado | Discussion | `SCR-089` |
| `opcoes-de-midia` | modernizado | Media | `SCR-090` |
| `opcoes-de-links-permanentes` | modernizado | Permalinks | `SCR-091` |
| `opcoes-de-privacidade` | modernizado | Privacy | `SCR-092` |
| `guia-da-politica-de-privacidade` | modernizado | Guia da politica de privacidade | `SCR-093` |
| `gravacao-generica-de-opcoes` | modernizado | Gravacao generica de opcoes | `SCR-094` |
| `sobre-o-wordpress` | modernizado | About WordPress | `SCR-095` |
| `creditos` | modernizado | Credits | `SCR-096` |
| `liberdades` | modernizado | Freedoms | `SCR-097` |
| `contribuir` | modernizado | Contribute | `SCR-098` |
| `privacidade-do-projeto` | modernizado | Privacy (do projeto) | `SCR-099` |
| `rede-painel` | modernizado | Painel da rede | `SCR-100` |
| `rede-lista-de-sites` | modernizado | Sites - lista | `SCR-101` |
| `rede-site-informacoes` | modernizado | Site - informacoes | `SCR-102` |
| `rede-site-configuracoes` | modernizado | Site - configuracoes | `SCR-103` |
| `rede-site-temas` | modernizado | Site - temas | `SCR-104` |
| `rede-site-usuarios` | modernizado | Site - usuarios | `SCR-105` |
| `rede-adicionar-site` | modernizado | Adicionar site | `SCR-106` |
| `rede-lista-de-usuarios` | modernizado | Usuarios da rede | `SCR-107` |
| `rede-adicionar-usuario` | modernizado | Adicionar usuario a rede | `SCR-108` |
| `rede-lista-de-temas` | modernizado | Temas da rede | `SCR-109` |
| `rede-configuracoes` | modernizado | Configuracoes da rede | `SCR-110` |
| `rede-atualizacao` | modernizado | Atualizacao da rede | `SCR-111` |
| `tela-de-erro-generica` | modernizado | 🔴 ausente | `SCR-112` |
| `tela-de-erro-critico` | modernizado | Modo de recuperacao (erro fatal) | `SCR-113` |

As **16** linhas com 🔴 são telas que o Visor não cataloga; as **5** entradas do Visor que não são tela estão em [`screen_modernization_decision.md`](screen_modernization_decision.md) § *O inventário divergiu do Visor acima do limite*. A divergência medida é de **20,6 %** e dispara `EC-03`.

---

## Apêndice B: o que esta spec não resolve

1. **Não há captura de tela útil.** 3 das 113 telas têm imagem, e as 3 são conteúdo de vitrine do tema, não desta instalação ([`../ui/inventory.md`](../ui/inventory.md) § *Caveat de origem*). Nenhuma seção acima afirma cor, posição ou espaçamento observado — o que elas afirmam é o que o código escreve.

2. **Não há oráculo executável.** Sem `wp-config.php`, sem banco e sem `wp-includes/js/dist/`, nenhuma das 113 telas pode ser renderizada nesta árvore para conferência. O `manifest.yaml` traz o comando sugerido por tela para quem tiver a instalação.

3. **Não há rede de segurança.** Zero arquivos de teste em 3.381. O Inspector não tem contra o que comparar além do próprio legado rodando.

4. **O lado cliente do editor está fora da árvore.** `wp-includes/js/dist/` não existe. As 4 telas da família A especificam o **ponto de montagem** e o objeto de configuração, que é o que o servidor entrega; o que o cliente desenha depois não está aqui e, por `ESC-CLIENTE`, não entra no porte.

5. **Toda regra desta spec é filtrável.** Rótulo, campo, capacidade e redirecionamento passam por filtro do barramento de hooks. Sem a lista de extensões ativas da instalação real, nenhuma seção acima é a palavra final — e é a mesma causa-raiz que `state.json` registra nas lacunas de cinco agentes anteriores.
