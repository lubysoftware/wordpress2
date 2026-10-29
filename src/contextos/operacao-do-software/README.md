# Modulo de operacao do software — BC-11

Feature `010-operacao-do-software`. Tarefas fechadas com nota de entrega neste
arquivo: **T001** (esqueleto, as quatro portas), **T002** (a configuracao
nomeada: o estado de atualizacao e o de recuperacao), **T003** (US-1, instalar
e atualizar extensao) e **T025** (US-12, modo de recuperacao). Este arquivo e a
leitura
obrigatoria de quem pegar a tarefa seguinte: ele diz o que ja esta decidido, o
que esta decidido **em outro lugar**, e o que **ninguem** decidiu.

A pasta e `contextos/operacao-do-software/` porque e assim que
`target_architecture.md` nomeia BC-11 no esboco de arvore. BC-11 e a **fusao de 7
modulos**, e a justificativa do agrupamento e uma invariante, nao conveniencia:
*"`A5`, `A6`, `A7` e `A9` sao uma so invariante: a atualizacao e agendada pelo
cron, o modo de recuperacao e o tratador de falha da atualizacao, e os tres
escrevem pelo sistema de arquivos"*. Separa-los poria a classificacao de falha num
modulo e o congelamento noutro, e CA-9.4 exige o oposto — *"a classificacao de
cada tipo de falha e declarada em um lugar so"*.

> 🔴 **Antes de qualquer coisa:** esta feature tem **sete** conflitos entre o que a
> `spec.md` pede e o que a analise diz que o legado faz. **Dois** estao
> registrados na propria spec e em `index.md`; **cinco NAO estao em artefato
> nenhum** — quatro encontrados por T001 e um por T002. Nenhum dos sete e
> decidivel por um agente, e nenhum deles bloqueou T001 nem T002. Estao na secao
> *[O que T001 e T002 encontraram aberto](#-o-que-t001-e-t002-encontraram-aberto-e-nao-resolveram)* —
> leia antes da primeira linha de codigo se a sua tarefa for T005, T007, T009,
> T013, T017, T021, T023 ou T029.

---

## O que T001 entrega, e so isso

A linha da tarefa: *"o modulo carrega com as portas de sistema de arquivos, de
cliente externo, de dados e de envio de e-mail declaradas, e nenhuma delas
implementada alem da variante local"*. `satisfaz: — (infraestrutura)`: T001 nao
fecha nenhum criterio de aceite de nenhuma historia, e **nao implementa regra de
negocio nenhuma**.

| arquivo | o que e |
|---|---|
| `portas/porta-de-sistema-de-arquivos.ts` | a borda do disco e da escrita remota, terceira das cinco de AD-08 — e a borda que **define** esta feature (D7) |
| `portas/porta-de-cliente-externo.ts` | a borda da rede, primeira das cinco. Tem **duas** operacoes, e a razao esta abaixo |
| `portas/porta-de-dados.ts` | a borda do banco, unica porta deste modulo para dados (REQ-164) |
| `portas/porta-de-email.ts` | a borda da caixa postal, quinta das cinco — e nesta feature o **numero de e-mails e o criterio de aceite** |
| `index.ts` | a composicao: `criarModuloDeOperacaoDoSoftware(portas)` |
| `modulo.test.ts` | os 14 testes da entrega, e nada de historia |

**O que a composicao NAO faz, e os testes afirmam:** nao guarda estado de modulo
(`EXT-CONTEXTO`, BR-MIGRAR-105) e nao resolve nada no carregamento (`EXT-ORDEM`,
BR-MIGRAR-106, que a tabela *Nao negociavel* da constituicao tambem cobra).
`criarModuloDeOperacaoDoSoftware` nao emite consulta, nao abre transporte de
arquivos, nao chama a rede e nao manda e-mail — o teste afirma que a lista de
toques e **vazia**.

**O que T001 deliberadamente NAO entrega:** nenhum valor de fabrica, nenhum ponto
de configuracao nomeado, nenhum numero. Isso e **T002** (*"os pontos de
configuracao que guardam falha de atualizacao automatica, politica de atualizacao
e sessao de recuperacao existem com os valores de fabrica do legado e sao lidos e
gravados pela porta de dados"*). Numero semeado antes da tarefa que o pede e
numero inventado, e o P6 o recusa.

---

## O que T002 entrega, e so isso

A linha da tarefa: *"os pontos de configuracao que guardam falha de atualizacao
automatica, politica de atualizacao e sessao de recuperacao existem com os
valores de fabrica do legado e sao lidos e gravados pela porta de dados"*.
`satisfaz: — (infraestrutura)`: T002 **nao fecha criterio de aceite de nenhuma
historia e nao implementa regra de negocio nenhuma**.

| arquivo | o que e |
|---|---|
| `armazenamento/chaves-e-tabelas.ts` | as 2 tabelas e os 9 nomes de opcao. Nenhum nome se monta a mao fora dali |
| `armazenamento/opcao.ts` | a primitiva: `get_option`/`add_option`/`update_option`/`delete_option` e os quatro equivalentes de rede, com os casos em que **nenhum comando sai** |
| `armazenamento/verdade-de-php.ts` | `if ( $valor )` do PHP, que decide quatro coisas nesta feature |
| `armazenamento/leitura-de-linha.ts` | leitura de coluna, igual a de BC-01, BC-02, BC-05 e BC-06 (a regra de dependencia 3 obriga a repeticao) |
| `armazenamento/porta-falsa.ts` | o duplo que registra comando, que T003 em diante usa |
| `configuracao/prazos.ts` | as 4 unidades de tempo, de onde sai todo prazo |
| `configuracao/estado-de-atualizacao.ts` | `auto_core_update_failed` e `auto_core_update_notified`, com as **duas** formas do registro de falha |
| `configuracao/politica-de-atualizacao.ts` | as 3 opcoes, as 2 constantes, os 4 pontos de extensao e a precedencia de `A3` |
| `configuracao/sessao-de-recuperacao.ts` | as 5 opcoes, os 2 prazos, os 4 comprimentos e os 3 pontos de extensao |
| `armazenamento/armazenamento.test.ts` | 19 testes: qual comando sai, com quais parametros |
| `configuracao/configuracao.test.ts` | 34 testes: valor de fabrica e borda, como o P6 cobra |

A superficie do modulo passou a ter `armazenamento` e `configuracao`, e
`modulo.test.ts` afirma que sao essas quatro chaves e nenhuma a mais. **As duas
nao sao operacao**, e por isso nenhuma declara permissao: a tabela de permissoes
do `index.ts` continua sendo pauta das tarefas das historias.

### As tres coisas que esta tarefa reproduz e que um porte perde

1. **Gravar valor igual nao emite comando** (`wp-includes/option.php:923`), e
   isso tem efeito proprio duas vezes aqui: a limpeza diaria de chaves de
   recuperacao grava sempre e, quando nada venceu, **nao escreve nada**
   (`class-wp-recovery-mode-key-service.php:125`); e o marcador de aviso de `A10`
   grava `time()` sobre o texto da coluna, o que **sempre** difere por tipo e
   sempre emite comando. Metade dos testes de `armazenamento.test.ts` afirma
   ausencia de comando.
2. **Gravar opcao ausente custa DUAS leituras e vira `INSERT`.**
   `update_option()` delega para `add_option()` (`:929`), que le de novo
   (`:1123`). Com o cache de objeto ligado a segunda e gratuita; o `Contexto:` de
   PT-013 exige o cache **desligado nas duas metades**, e ai sao dois `SELECT`.
3. **A opcao de rede troca de tabela com a instalacao.** Em site unico vive em
   `{site}options`, com `autoload = 'off'`; em rede vive em `{base}sitemeta`, que
   nao tem coluna de autocarregamento. E por isso que os dois prefixos nasceram
   juntos na porta, em T001.

### O que T002 deliberadamente NAO entrega

- **A versao do esquema** (`db_version`) — e **T013**, porque e o numero que
  dispara a migracao por comparacao de estrutura.
- **O marcador de manutencao** — e **T009**. O plano o poe no sistema de
  arquivos *"porque precisa valer mesmo com o banco em migracao"*, logo ele **nao
  e lido nem gravado pela porta de dados**, que e a condicao da entrega desta
  tarefa. As ancoras para quem o portar: o conteudo gravado e
  `'<?php $upgrading = ' . time() . '; ?>'` (`class-wp-upgrader.php:1033`), a
  leitura e `require ABSPATH . '.maintenance'` (`wp-includes/load.php:444`) e a
  manutencao presa **vence em 10 minutos** (`:447`).
- **Classificar a falha** (T019), **congelar** (T019), **destravar** (T023),
  **decidir se atualiza** (T015, T017), **avisar** (T021), **emitir e consumir a
  chave** (T025, T027) e **diagnosticar** (T029).
- **Aplicar os pontos de extensao da politica.** Os tres sao aplicados pelo
  legado **tarde e um por vez**, no ramo de versao de cada um
  (`class-core-upgrader.php:357`, `:373`, `:386`): numa chamada **um** deles
  dispara. Aplicar os tres de uma vez faria disparar ponto de extensao que o
  legado nao dispara, e P2 poe *"a ordem de disparo"* no contrato publico. Os
  nomes estao declarados; aplicar e de T015 e T017.
- **O registro de opcoes do alvo** (`REG-Opcao`, em `plataforma/opcoes/`). Ele
  nao existe nesta arvore, e `opcao.ts` e o subconjunto que **esta** feature
  consome. Os oito pontos de extensao por opcao, `sanitize_option()` e
  `wp_protect_special_option()` sao dele, nao daqui: declara-los aqui criaria
  ponto de extensao com dois donos.

---

## O que T003 entrega, e so isso

A linha da tarefa: *"o comportamento de US-1 existe e os criterios CA-1.1,
CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6, CA-1.7 passam contra o sistema novo"*.
E a **primeira operacao exposta** do modulo, e nasce com a declaracao de
permissao que o P4 cobra: `PERMISSOES_DA_INSTALACAO`, uma capacidade por acao,
cada uma com o seu token.

| arquivo | o que e | criterio |
|---|---|---|
| `instalacao/permissao-da-instalacao.ts` | os dois `case` de `map_meta_cap()` (`capabilities.php:619`-`:642` e `:654`-`:666`), a permissao e o token de cada acao | CA-1.1, CA-1.3, CA-1.4, CA-1.6, CA-1.7, a regra |
| `instalacao/contexto-da-instalacao.ts` | o que as operacoes recebem por chamada, inclusive o `run()` do legado como ligacao tardia | — |
| `instalacao/texto-como-no-php.ts` | `trim()`, `urldecode()`, conversao para texto, verdade do PHP, `add_query_arg()` | — |
| `instalacao/consulta-ao-catalogo.ts` | `plugins_api()` e `themes_api()` de informacao, com a repeticao em claro da resposta 12 | CA-1.2 |
| `instalacao/instalador-de-extensao.ts` | `install()`, `upgrade()` e `bulk_upgrade()` de `Plugin_Upgrader` e `Theme_Upgrader` | CA-1.5 |
| `instalacao/acoes-depois-de-instalar.ts` | `Plugin_Installer_Skin::after()`: se a tela oferece ativar | CA-1.4 |
| `instalacao/tela-de-atualizacao.ts` | `wp-admin/update.php`, as oito acoes de US-1 | todos |
| `instalacao/us-1-instalar-e-atualizar-extensao.test.ts` | 27 testes, um ou mais por criterio | — |

A superficie do modulo passou a ter `instalacao`, e `modulo.test.ts` afirma
que sao essas cinco chaves.

### O que esta tarefa porta e o que ela deixa atras de uma interface

O que US-1 decide e a **camada de cima** do caminho: a tela, a pergunta de
capacidade, o token, a consulta ao catalogo, qual pacote vai para qual destino
com qual `hook_extra`, e o que fazer com o resultado de cada item do lote.
Aplicar o pacote — o `WP_Upgrader::run()` do legado — e criterio de **outras
tres historias** desta feature, e chega por `ExecucaoDoPacote`:

| passo de `run()` | historia | tarefa |
|---|---|---|
| `download_package()` e a verificacao de assinatura | US-2 | **T005** (🔴 conflito #1) |
| `maintenance_mode()` | US-4 | **T009** (🔴 conflito #4) |
| `fs_connect()`, `install_package()`, `clear_destination()`, a copia de seguranca e a limpeza | US-5 | **T011** |

Quem pegar uma dessas constroi o `run()` atras de `ExecucaoDoPacote` e **nao
muda a tela**. O que a tela ja manda para la: `package`, `destination`,
`clear_destination` (que na instalacao e o texto de sobrescrita, nao booleano),
`clear_working`, `is_multi`, o `hook_extra` com o `temp_backup` que CA-5.3
restaura, e os nomes dos metodos que o legado pendura em filtro em volta de
cada chamada (`check_package`, `deactivate_plugin_before_upgrade`,
`current_before`, ...). O que vem **depois** de `run()` — limpeza de cache,
`upgrader_overwrote_package`, `upgrader_process_complete` e a retirada do item
de `auto_plugin_theme_update_emails` (estado de US-10) — chega em
`ExecucaoDoPacote.concluir`, e so quando o legado chega la.

O mesmo vale para `File_Upload_Upgrader` (anexo e de BC-03, a limpeza agendada
e da feature `011`): chega por `RecepcaoDoPacoteEnviado`. E as duas comparacoes
de versao do lote (`is_wp_version_compatible()`, `is_php_version_compatible()`)
chegam prontas do ambiente: comparar versao e US-3, **T007**.

### Tres coisas que um porte perde, e que estao reproduzidas

1. **No lote, so `false` interrompe.** CA-1.5 diz *"um que falha nao
   interrompe os demais"*, e e verdade para `WP_Error`. O legado tem um caso que
   interrompe: `false`, que e o `run()` que nao abriu o sistema de arquivos e
   desenhou a tela de credencial (`class-plugin-upgrader.php:400`, *"Prevent
   credentials auth screen from displaying multiple times"*). Isso nao e falha
   do item, e da conexao, e os itens seguintes nao aparecem no resultado. Nao
   foi tratado como conflito com o criterio porque o criterio fala de item, e o
   legado so interrompe por conexao.
2. **Atualizar um so sem oferta devolve `false`; no lote, o mesmo caso devolve
   `true`** (`class-plugin-upgrader.php:200`-`:206` contra `:334`-`:340`). E so
   o lote confere `requires`/`requires_php`.
3. **Ativar nao passa por `is_super_admin()`.** O comentario do proprio legado
   (`capabilities.php:660`): em rede, o administrador de site **ativa** plugin
   se a rede liberou o menu (`menu_items`), e **nunca instala**. E
   `network_activate` so some quando a instalacao falhou: quem administra os
   plugins da rede ve *"Network Activate"* mesmo com o plugin ja ativo.

### 🔴 Uma divergencia encontrada na plataforma, NAO corrigida aqui

**`file_mod_allowed` nao consegue reabrir o que `DISALLOW_FILE_MODS` fechou.**
No legado a constante e so o **valor padrao** do filtro
(`wp_is_file_mod_allowed()`, `wp-includes/load.php:1838`): um interceptador que
devolva `true` com a constante ligada reabre as nove capacidades de modificar
arquivo. Neste porte, `plataforma/autorizacao/revogacao-por-constante.ts`
(T015 da feature 001) trata a constante como revogacao incondicional e roda
**antes** de qualquer caso de traducao, logo o filtro de
`casoDaInstalacao()` so e consultado quando a constante esta desligada. O
caminho inverso — sem a constante, um filtro que devolve `false` fecha as
nove — funciona e esta testado.

Por que nao foi corrigido aqui: a correcao muda a ordem declarada da decisao,
que alcanca tambem `edit_files`/`edit_plugins`/`edit_themes` (com outro
contexto de `wp_is_file_mod_allowed()`, `capability_edit_themes`) e as de idioma
(`can_install_language_pack`), nenhuma de US-1. E de quem for mexer em
`plataforma/autorizacao/`, e CA-1.6 continua satisfeito: com a proibicao
declarada e **sem** interceptador, as nove sao negadas a toda conta.

### O que T003 deliberadamente NAO entrega

- **As tres acoes de `update.php` que nao sao criterio de US-1**:
  `activate-plugin` (a reativacao depois de atualizar),
  `upload-plugin-cancel-overwrite` e `upload-theme-cancel-overwrite`. A tela as
  devolve como `nao-portada`, e **nao** dispara `update-custom_{acao}` para
  elas, porque o legado nao dispara.
- **As acoes depois de instalar tema** (`Theme_Installer_Skin::after()`):
  ativar tema e `switch_themes`, que nao e criterio de US-1.
- **A comparacao de sobrescrita do envio** (`do_overwrite()`): ela le
  `get_plugins()` e compara com `version_compare()`, que sao da tela de
  plugins; chega como `sobrescritaOferecida`.
- **O texto da tela.** Titulo, cabecalho e *skin* sao da borda; a tela entra
  como dado.

---

## O que T025 entrega, e so isso

A linha da tarefa: *"o comportamento de US-12 existe e os criterios CA-12.1,
CA-12.2, CA-12.3, CA-12.4, CA-12.5, CA-12.6, CA-12.7 passam contra o sistema
novo"*. O legado e `class-wp-recovery-mode*.php`,
`class-wp-paused-extensions-storage.php`, `class-wp-fatal-error-handler.php` e
`error-protection.php`, com UC-36 e `A10`-`A12` (BR-MIGRAR-054 a 056).

| arquivo | o que e | criterio |
|---|---|---|
| `recuperacao/contexto-da-recuperacao.ts` | o que as operacoes recebem por chamada, com a tabela das ligacoes tardias e de quem e cada uma | — |
| `recuperacao/endpoint-protegido.ts` | `is_protected_endpoint()` e as nove acoes de Ajax (`load.php:1180`, `:1218`) | CA-12.4 |
| `recuperacao/extensao-do-erro.ts` | `should_handle_error()`, `get_extension_for_error()`, `is_network_plugin()`, a descricao e o registro do erro | CA-12.1 |
| `recuperacao/cookie-de-recuperacao.ts` | o cookie assinado: montar, validar, ler a sessao, apagar (`class-wp-recovery-mode-cookie-service.php`) | CA-12.2, `A10` |
| `recuperacao/extensoes-pausadas.ts` | `set()`, `get_all()`, `delete_all()` e o trecho de recuperacao de `wp_get_active_and_valid_plugins()`/`_themes()` | CA-12.3, CA-12.5 |
| `recuperacao/aviso-de-recuperacao.ts` | emitir a chave, montar o endereco, escrever e enviar o e-mail com o marcador gravado antes | CA-12.1, CA-12.6 |
| `recuperacao/modo-de-recuperacao.ts` | `initialize()` (com o portao de `wp-settings.php:573`), `handle_error()`, `exit_recovery_mode()`, `handle_exit_recovery_mode()` | CA-12.1 a CA-12.5 |
| `recuperacao/tratador-de-erro-fatal.ts` | `WP_Fatal_Error_Handler::handle()` e a tela de erro como dado | CA-12.1, CA-12.4 |
| `recuperacao/permissao-da-recuperacao.ts` | `PERMISSOES_DA_RECUPERACAO` (P4) e os `case` `resume_plugin`/`resume_theme` (`capabilities.php:667`-`:672`) | CA-12.7 |
| `recuperacao/area-de-recuperacao.ts` | a composicao sobre a sessao de T002 e a porta de e-mail | — |
| `recuperacao/us-12-modo-de-recuperacao.test.ts` | 24 testes, um ou mais por criterio, e a semana de `A10` | — |

A superficie do modulo passou a ter `recuperacao`, e `modulo.test.ts` afirma
que sao essas seis chaves. `configuracao/sessao-de-recuperacao.ts` (T002)
ganhou duas leituras **brutas** — `lerRegistroDeChaves()` e
`lerRegistroDeExtensoesPausadas()`, com o `(array)` do PHP em `arranjoDoPhp()`
—, porque emitir chave e pausar extensao **regravam o arranjo inteiro**, e
regravar a partir da visao tipada apagaria entrada que o legado preserva.

### Nenhuma operacao de US-12 pergunta capacidade, e isso esta declarado

Tratar o erro roda no desligamento; abrir o caminho e provado pela chave do
aviso; sair e provado pelo token `exit_recovery_mode`, **sem** capacidade
(`class-wp-recovery-mode.php:242`). `PERMISSOES_DA_RECUPERACAO` diz isso por
operacao, que e a declaracao explicita do P4. CA-12.7 e a capacidade de
**retomar uma** extensao pela tela de plugins ou de temas: `resume_plugins` e
`resume_themes` nao estao em papel nenhum, a concessao de prioridade `1` ja
esta em `plataforma/autorizacao/concessao-por-extensao.ts` (feature `001`,
T019), e esta tarefa poe os dois `case` de meta-capacidade que levam a ela. O
teste afirma os dois lados: o administrador de fabrica retoma; tirada a
concessao, ninguem retoma.

### Tres coisas que um porte perde, e que estao reproduzidas

1. **O marcador e gravado antes de tudo, inclusive da chave**
   (`class-wp-recovery-mode-email-service.php:58`, antes de `generate_url()`
   em `:116`). Falhar em grava-lo nao emite chave nem e-mail; o envio que
   falha deixa o marcador gravado e o aviso do dia perdido. O teste afirma a
   ordem na linha do tempo do duplo: marcador, chave, envio.
2. **A sessao e o `sha1()` do aleatorio do cookie** (`cookie-service:142`), e
   a pausa vive na opcao `{sessao}_paused_extensions`. Fora da sessao o nome da
   opcao e vazio e **nenhuma leitura** sai: o teste afirma que a requisicao do
   visitante nao toca o armazenamento e carrega o plugin quebrado.
3. **Os dois pontos do prazo do link disparam em toda requisicao sem cookie**,
   mesmo fora de `wp-login.php`, porque `get_link_ttl()` e o argumento de
   `handle_begin_link()` e e avaliado antes da chamada
   (`class-wp-recovery-mode.php:116`).

### 🔴 O que T025 encontrou, e NAO resolveu (nenhum bloqueia US-12)

- **A chave e emitida aqui e verificada em T027.** CA-12.2 (*"abrir o caminho
  cria uma sessao"*) passa por `validate_recovery_mode_key()`, que e o que
  US-13 disputa: CA-13.1 pede *"verificada antes de ser removida"*, e o ADR
  0007 com o cenario `@divida-herdada` de PT-013 mandam **consumir antes**.
  Esse conflito **nao esta** na secao *Perguntas em aberto* da spec nem em
  `index.md`. Esta tarefa nao escolhe: abrir o caminho chama
  `ContextoDaRecuperacao.validarChave` no ponto do legado
  (`class-wp-recovery-mode-link-service.php:86`) e so grava o cookie com
  `true`. **De quem e: T027**, que comeca por esse conflito.
- **A metade de `A11` sobre extensao de rede nao e feita por
  `is_network_plugin()`.** Ele compara `slug/` com os caminhos **absolutos**
  de `wp_get_active_network_plugins()` (`ms-load.php:52`) e nunca casa; o que
  deixa a rede fora e o portao de `wp-settings.php:573` e o de
  `class-wp-fatal-error-handler.php:54` (em rede o modo nunca inicializa).
  Reproduzido como e, com teste. Os *Achados do QA* de REQ-117 em
  `backlog/tests.md` ja registram essa metade como sem prova.
- **"Um por dia por sessao" e, no legado, um por limite por site.** O
  marcador e uma opcao sem sessao no nome, e o aviso so sai quando **nao** ha
  sessao (`class-wp-recovery-mode.php:176`). Esta reproduzido o codigo; a
  frase de CA-12.6 e de `A10` foi lida como *"por ciclo de recuperacao"*,
  zerado so na saida (`clear_rate_limit()`).
- **Vencer a semana nao apaga a pausa.** O cookie vencido e recusado com
  `expired`, apagado, e a requisicao morre com `403`; a opcao
  `{sessao}_paused_extensions` fica **orfa** para sempre, porque so a saida
  daquela sessao a apagaria. O P5 manda reproduzir o que fica orfao; o teste o
  afirma.

### O que T025 deliberadamente NAO entrega

- **Verificar, consumir e limpar a chave** (`validate_recovery_mode_key()`,
  `clean_expired_keys()`, o evento diario) — **T027**. O agendamento do evento
  e daqui (`initialize()`, `:99`-`:100`), a rotina que ele roda nao.
- **Registrar os tres ganchos de `initialize()`** (`wp_logout`,
  `login_form_exit_recovery_mode`, `recovery_mode_clean_expired_keys`): o
  barramento nao existe (`REQ-162` esta em `do-not-rewrite.md`). A area expoe
  `sair()` e `atenderSaida()` para quem compuser o barramento ligar.
- **`delete()` da pausa** (retomar **uma** extensao): o chamador e
  `resume_plugin()`/`resume_theme()` (`wp-admin/includes/plugin.php:2567`,
  `theme.php:1230`), superficie de BC-10.
- **A formatacao** (`is_email()`, `wp_specialchars_decode()`,
  `wp_strip_all_tags()`, `human_time_diff()`, `add_query_arg()`), a API de
  extensoes (`get_plugins()`, `wp_get_theme()`, `plugin_basename()`), o hash
  (`wp_fast_hash()`), o sorteio (`wp_generate_password()`) e a troca de idioma:
  chegam por ligacao tardia, como em `privacidade/abertura/`. O texto do
  e-mail e as mensagens sao os `msgid` do legado.
- **Capturar o erro.** O runtime do alvo nao tem `error_get_last()`; a borda
  entrega `ErroFatal` com os quatro campos na ordem do legado. ⚠️ O tratador
  engole qualquer excecao, e o legado so engole `Exception` — o alvo nao tem a
  distincao.

---

## Como T001 leu "nenhuma delas implementada alem da variante local"

A frase e **teto de escopo, nao entrega adicional**, e T001 a cumpre com zero
implementacao. A razao e a regra de dependencia de `target_architecture.md`:

4. `contextos/` ou `plataforma/` para adaptador concreto: **proibido**. So pela
   porta.

Um adaptador concreto de sistema de arquivos vive em `adaptadores/` — pasta que
**nao existe nesta arvore** — e AD-04 poe a fronteira de `await` ali, logo ele
tambem seria assincrono, o que nenhum destes arquivos pode ser. Alem disso
nenhuma tarefa desta feature o usaria: CLAUDE.md proibe banco, rede, relogio real
ou navegador em teste, e as suites de T004 em diante afirmam efeito por duplo.

O que T001 fez com a frase, em lugar de ignora-la: **nomeou a variante local na
porta**. `TransporteDeArquivo` e a lista fechada dos quatro transportes do legado
— `direct`, `ssh2`, `ftpext`, `ftpsockets`, pela linha
`wp-admin/includes/file.php:2272` (*"Please ensure that this is either 'direct',
'ssh2', 'ftpext', or 'ftpsockets'"*) — e `TRANSPORTE_LOCAL` e `direct`. Os nomes
ficam **em ingles** porque sao valores gravados e publicados: `FS_METHOD` os
aceita como texto e o filtro `filesystem_method` os devolve; traduzi-los seria
renomear contrato publico, que esta na tabela *Nao negociavel*.

O transporte e **campo da porta**, e nao detalhe do adaptador, por uma linha so:

```
wp-admin/includes/update-core.php:1598
if ( $check_is_writable && 'direct' === $wp_filesystem->method ) {
```

A conferencia previa de gravabilidade **so acontece no transporte local**. Nos
tres remotos o legado parte para a copia sem conferir. O transporte tambem viaja
no relatorio de atualizacao automatica (`class-core-upgrader.php:237`,
`'fs_method'`). Esconder isso atras da porta apagaria uma ramificacao observavel —
e `plan.md` registra que reduzir para um transporte *"e mudanca observavel que
nenhuma das 23 respostas autoriza"*, com `tech-stack.json` recusando a proposta de
`technologies.json` de ficar so no `direct`.

---

## As quatro portas, e por que sao quatro

AD-08 declara **cinco** bordas: dados, HTTP, sistema de arquivos, cache de objeto
e e-mail. Esta feature usa quatro. A que falta e o **cache de objeto**, e a
ausencia e deliberada: nenhuma historia daqui cacheia, e o `Contexto:` de
`parity_tests/13-atualizacao-automatica-do-nucleo.feature` roda com *"o cache de
objeto desligado nas duas metades"*. `modulo.test.ts` afirma que sao exatamente
estas quatro chaves.

As portas sao **redeclaradas** aqui em vez de importadas de BC-03 ou BC-05: AD-08
poe a porta no contexto que a CONSOME, e a regra de dependencia 3 (AD-10) proibe
`contextos/<a>/` importar `contextos/<b>/` no topo do modulo, **sempre, sem
excecao**.

### Sistema de arquivos — a borda que define a feature

A decisao fundadora **D7**: este produto se instala, se atualiza e sobrescreve os
proprios arquivos em execucao, logo *"o alvo de implantacao e o sistema de
arquivos e o pipeline de implantacao e o painel administrativo"*.

A porta tem **18 membros**: os 17 que o legado chama neste caminho, mais um
(`ler`) cuja ausencia de chamada e ela mesma o motivo — ver a consequencia 4. Nas
seis fontes do caminho de atualizacao — `class-wp-upgrader.php`,
`class-core-upgrader.php`, `class-plugin-upgrader.php`,
`class-theme-upgrader.php`, `update-core.php`, `class-wp-automatic-updater.php` —
as chamadas `$wp_filesystem->` sao:

| operacao | chamadas | o que decide |
|---|---|---|
| `delete` | **27** | CA-5.2 (limpar area temporaria em todo caminho de saida) e CA-5.4 (a falha que e critica) |
| `wp_content_dir` | 13 | o erro `fs_no_content_dir` de `fs_connect()` |
| `exists` | 12 | se ha manutencao presa (CA-4.4) e se ha destino anterior |
| `is_dir` | 9 | de qual pasta do pacote vem o conteudo |
| `find_folder` | 6 | a traducao de caminho local para caminho do transporte remoto |
| `dirlist` | 6 | US-1 e US-5 — e os **tres** resultados possiveis dela (abaixo) |
| `mkdir` | 5 | criar o destino que nao existe |
| `errors` | 5 | a lista que a tela de credencial redesenha |
| `chmod` | 5 | corrigir permissao antes de desistir |
| `wp_themes_dir` | 4 | o erro `fs_no_themes_dir` |
| `put_contents` | 4 | o marcador `.maintenance` e o arquivo de versao |
| `copy` | 4 | a substituicao de arquivo |
| `wp_plugins_dir` | 3 | o erro `fs_no_plugins_dir` |
| `is_writable` | 3 | CA-5.5 |
| `abspath` | 3 | `fs_no_root_dir`, e onde o marcador de manutencao e gravado |
| `method` | 2 | a ramificacao de `update-core.php:1598` |
| `is_file` | 2 | se o apagamento que falhou importa (`update-core.php:1875`) |
| `move` | **0** | — |

Quatro consequencias que estao escritas no arquivo e que um porte perde:

1. **Nao ha `mover` na porta.** Zero chamadas de `move` em 27 de `delete` e 4 de
   `copy`: o legado substitui arquivo **copiando e apagando**, e e essa sequencia
   que CA-5.3 reverte. Declarar `mover` convidaria a uma operacao atomica que o
   legado nao faz, e a janela entre copiar e apagar e observavel.
2. **`listar` tem tres resultados, nao dois.** `clear_destination()` trata o
   `false` do `dirlist` como *"o destino nao existe"* e devolve **sucesso sem
   apagar nada** (`class-wp-upgrader.php:447`); `install_package()` trata o mesmo
   `false` como `source_read_failed` e **aborta** (`:568`); e pasta vazia e um
   terceiro caso com terceiro efeito (`:579`). Por isso a falha volta como valor,
   e nao como lista vazia. Colapsar os tres muda o resultado de US-1 e de US-5.
3. **O modo de arquivo nao tem valor de fabrica nesta porta.** `FS_CHMOD_DIR` e
   `FS_CHMOD_FILE` **nao sao numeros fixos**: sao
   `fileperms( ABSPATH ) & 0777 | 0755` e
   `fileperms( ABSPATH . 'index.php' ) & 0777 | 0644`, lidos do disco
   (`wp-admin/includes/file.php:2236` e `:2239`). O modo chega por argumento, e
   `null` e o caso em que o legado nao passa modo nenhum
   (`class-wp-upgrader.php:1151`).
4. **`ler` tem zero chamada, e e por isso que existe.** O unico arquivo que este
   caminho le e o marcador de manutencao, e o legado o le **executando**:
   `require ABSPATH . '.maintenance'` e depois colhe a global que o arquivo
   define (`wp-includes/load.php:444`), sendo o conteudo gravado
   `'<?php $upgrading = ' . time() . '; ?>'` (`class-wp-upgrader.php:1033`).
   Executar um arquivo para ler um numero **nao tem equivalente no alvo** — e o
   mecanismo que `BR-DESCARTAR-009` descarta porque *"a linguagem do alvo torna o
   mecanismo inexprimivel, nao indesejavel"* —, logo no alvo o marcador tem de ser
   lido **como dado**. Sem esta operacao, CA-4.4 nao e portavel: a deteccao de
   manutencao presa depende do instante gravado dentro do arquivo, que **vence em
   10 minutos** (`wp-includes/load.php:447`). O formato do marcador e esse numero
   sao de T002 e T009, nao desta porta.

As **outras 10** operacoes de `WP_Filesystem_Direct` (`touch`, `size`, `mtime`,
`atime`, `owner`, `group`, `chown`, `chgrp`, `cwd`, `chdir`) e os **nove** campos
extra de cada entrada de `dirlist` (permissao em duas formas, dono, grupo,
tamanho, tres formas de data, `number`) ficam fora: ninguem neste caminho os
chama, e os campos de `dirlist` alimentam o navegador de arquivos das **telas**,
que e BC-10. O P8 nao e violado — nada sai da superficie publica: o adaptador
implementa a classe inteira, e o que se escolhe aqui e o que **este** contexto
consome.

### Cliente externo — duas operacoes, e a razao e do legado

A porta tem `chamar` e `baixar`, e a separacao nao e estilistica.
`download_url()` chama `wp_safe_remote_get` com `'stream' => true` e
`'filename' => $tmpfname` (`wp-admin/includes/file.php:1177` a `:1184`): e o
**transporte HTTP** que grava o arquivo, **sem passar pelo `WP_Filesystem`** — e
depois o legado o apaga com `unlink()` direto (`:1187`, `:1353`), nao com
`$wp_filesystem->delete()`.

Isso e observavel: o arquivo temporario nasce com a identidade do **processo**, e
nao com a da credencial de FTP ou de SSH que o `WP_Filesystem` usaria. E por isso
que uma instalacao que precisa de credencial remota ainda consegue **baixar**, e
so falha ao **aplicar**. Unificar as duas atras da porta de arquivos apagaria a
diferenca.

Os quatro tempos limite desta borda sao lidos do legado e **nenhum e o default de
5 s** de `class-wp-http.php:181`: **3 s** na consulta de versao em requisicao
comum, **30 s** quando ela roda pela fila agendada
(`wp-includes/update.php:237`, `$doing_cron ? 30 : 3`), **10 s** nos dois testes
de loopback (`class-wp-site-health.php:3278` e `:2210`) e **300 s** no download
(`wp-admin/includes/file.php:1160`). Nomea-los e de T002 em diante; T001 nao faz
chamada nenhuma.

⚠️ **O disparo nao bloqueante nao esta nesta porta.** Tempo limite de 0,01 s e
`blocking` falso sao do disparo da **fila agendada**, que `plan.md` poe na feature
`011`, e AD-07 poe a **falha** desse disparo como criterio de aceite daquele
contexto. Nenhuma das tres chamadas desta feature e nao bloqueante, e `stream`
forca `blocking` a verdadeiro no proprio legado (`class-wp-http.php:318`).

### E-mail — onde o numero e o criterio

O cabecalho de `parity_tests/13-atualizacao-automatica-do-nucleo.feature` e
literal: *"O CRITERIO DE ACEITE DESTE ARQUIVO E O NUMERO DE E-MAILS AO
ADMINISTRADOR"*. Tres regras decidem esse numero:

- `A6` — falha transitoria nao notifica: `$send = false` quando o codigo esta na
  lista de transitorios e ainda nao ha registro de falha
  (`class-wp-automatic-updater.php:856`). **Zero** na primeira falha, **um** na
  segunda.
- `A7` — o mesmo aviso nao se repete: a dupla destinatario-e-versao e consultada
  antes do envio, em dois lugares (`:315` e `:864`).
- `A10` — no modo de recuperacao o marcador e gravado **antes** do envio, e
  falhar na gravacao **aborta o aviso**
  (`class-wp-recovery-mode-email-service.php:58` a `:62`). A ordem e a regra: ela
  escolhe perder o aviso em vez de arriscar repeti-lo.

E o slot e o unico em que *"'identico' e impossivel por AUSENCIA DE PRIMITIVA"*: o
transporte de fabrica e `$phpmailer->isMail()`
(`wp-includes/pluggable.php:505`), que usa a funcao `mail()` do PHP, e essa funcao
nao existe neste runtime.

### Dados — texto de SQL, e e por causa de US-6

A porta e `selecionar`/`escrever` sobre `Consulta` com texto e parametros
separados, como em BC-03 e BC-05. O que e **proprio desta feature** e por que o
texto importa: `DB-MIG` (BR-MIGRAR-085) diz que a evolucao de esquema do legado e
**comparacao de estrutura** — `dbDelta()` le `DESCRIBE` e `SHOW INDEX`, compara
com o DDL desejado e emite **so os `ALTER TABLE` necessarios`**
(`wp-admin/includes/schema.php:36`, `wp-admin/includes/upgrade.php:2936`). Leitura
de estrutura e emissao de DDL passam pelos mesmos dois metodos porque, no legado,
passam pelo mesmo `$wpdb`. Um construtor de consulta tipado esconderia a
comparacao — e a comparacao **e** o mecanismo.

**Os dois prefixos nascem juntos aqui**, diferente de BC-05, onde T001 declarou so
o do site. O motivo e o estado central desta feature:
`update_site_option( 'auto_core_update_failed', ... )`
(`class-wp-automatic-updater.php:838`, `:873`) e `auto_core_update_notified`
(`:861`) sao **opcao de rede**, que em rede vive em `sitemeta`, no prefixo
**base**. T002 le e grava isso na primeira linha que escrever. Derivar um prefixo
do outro por corte de texto nao funciona: um prefixo base pode terminar em digito
e sublinhado.

**Nao ha transacao**, e aqui isso tem efeito proprio: `DB-MIG` registra que a
migracao do legado **nao tem rollback, so avanca**, e CA-6.3 cobra que a migracao
que falha no meio deixe o banco *"em estado declarado"* — que no legado e o meio
da migracao, aplicado em parte. BR-MIGRAR-104 mediu zero `START TRANSACTION` e
zero `COMMIT` em 1.467 arquivos.

---

## 🔴 O que T001 e T002 encontraram aberto, e NAO resolveram

A `spec.md` desta feature tem um padrao: os **Criterios de aceite** vem do card do
backlog e descrevem o estado desejado; as **Regras de negocio que valem aqui**
vem da analise e descrevem o que o legado faz. Em **sete** historias os dois
blocos dizem coisas opostas, **no mesmo card**.

Dois estao registrados na secao *Perguntas em aberto* da spec e em `index.md`.
**Cinco nao estao em artefato nenhum** — nem na spec, nem em `index.md`, nem em
`ambiguity_log.md`, nem em `pending_decisions.md`. Quatro foram encontrados por
T001 ao ancorar as portas e um por T002 ao ancorar o valor de fabrica da
politica; estao escritos aqui porque *"conflito aberto nao se resolve escolhendo
um lado — para-se e escreve-se"*.

Nenhum dos sete bloqueou T001 nem T002: as portas servem as duas leituras de cada
um, a configuracao declara os dois valores do setimo, e nenhuma das duas tarefas
escolhe. Todos bloqueiam a tarefa da historia.

### Ja registrados (spec + `index.md`)

| # | historia | o conflito | de quem e |
|---|---|---|---|
| 1 | **US-2** | CA-2.1 a CA-2.4 exigem verificar a assinatura, recusar o pacote sem prova e nao permitir contorno. A **resposta 11** e o **ADR 0010** mandam manter a tolerancia: `wp_trusted_keys()` devolve lista vazia desde 2021-04-01 (`wp-admin/includes/file.php:1548`, com o `// TODO: Add key #2 with longer expiration.` em `:1553`), o filtro `wp_signature_softfail` nasce verdadeiro (`:1348`) e o caso *"sem assinatura"* e silenciado fora do modo de depuracao (`class-wp-upgrader.php:858`). A tabela *Nao negociavel* proibe exigir assinatura sem decisao humana | **T005**, **T006** |
| 2 | **US-14** | CA-14.4 exige guardar o resultado de cada diagnostico com instante. A regra do proprio card diz que a tela calcula na hora e **nao armazena**. Guardar e melhoria (P1) e cria dado com prazo de retencao que a resposta 20 proibe inventar (P6) | **T029**, **T030** |

E mais duas perguntas em aberto que nao sao contradicao, e sim ausencia: REQ-120
(formato de intercambio de conteudo) ficou `bloqueado`, e a invariante de
destravamento de **US-11** nao esta escrita em artefato nenhum — *"reproduzir a
invariante exige le-la no codigo do legado, caso a caso"*. T001 topou na segunda
ao ancorar o estado de falha: a linha que apaga o registro e
`delete_site_option( 'auto_core_update_failed' )` em
`wp-admin/includes/update-core.php:1922`, dentro de `update_core()`, logo depois
de `do_action( '_core_updated_successfully', ... )`. Quem pegar **T023** comeca
dali e **nao** decide se a invariante vale: ela e pergunta em aberto registrada.

### 🔴 NAO registrado em lugar nenhum — encontrado por T002

**#7 — `auto_update_core_major` tem DOIS valores de fabrica no legado, e a tarefa
de T017 depende de qual deles vale.**

| onde | valor | ancora |
|---|---|---|
| o que o instalador **semeia** numa instalacao nova | `'enabled'` | `wp-admin/includes/schema.php:556`, com o comentario *"Default to enabled for new installs"* e o bilhete do ticket 51742 |
| o que a leitura assume na **ausencia** da opcao | `'unset'` | `wp-admin/includes/class-core-upgrader.php:290` e `wp-admin/update-core.php:335` |

Os dois sao do legado e nao se contradizem **dentro** dele: em site unico
`populate_options()` grava `'enabled'` em `{site}options` e `get_site_option()` o
le de la, logo **versao maior atualiza sozinha**; em rede `populate_network()` nao
poe nada em `sitemeta`, a leitura cai no default `'unset'` e **nao** atualiza. A
assimetria tem ancora e esta reproduzida em `configuracao/politica-de-atualizacao.ts`,
em duas constantes separadas.

O que ninguem decidiu e a consequencia, porque **quatro fontes do pacote
descrevem a leitura de rede e o legado descreve a instalacao de site unico**, que
e o alvo fixado pela resposta 2:

- **CA-8.1**: *"mudanca de versao principal so com escolha explicita"*;
- **`A2`/BR-MIGRAR-046**: *"`auto_update_core_major` nasce `'unset'`"*, e o
  sentinela e chamado de regra;
- o cenario *"Versao menor atualiza por padrao, versao maior so com escolha
  explicita"* de `parity_tests/13-atualizacao-automatica-do-nucleo.feature` cobra
  *"Entao nenhuma das duas atualiza"* para versao maior — e numa instalacao nova
  de site unico **as duas metades atualizariam**, o que faz o cenario falhar
  contra o oraculo e nao contra o porte;
- `wp-admin/includes/upgrade.php:2279` grava `'unset'` so ao **atualizar** de uma
  versao anterior a 5.6, com o comentario *"This overrides the same option from
  populate_options() that is intended for new installs"* — e o alvo nao tem dado a
  migrar.

Por que nao e decidivel aqui: escolher entre os dois e **fixar o valor de fabrica
de uma regra de negocio documentada em `domain.md`**, que a primeira linha da
tabela *Nao negociavel* da constituicao proibe decidir sozinho. **De quem e:
T017** (e **T018**), que e onde o portao de `A2` nasce.

### 🔴 NAO registrados em lugar nenhum — encontrados por T001

| # | historia | criterio de aceite | regra do legado, no mesmo card | de quem e |
|---|---|---|---|---|
| 3 | **US-3** | **CA-3.4**: *"o descarte por incompatibilidade nunca e silencioso, nem no caminho automatico"* | *"No caminho automatico, o descarte por incompatibilidade acontece em silencio: um site parado numa versao antiga por ambiente velho nao avisa ninguem"*. UC-35 repete como achado: *"o site que mais precisa de atencao e justamente o que fica calado"* | **T007**, **T008** |
| 4 | **US-4** | **CA-4.1**: *"a atualizacao de extensao de um site coloca em manutencao apenas aquele site"* | o `@todo` do legado: *"For multisite, maintenance mode should only kick in for individual sites"* — ou seja, **nao** vale por site: *"atualizar um plugin coloca a rede inteira em manutencao"* | **T009**, **T010** |
| 5 | **US-6** | **CA-6.1** (*"cada migracao aplicada fica registrada"*) e **CA-6.5** (*"a migracao nao depende de comparar a estrutura corrente com a desejada"*) | *"A migracao de esquema do legado e por comparacao de estrutura, sem historico de migracoes aplicadas"*. `DB-MIG`/BR-MIGRAR-085 e explicito: *"adotar Flyway/Prisma Migrate no alvo introduz tabela de historico e rollback que o produto **nao tem**"* | **T013**, **T014** |
| 6 | **US-10** | **CA-10.1**: *"todo portao que cancela a atualizacao automatica produz aviso, inclusive o de incompatibilidade de ambiente"* | *"No legado, um e-mail e enviado ou nao, e a diferenca depende de qual portao barrou"*. E o **numero de e-mails e o criterio de aceite** de PT-013 | **T021**, **T022** |

Por que nenhum deles e decidivel aqui:

- **O P1** poe o comportamento observavel do legado como a especificacao e exige
  que toda divergencia tenha *"uma referencia a resposta de `questions.md` ou ao
  ADR que a autorizou"*. Nenhum dos quatro tem: as **tres** divergencias
  autorizadas do pacote sao o tempo limite do adaptador de IA, a minimizacao do
  servico de reputacao e o ambiente-oraculo.
- **O #4 e o #6 mudam o que o ator ve**, e o #6 muda **quantos e-mails chegam**,
  que e o criterio de aceite declarado do arquivo de paridade desta feature.
- **O #5 cria tabela nova**, e AD-11 proibe mudanca de esquema nesta fase; e um
  historico de migracoes e um dado novo com prazo de retencao, que a resposta 20
  proibe inventar (P6).
- **O #3 cria e-mail que o legado nao manda**, e `A6` e `A7` sao exatamente sobre
  quantos e-mails saem.

⚠️ Note que **UC-33** diz, no bloco *O que um porte precisa saber*: *"Num porte
multissite, isso e um requisito a corrigir, nao a replicar"*, sobre o #4. Isso e
**comentario da analise, nao decisao humana registrada**: nao esta em
`questions.md`, nao e ADR, e nao consta das tres divergencias autorizadas. Pelo P1
nao autoriza a correcao. E o tipo de frase que um porte confunde com permissao.

---

## O que este modulo nao vai ter, por decisao de outra pessoa

- **Os 38 portoes historicos de `db_version`** (2541 a 61644).
  `BR-DESCARTAR-006` os descartou pela resposta 2 (instalacao nova, sem dado a
  migrar). O que sai e o **historico**; o **mecanismo** migra inteiro (`DB-MIG`).
  Dois efeitos declarados no proprio descarte: `maybe_disable_link_manager()`
  roda em toda atualizacao e **migra**, porque e decisao de produto tomada a
  partir do estado do banco; e a faixa 61645–61833 **nao tem rotina de dados** e
  a hipotese de ser puramente estrutural **nao foi confirmada**
  (`ambiguity_log.md:155`).
- **`RESET_CAPS`.** `BR-DESCARTAR-005`, pela mesma resposta 2: `user_level` so
  existe em instalacao anterior a versao 2.0, e o caso de uso **nao pode ocorrer**
  no alvo.
- **O editor de arquivos de extensao no painel (REQ-121).** Esta na secao *Fora de
  escopo* da `spec.md` com o conflito **registrado e explicito**: o card manda
  descartar, e a resposta 14 nomeia REQ-121 e decide que nenhuma das tres
  superficies sai, porque *"o descarte vale como nao mudar, nunca como nao
  portar"*. As duas sao decisoes humanas; o pacote nao escolhe, e a tela e de
  BC-10, nao deste contexto.
- **Limite de taxa em qualquer superficie desta feature.**
  `ESC-LIMITE-TAXA`/BR-MIGRAR-112: *"nenhuma superficie de entrada tem limite de
  taxa, e os dois unicos freios sao travas de tempo"* — 60 s no `wp-cron.php` e
  5 min no `wp-mail.php`, as duas na feature `011`. Introduzir limite de taxa
  esta na tabela *Nao negociavel*.
- **Broker, DLQ e retry generico.** AD-06: *"nao ha broker, DLQ nem retry
  generico"*. `A5`, `A6` e `A7` sao escritas a mao, e quem as delegar a uma fila
  muda quantos e-mails chegam — o que quebra ADR-0008 e `A7` de uma vez.

---

## Como se confere que este modulo tem paridade

A spec de paridade desta feature e **`PT-013`**, em
`.specify/migration/parity_tests/13-atualizacao-automatica-do-nucleo.feature`, nas
areas *efeito no banco* e *comportamento de caso de uso* da Decisao 2, com UC-33,
UC-34, UC-35 e UC-36 como casos de uso, sobre `A1`–`A8` e `A10`–`A12` (`A9` e de
PT-005). ⚠️ **A contagem de cenarios divergiu e T001 nao a corrigiu:** a tabela de
`parity_specs.md:454` diz **9**, e o arquivo `.feature` tem **14**. Nenhuma das
duas e deste repositorio para reescrever (`.specify/` e pacote gerado); quem
fechar uma tarefa contra PT-013 conta no arquivo, nao na tabela. O `Contexto:`
exige *"um oraculo com o legado na mesma versao, com relogio controlavel"*, *"a
porta de e-mail substituida por duplo que CONTA mensagens enviadas nas duas
metades"* e *"o cache de objeto desligado nas duas metades"*. O teste de loopback
de US-14 e coberto por **`PT-005`**
(`parity_tests/05-agendador-e-loopback.feature`), na area *falha de disparo*.

O que T001 ja torna conferivel por ali:

- O `Contexto:` pede a **porta de e-mail substituida por duplo que conta**.
  `modulo.test.ts` monta exatamente esse duplo — registra comando em vez de
  simular caixa postal — e afirma que a porta e substituivel **sem tocar nenhum
  arquivo deste modulo**, que e o criterio de "substituivel" de BR-MIGRAR-103
  (`EXT-SUBST`). A **contagem** so existe quando houver fluxo: e de T017 em
  diante.
- O cenario **@divida-herdada** da assinatura exige que a instalacao **continue**
  e que *"nenhuma das duas emita aviso visivel"*. A porta de cliente externo nao
  tem campo de assinatura nem de veredito, e nenhuma operacao escreve registro:
  as duas leituras do conflito #1 continuam possiveis, e nenhuma esta
  pre-escolhida.
- O cenario **@critico @invariante** da falha critica exige que as duas metades
  *"gravem o congelamento na mesma opcao, com o mesmo valor"*. Os **dois
  prefixos** de tabela estao na porta de dados por isso: a opcao e de rede.
- O cenario da **falha transitoria** exige **zero** e-mail na primeira falha e
  **um** na segunda, pela classificacao do **codigo de erro**. `ResultadoExterno`
  carrega `codigoDeErro` por isso, e o teste afirma que ele atravessa a borda
  intacto.
- O cenario **@composicao** do padrao desta arvore pede a porta de sistema de
  arquivos *"substituida por duplo que registra cada operacao"*. O duplo esta
  montado e o teste de `EXT-ORDEM` afirma a lista **vazia** de toques na
  composicao.

O que **T002** acrescenta a essa lista:

- O cenario **@critico @invariante** da falha critica exige que as duas metades
  *"gravem o congelamento na mesma opcao, com o mesmo valor"*. *Mesmo valor*
  passou a ser afirmavel byte a byte: `configuracao.test.ts` fixa a cadeia
  serializada dos dois registros de falha e a dos quatro campos do aviso, com a
  **ordem de chaves** do legado, e `armazenamento.test.ts` fixa em qual tabela e
  com qual prefixo ela e gravada em cada tipo de instalacao.
- O cenario **@idempotencia** de `A7` compara *"o numero de e-mails por
  periodo"*. A chave de negocio da deduplicacao — destinatario e versao, mais o
  tipo no segundo ponto de leitura — esta declarada e lida; **quantos e-mails
  saem** continua sendo T021.
- O cenario do **modo de recuperacao** exige *"o numero de avisos enviados por
  dia e um nas duas"* e *"o estado final gravado e o mesmo nas duas"*. O prazo, o
  marcador e o retorno que **aborta** o aviso estao afirmados; enviar e T025.
  **T025** fechou o envio: o duplo da porta de e-mail conta os avisos, e a
  suite afirma um no primeiro erro, zero no ultimo instante do limite e um no
  instante seguinte.
- 🔴 O cenario *"Versao menor atualiza por padrao, versao maior so com escolha
  explicita"* **nao e conferivel sem decisao humana**: ver o conflito #7 acima.
  Quem rodar PT-013 contra o oraculo numa instalacao nova de site unico vai ver
  as duas metades atualizarem a versao maior, e isso nao e divergencia do porte.

⚠️ `parity_specs.md` registra que a suite de *characterization tests* **nao
existe** nesta arvore e que `migration_strategy.md` § 6 esta **em branco** —
a estrategia de migracao nao foi escolhida (`LACUNA-IN-05`). E o oraculo
executavel da resposta 16 e **T001 da feature 015**, que nao existe: enquanto ele
nao existir, as ancoras deste modulo sao conferidas **lendo** o legado, com
`arquivo:linha`, nunca executando-o.
