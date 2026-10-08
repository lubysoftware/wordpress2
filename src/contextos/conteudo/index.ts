/**
 * Modulo de conteudo — BC-01 de `target_architecture.md`.
 *
 * Feature `002-autoria-e-publicacao`, tarefas T001, T002, T003, T005, T007,
 * T009, T011, T013, T015, T017, T021 e T023. O que existe aqui e o que as doze
 * entregam: o modulo carrega com as tres portas declaradas, com o vocabulario
 * de estado editorial do legado como enumeracao fechada, com a forma de
 * armazenamento de conteudo, metadado e versao anterior e com **dez** regras de
 * negocio — a publicacao por ato explicito de US-1, a gravacao com estado
 * resolvido de US-2, o identificador na URL unico so a partir da publicacao de
 * US-3, o conteudo privado de US-4, a republicacao nula de US-5, o agendamento
 * por comparacao de data, com verificacao dupla, de US-6, a submissao para
 * revisao de US-7, a revisao do conteudo alheio com a autoria preservada de
 * US-8, as versoes anteriores de US-10 e o rascunho automatico reservado ao
 * abrir o editor de US-11. A leitura obrigatoria de cada uma esta em
 * `./README.md`.
 *
 * Duas coisas que este arquivo faz de proposito:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO, e
 *   `target_architecture.md` repete que nenhum modulo pode guarda-los em estado
 *   de modulo. Nesta feature isso tem consequencia direta e testada:
 *   `02-publicacao-e-agendamento-de-conteudo.feature` tem cenario de
 *   concorrencia — *"duas gravacoes simultaneas de autores diferentes nao trocam
 *   de autoria"*, e *"a decisao sobre o slug de cada um usa a capacidade de quem
 *   o gravou"* (BR-MIGRAR-004). Por isso as portas chegam por argumento e nao
 *   existe instancia compartilhada neste arquivo: duas composicoes nao se
 *   enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados e nao envia e-mail ao ser criado. A ordem de arranque e contrato
 *   publico (BR-MIGRAR-106, `EXT-ORDEM`), e trabalho feito na importacao e
 *   trabalho fora da ordem. Para este contexto a ordem vale duas vezes: o
 *   vocabulario de estado existe, no legado, porque
 *   `create_initial_post_types()` roda no arranque, e quem registra estado
 *   proprio depois conta com isso.
 */

import {
  publicarSeAindaAgendado,
  type ContextoDeAgendamento,
  type ResultadoDaPublicacaoAgendada,
} from './agendamento/index.js';
import {
  criarArmazenamentoDeConteudo,
  type ArmazenamentoDeConteudo,
  type Conteudo,
} from './armazenamento/index.js';
import type {
  PortaDeDados,
  PortaDeEmail,
  PortaDeRelogio,
} from './portas/index.js';
import {
  gravarConteudo,
  type ContextoDeGravacao,
  type PedidoDeGravacao,
  type ResultadoDaGravacao,
} from './gravacao/index.js';
import {
  publicar,
  type ContextoDePublicacao,
  type PedidoDePublicacao,
  type ResultadoDaPublicacao,
} from './publicacao/index.js';
import {
  escolherVisibilidade,
  type ContextoDeVisibilidade,
  type PedidoDeVisibilidade,
  type ResultadoDaVisibilidade,
} from './visibilidade/index.js';
import {
  submeterParaRevisao,
  type ContextoDeRevisao,
  type PedidoDeSubmissao,
  type ResultadoDaSubmissao,
} from './revisao/index.js';
import {
  devolverAoAutor,
  revisarEPublicar,
  type PedidoDeRevisaoEditorial,
  type ResultadoDaRevisaoEditorial,
} from './revisao-editorial/index.js';
import {
  guardarVersao,
  listarVersoesDoConteudo,
  restaurarVersao,
  type ContextoDeVersao,
  type PedidoDeListaDeVersoes,
  type PedidoDeRestauracao,
  type ResultadoDaListaDeVersoes,
  type ResultadoDaRestauracao,
  type ResultadoDeGuardarVersao,
} from './versoes/index.js';
import {
  abrirEditor,
  type ContextoDoEditor,
  type PedidoDeAberturaDoEditor,
  type ResultadoDaAberturaDoEditor,
} from './rascunho-automatico/index.js';

export * from './portas/index.js';
export * from './estado-editorial.js';
export * from './armazenamento/index.js';
/*
  T003 (US-1) sai pelo barril E pela composicao, pela mesma razao que T021 de
  BC-05: a tabela *Contratos* de `plan.md` lista *"publicar"* como operacao desta
  feature, com entrada, saida e erro proprios, e esta e a PRIMEIRA operacao deste
  modulo — logo e nela que a declaracao de permissao que o P4 cobra aparece na
  interface. O resto da pasta sai pelo barril porque e o que quem monta o
  contexto da requisicao precisa alcancar: as duas portas de ligacao tardia, os
  dez pontos de extensao e `wp_publish_post()` sem portao, que tem um segundo
  chamador no legado (a fila, em T013).
*/
export * from './publicacao/index.js';
/*
  T005 (US-2) sai pelo barril E pela composicao, pela mesma razao de T003: a
  tabela *Contratos* de `plan.md` lista *"gravar conteudo"* como a primeira
  operacao desta feature, com entrada, saida e erro proprios. O resto da pasta
  sai pelo barril porque e o que quem monta o contexto da requisicao precisa
  alcancar: os cinco colaboradores de ligacao tardia, os seis pontos de
  extensao, as 21 colunas que o filtro de dados recebe e o `empty()` do legado,
  que decide `'0'` ao contrario deste runtime.
*/
export * from './gravacao/index.js';
/*
  T009 (US-4) sai pelo barril E pela composicao, pela mesma razao: `plan.md` nao
  lista "escolher visibilidade" na tabela *Contratos* porque no legado ela nao e
  uma funcao — e o `switch` de `wp-admin/includes/post.php:318` somado ao
  `case 'private'` de `handle_status_param()`, as duas pecas que preparam o
  pedido ANTES de `wp_insert_post()`. A operacao existe aqui porque e ela que
  declara a permissao que o P4 cobra, e o resto da pasta sai pelo barril porque e
  o que a consulta publica e a leitura por identificador precisam alcancar.
*/
export * from './visibilidade/index.js';

/*
  `ESTADO_PRIVADO` está DEFINIDO DUAS VEZES, e isto aqui só resolve a
  ambiguidade do barril — não a duplicação.

  T005 o declarou em `gravacao/campos-na-gravacao.ts` e T009 em
  `visibilidade/visibilidade-do-conteudo.ts`, cada um na sua árvore, sem ver o
  do outro. O valor é o mesmo (`'private'`) nos dois; o da visibilidade é
  tipado como `EstadoEditorial`, e é por isso que ele ganha aqui.

  Qual dos dois módulos é dono do conceito é decisão de quem trabalha, não
  minha num merge: quem decidir apaga o outro e importa deste.
*/
export { ESTADO_PRIVADO } from './visibilidade/index.js';
/*
  T013 (US-6) sai pelo barril E pela composicao pela mesma razao, e com uma
  diferenca que o P4 obriga a declarar: a operacao que ela acrescenta e chamada
  **pela fila**, sem ator nenhum, e por isso a permissao dela e *"nenhuma"* — ver
  a tabela de operacoes de `ModuloDeConteudo`. O resto da pasta sai pelo barril
  porque e o que o caminho de GRAVACAO vai alcancar: a comparacao de data que
  decide agendado contra publicado e regra de T013 e ponto de chamada de T005 e
  T007.
*/
export * from './agendamento/index.js';
/*
  T015 (US-7) sai pelo barril E pela composicao, pela mesma razao de T003 e de
  T005: a tabela *Contratos* de `plan.md` lista *"submeter para revisao"* como
  operacao desta feature, com entrada, saida e erro proprios. O resto da pasta
  sai pelo barril porque e o que quem monta o contexto da requisicao precisa
  alcancar: os quatro colaboradores de ligacao tardia, os dois pontos de
  extensao da paginacao da fila, a fila em si — que e tela e nao operacao de
  dominio — e `wp_update_post()` sem portao, que tem outros chamadores no legado
  (a API, o XML-RPC, o importador e T017, que a usa para devolver o conteudo ao
  autor).
*/
export * from './revisao/index.js';
/*
  T017 (US-8) sai pelo barril E pela composicao, pela mesma razao de T003, de
  T005 e de T015: a tabela *Contratos* de `plan.md` lista *"revisar e publicar
  de outro autor"* como operacao desta feature, com entrada, saida e erro
  proprios. O resto da pasta sai pelo barril porque e o que quem monta a tela do
  editor precisa alcancar: a **lista** de capacidades que o portao comparou — que
  e o que CA-8.1, CA-8.5 e CA-8.6 distinguem, e e o que uma tela precisa para
  dizer o que falta —, a resolucao do autor que o formulario devolve e o par de
  codigos que a superficie de atualizacao da API declara para a autoria alheia.

  ⚠️ Esta pasta NAO acrescenta contexto nem porta: ela usa o `ContextoDeRevisao`
  de T015, porque no legado as duas historias sao a mesma funcao — `edit_post()`
  — e o gatilho de UC-07 e a fila que aquele contexto ja serve.
*/
export * from './revisao-editorial/index.js';
/*
  T021 (US-10) sai pelo barril E pela composicao, pela mesma razao de T003: a
  tabela *Contratos* de `plan.md` lista *"listar versoes e restaurar"* como
  operacao desta feature, com entrada, saida e erro proprios. O resto da pasta
  sai pelo barril porque e o que quem monta o contexto da requisicao precisa
  alcancar: as tres gravacoes de ligacao tardia, os dez pontos de extensao, os
  cinco ouvintes de fabrica e as funcoes do legado sem portao — `wp_save_post_revision()`,
  `_wp_put_post_revision()` (que T023 reusa) e `wp_restore_post_revision()`, que
  tem dois chamadores com guardas diferentes no legado.
*/
export * from './versoes/index.js';
/*
  T023 (US-11) sai pelo barril E pela composicao, pela mesma razao de T003 e
  T005 — com uma ressalva que **nao se resolve aqui**: a tabela *Contratos* de
  `plan.md` tem seis operacoes e esta **nao e nenhuma delas**, enquanto a entrega
  de T023 em `tasks.md` exige que *"o comportamento de US-11 exista"*. A lacuna
  esta registrada no cabecalho de `rascunho-automatico/abrir-editor.ts` e no
  `README.md`, e a operacao entra como as outras: com declaracao explicita de
  permissao, que e o que o P4 cobra. O resto da pasta sai pelo barril porque e o
  que quem monta o contexto da requisicao precisa alcancar: a fila de ligacao
  tardia, os quatro pontos de extensao, a enumeracao de estado que a API publica
  e o intervalo de salvamento automatico que duas superficies entregam ao
  cliente.
*/
export * from './rascunho-automatico/index.js';

/*
  `ESTADO_DE_RASCUNHO_AUTOMATICO` está DEFINIDO DUAS VEZES — o mesmo caso de
  `ESTADO_PRIVADO`, logo acima. T015 o declarou em `revisao/` e T023 em
  `rascunho-automatico/`, cada um na sua árvore. Isto só resolve a ambiguidade
  do barril; de quem é o conceito é decisão de quem trabalha.
*/
export { ESTADO_DE_RASCUNHO_AUTOMATICO } from './rascunho-automatico/index.js';

/** As tres portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeConteudo {
  readonly dados: PortaDeDados;
  readonly email: PortaDeEmail;
  readonly relogio: PortaDeRelogio;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao — as seis da tabela *Contratos*
 * de `plan.md` —, com a declaracao explicita de permissao que o P4 da
 * constituicao exige, e nenhuma antes da propria tarefa.
 *
 * | operacao | historia | tarefa | permissao exigida |
 * |---|---|---|---|
 * | `gravar` | US-2, US-3 | T005, T007 | **nenhuma para gravar, como no legado** — `wp_insert_post()` nao tem portao, e o achado de QA de REQ-020 registra que o card nao tem recusa propria. A **unica** decisao de capacidade do caminho nao recusa: ela esvazia o identificador na URL de quem nao pode publicar, em `pending` (CA-3.4) |
 * | `publicar` | US-1 | T003 | **a capacidade de publicar daquele tipo** (`$post_type->cap->publish_posts`), CA-1.1 |
 * | `escolherVisibilidade` | US-4 | T009 | **a mesma capacidade**, e **somente** quando a visibilidade resolve em `private`, CA-4.1 |
 * | `publicar`, pedido sobre conteudo ja publicado | US-5 | T011 | a mesma, e e cobrada antes da guarda de estado — ver `publicacao/republicacao-nula.ts` |
 * | `publicarSeAindaAgendado` | US-6 | T013 | **nenhuma**, e e o legado: quem chama e a fila, e nao ha ator no disparo |
 * | `submeterParaRevisao` | US-7 | T015 | **a capacidade de editar AQUELE conteudo** (`edit_post`, com o objeto), somada a de mexer em conteudo alheio quando o autor do pedido nao e quem pede. A capacidade de **publicar** nao e exigida: ela e perguntada, e decide o estado gravado (CA-7.1) e o identificador esvaziado (CA-7.4) |
 * | `revisarEPublicar` e `devolverAoAutor` | US-8 | T017 | **a mesma** `edit_post` com o objeto, e para conteudo de outra pessoa ela resolve na **soma** de `edit_others_posts` daquele tipo com a que o estado exige — `edit_published_posts` em publicado e agendado, `edit_private_posts` em privado (CA-8.1). Trocar o autor exige, por cima, a primitiva do alheio. A de **publicar** continua apenas perguntada: sem ela, o estado e rebaixado para `pending`, nao recusado |
 * | `guardarVersao` | US-10 | T021 | **nenhuma, e e assim no legado** — e ouvinte do caminho de gravacao, onde `edit_post` ja foi cobrada |
 * | `listarVersoes` | US-10 | T021 | **`edit_post` do conteudo** (nao `read_post`) |
 * | `restaurarVersao` | US-10 | T021 | **`edit_post` do conteudo pai** da versao |
 * | `abrirEditor` | US-11 | T023 | **duas**: o slot de editar **e** o slot de criar daquele tipo (`$post_type->cap->edit_posts` e `->create_posts`), CA-11.1 |
 *
 * O armazenamento **nao e operacao**, e por isso nao declara permissao: ele nao
 * decide nada. E a comparacao de data de US-6 (`resolverEstadoPelaData`) tambem
 * nao e operacao: e funcao pura que o caminho de **gravacao** chama, e sai pelo
 * barril, nao por aqui.
 */
export interface ModuloDeConteudo {
  readonly nome: 'conteudo';
  readonly portas: PortasDeConteudo;
  /**
   * A forma de armazenamento de conteudo, metadado e versao anterior (T002).
   * Le e grava **somente** pela porta de dados.
   */
  readonly armazenamento: ArmazenamentoDeConteudo;

  /**
   * Torna o conteudo visivel ao publico do site, por ato explicito (US-1,
   * T003).
   *
   * **Permissao exigida: a capacidade de publicar daquele tipo de conteudo.**
   * Nao e a cadeia `publish_posts`: e o slot de mesmo nome no mapa
   * `$post_type->cap` do **registro do tipo**, e e por isso que publicar pagina
   * exige `publish_pages` sem um unico `if` sobre o nome `page`. UC-03 declara a
   * autorizacao na mesma forma, e CA-1.1 a cobra. A recusa e **valor**, com o
   * codigo e o texto que a API do legado devolve — e a divergencia entre *"recusa
   * explicita na tela"* e o que o painel do legado faz esta registrada em
   * `publicacao/permissao-de-publicacao.ts`, sem ser resolvida aqui.
   *
   * **Pedir a publicacao de conteudo que ja esta publicado e operacao sem
   * efeito** (US-5, T011): o registro nao muda, nenhum ponto de extensao
   * dispara e nenhuma automacao, notificacao ou agendamento e acionado. E
   * BR-MIGRAR-007 (`P7`), e o desfecho `ja-publicado` nao e falha — a analise
   * completa, com o que cada criterio nega e por que a nulidade **nao** vale
   * para o caminho de gravacao, esta em `publicacao/republicacao-nula.ts`.
   *
   * O contexto chega por argumento, e nao pela composicao, porque identidade,
   * matriz de papeis e estado de rede sao escopo de REQUISICAO (AD-02,
   * BR-MIGRAR-105) — e porque as colaboracoes com BC-02, BC-11 e BC-07 sao de
   * ligacao tardia (AD-10, regra de dependencia 3).
   */
  publicar(
    contexto: ContextoDePublicacao,
    pedido: PedidoDePublicacao,
  ): ResultadoDaPublicacao;

  /**
   * Grava conteudo, com o estado resolvido para **rascunho** quando o pedido nao
   * o informa (US-2, T005) e com o identificador na URL tornado **unico a partir
   * da publicacao** (US-3, T007). E `wp_insert_post()`
   * (`wp-includes/post.php:4598`).
   *
   * **Permissao exigida: nenhuma, e isso e o legado, nao uma brecha.** A funcao
   * e chamada pelo painel, pela API REST, pelo XML-RPC, pela publicacao por
   * e-mail, pelo importador e pelo proprio nucleo, e **cada superficie decide a
   * permissao antes de chamar**. O **P4** manda preservar *"o default de cada
   * camada como ele e hoje, inclusive quando o default e permissivo"*, e o
   * achado de QA de REQ-020 e literal: *"nao ha entrada invalida nem permissao
   * ausente propria deste card"*. A unica decisao de capacidade do caminho de
   * gravacao — o identificador na URL de quem nao pode publicar, em `pending` —
   * **nao recusa a gravacao: ela apaga um campo** (CA-3.4 e CA-7.4 sao a mesma
   * linha do legado), e esta no passo 10 de `gravacao/gravar.ts`, analisada em
   * `gravacao/permissao-do-identificador.ts`.
   *
   * O contexto chega por argumento pela mesma razao de `publicar`, e aqui ela
   * tem consequencia direta: o **autor** gravado e, por omissao, o ator do
   * contexto (`:4824`), e o cenario `@concorrencia` de `PT-002` cobra que *"a
   * autoria gravada em cada conteudo corresponde a quem o gravou"*.
   */
  gravar(
    contexto: ContextoDeGravacao,
    pedido: PedidoDeGravacao,
  ): ResultadoDaGravacao;
  /**
   * Resolve a visibilidade escolhida nos campos que a gravacao vai escrever —
   * e o estado `private` de US-4 (T009).
   *
   * **Permissao exigida: a capacidade de publicar daquele tipo de conteudo**, a
   * MESMA de {@link ModuloDeConteudo.publicar}, e exigida **somente** quando a
   * visibilidade resolve em `private` — `handle_status_param()`,
   * `case 'private'`
   * (`class-wp-rest-posts-controller.php:1575`-`:1583`). O legado nao tem
   * `publish_private_posts`, e os ramos `public` e `password` nao tem portao
   * proprio: inventar um fecharia uma porta que o legado deixa aberta (**P4**).
   *
   * ⚠️ **Nao grava, e no legado ela tambem nao.** O privado chega a coluna pelo
   * caminho de gravacao (`wp_insert_post()`, T005 em diante), com um `UPDATE` de
   * 21 colunas; esta operacao e o `switch` de visibilidade somado ao portao, as
   * duas pecas que preparam o pedido antes dele. A razao completa esta em
   * `visibilidade/escolher-visibilidade.ts`.
   */
  escolherVisibilidade(
    contexto: ContextoDeVisibilidade,
    pedido: PedidoDeVisibilidade,
  ): ResultadoDaVisibilidade;
  /**
   * Publica o conteudo agendado quando a fila o aciona — **se** ele ainda
   * estiver agendado e **se** a data ja tiver chegado (US-6, T013).
   *
   * **Permissao exigida: nenhuma.** Nao e lapso: e
   * `check_and_publish_future_post()` (`wp-includes/post.php:5482`), registrada
   * no gancho `publish_future_post` com prioridade 10
   * (`wp-includes/default-filters.php:357`) e chamada **pela fila**, onde nao ha
   * ator. O **P4** manda declarar a permissao de toda operacao exposta e
   * *"preservar o default de cada camada, inclusive quando o default e
   * permissivo"* — aqui o default e a ausencia de portao, e o que guarda a
   * operacao nao e capacidade: sao as **duas** verificacoes de BR-MIGRAR-006, o
   * estado corrente e a data (CA-6.3 e CA-6.4).
   *
   * **Nao ha, de proposito, operacao de "agendar".** O estado agendado e
   * calculado pela comparacao de data na gravacao, nao comandado — ADR-0005, e a
   * divergencia com a tabela *Contratos* de `plan.md` esta registrada em
   * `agendamento/index.ts` e no README deste modulo.
   *
   * O contexto chega por argumento e **estende** o da publicacao com o relogio,
   * que e o unico lugar desta feature em que o tempo decide: ver
   * `agendamento/publicacao-agendada.ts`.
   */
  publicarSeAindaAgendado(
    contexto: ContextoDeAgendamento,
    referencia: number | Conteudo,
  ): ResultadoDaPublicacaoAgendada;

  /**
   * Entrega o conteudo proprio para que alguem com poder de publicar o avalie,
   * gravando o estado `pending` (US-7, T015).
   *
   * **Permissao exigida: a capacidade de editar AQUELE conteudo** — `edit_post`
   * com o objeto, que e **meta-capacidade** e resolve por autoria e por estado
   * (`wp-includes/capabilities.php:108`). Submeter o conteudo de outra pessoa
   * exige, por cima, a capacidade de mexer em conteudo alheio daquele tipo
   * (`wp-admin/includes/post.php:88`-`:105`) — e e isso que faz esta historia
   * ser sobre conteudo **proprio**. O erro e o que `plan.md` declara na tabela
   * *Contratos*: *"sem permissao de editar"*.
   *
   * ⚠️ **A capacidade de publicar nao e exigida: ela e perguntada.** A falta
   * dela nao recusa — UC-06 chama este caminho de *"o normal do colaborador"*.
   * Ela decide duas coisas, e as duas sao criterios desta historia: o estado
   * que vai para a coluna, porque um pedido de publicacao de quem nao pode
   * publicar e **rebaixado** para `pending` (CA-7.1), e o identificador na URL,
   * que e **esvaziado** para que ninguem reserve endereco que nao pode usar
   * (CA-7.4, a regra que T007 ja portou no caminho de gravacao).
   *
   * O contexto chega por argumento, e nao pela composicao, pela mesma razao de
   * `publicar` e de `gravar`: identidade, matriz de papeis e estado de rede sao
   * escopo de REQUISICAO (AD-02, BR-MIGRAR-105).
   */
  submeterParaRevisao(
    contexto: ContextoDeRevisao,
    pedido: PedidoDeSubmissao,
  ): ResultadoDaSubmissao;

  /**
   * Revisa e publica o conteudo que **outra pessoa** escreveu, preservando a
   * autoria original (US-8, T017).
   *
   * **Permissao exigida: a capacidade de editar AQUELE conteudo** — a **mesma**
   * `edit_post` com o objeto que `submeterParaRevisao` pergunta, porque no
   * legado as duas historias sao a mesma funcao (`edit_post()`,
   * `wp-admin/post.php:236`). O que muda e o que a traducao **devolve**: para o
   * conteudo de outra pessoa ela soma `edit_others_posts` daquele tipo a
   * capacidade que o estado exige — `edit_published_posts` em publicado e em
   * agendado, `edit_private_posts` em privado
   * (`wp-includes/capabilities.php:266`-`:275`, **CA-8.1**). O erro e o que
   * `plan.md` declara: *"sem permissao sobre conteudo de outro"*.
   *
   * A lista que o portao comparou sai no resultado, e nao e enfeite: **CA-8.1**
   * (a soma), **CA-8.5** (a familia de pagina) e **CA-8.6** (a capacidade da
   * funcao especial declarada) sao criterios sobre a **lista**, nao sobre o
   * booleano.
   *
   * ⚠️ **A capacidade de publicar continua apenas perguntada**, como em US-7 e
   * pela mesma linha: quem tem `edit_others_posts` e nao tem `publish_posts`
   * **nao e recusado** — o estado pedido e rebaixado para `pending`
   * (`wp-admin/includes/post.php:152`-`:159`).
   *
   * ⚠️ **A autoria original sobrevive por dois mecanismos, e nenhum deles e um
   * `if` que diga isso**: a superficie devolve o autor da linha antes de
   * traduzir o pedido (`:691`-`:695`) e a mistura de `wp_update_post()` faz
   * chave ausente conservar o valor gravado (`wp-includes/post.php:5367`). A
   * analise esta em `revisao-editorial/autoria-na-revisao.ts`.
   *
   * O contexto chega por argumento, e nao pela composicao, pela mesma razao das
   * outras tres operacoes (AD-02, BR-MIGRAR-105) — e aqui ela tem consequencia
   * direta: a decisao de capacidade e sobre **quem revisa**, e o cenario
   * `@concorrencia` de `PT-002` cobra que duas gravacoes simultaneas nao troquem
   * de autoria.
   */
  revisarEPublicar(
    contexto: ContextoDeRevisao,
    pedido: PedidoDeRevisaoEditorial,
  ): ResultadoDaRevisaoEditorial;

  /**
   * Devolve o conteudo ao autor, voltando o estado para rascunho sem perder o
   * texto (US-8, T017, **CA-8.4**).
   *
   * **Permissao exigida: a mesma de {@link ModuloDeConteudo.revisarEPublicar}**
   * — e o mesmo `edit_post()` com o mesmo portao.
   *
   * 🟢 **E o seletor de estado da tela, nao um botao**, e o painel so o
   * renderiza para quem pode publicar (`wp-admin/includes/meta-boxes.php:129` e
   * `:160`-`:165`): devolver ao autor e privilegio de quem podia ter publicado,
   * e nao ha outro caminho pelo painel.
   *
   * ⚠️ **Nenhum aviso sai daqui.** UC-07 e literal — *"Nenhuma notificacao e
   * enviada ao autor: o sistema nao avisa"* — e US-9 pede o contrario. A
   * divergencia esta registrada, e **nao resolvida**, na PARADA de
   * `portas/porta-de-email.ts`: quem pegar T019 decide com quem decide.
   */
  devolverAoAutor(
    contexto: ContextoDeRevisao,
    pedido: PedidoDeRevisaoEditorial,
  ): ResultadoDaRevisaoEditorial;
  /**
   * Guarda a versao anterior do conteudo editado (US-10, T021) —
   * `wp_save_post_revision()`.
   *
   * **Permissao exigida: nenhuma, e e assim no legado.** Esta nao e uma
   * superficie: e `wp_save_post_revision()`, o **ouvinte** que o nucleo registra
   * em `post_updated` com prioridade 10 (`default-filters.php:446`), e a
   * capacidade de quem gravou o conteudo ja foi cobrada pelo caminho de
   * gravacao. O **P4** manda *"preservar o default de cada camada, inclusive
   * quando o default e permissivo"*, e dar portao a esta operacao impediria o
   * versionamento no unico lugar de onde ele e disparado.
   *
   * ⚠️ **O outro ouvinte do par NAO e esta funcao, e pendura-la no ponto dele
   * versiona na insercao.** Quem a instalacao de fabrica dispara em
   * `wp_after_insert_post`, prioridade 9, e `guardarVersaoNaInsercao()`, que sai
   * pelo barril de `versoes/` e **nao** entra aqui: e ela que tem a guarda
   * `! $update` (`wp-includes/revision.php:108`), e sem essa guarda a criacao de
   * conteudo passaria a criar versao. As duas, com a guarda cruzada que as
   * separa, estao em `OUVINTES_DE_FABRICA_DA_VERSAO`
   * (`versoes/contexto-de-versao.ts`).
   *
   * ⚠️ **A versao guardada carrega o texto como ele acabou de ser gravado, e
   * nao o anterior** — a divergencia de redacao com CA-10.1 esta registrada no
   * cabecalho de `versoes/contexto-de-versao.ts` e **nao foi resolvida aqui**.
   */
  guardarVersao(
    contexto: ContextoDeVersao,
    pedido: PedidoDeGuardarVersao,
  ): ResultadoDeGuardarVersao;

  /**
   * Lista as versoes de um conteudo (US-10, T021).
   *
   * **Permissao exigida: `edit_post` do conteudo** — e nao `read_post`
   * (`class-wp-rest-revisions-controller.php:186`). Ver o historico exige poder
   * editar o conteudo.
   */
  listarVersoes(
    contexto: ContextoDeVersao,
    pedido: PedidoDeListaDeVersoes,
  ): ResultadoDaListaDeVersoes;

  /**
   * Restaura uma versao sobre o conteudo (US-10, T021) —
   * `wp_restore_post_revision()` com as guardas da tela do painel.
   *
   * **Permissao exigida: `edit_post` do conteudo PAI da versao**
   * (`wp-admin/revision.php:42`). Nao e sobre a versao: a resolucao de uma
   * versao em `edit_post` segue para o pai de qualquer forma
   * (`capabilities.php:215`), e a superficie pergunta pelo pai diretamente.
   */
  restaurarVersao(
    contexto: ContextoDeVersao,
    pedido: PedidoDeRestauracao,
  ): ResultadoDaRestauracao;

  /**
   * Reserva um registro em rascunho automatico pelo ato de abrir o editor de um
   * conteudo novo, antes de qualquer digitacao (US-11, T023). E
   * `get_default_post_to_edit( $tipo, true )`
   * (`wp-admin/includes/post.php:758`).
   *
   * **Permissao exigida: duas capacidades do tipo, e e preciso ter as duas.** O
   * slot de editar e o slot de criar (`$post_type->cap->edit_posts` e
   * `->create_posts`, `wp-admin/post-new.php:58`), CA-11.1. De fabrica as duas
   * resolvem para a mesma cadeia — `get_post_type_capabilities()` faz
   * `create_posts` cair em `edit_posts` quando o registro nao o declara
   * (`wp-includes/post.php:2070`) —, e perguntar uma so quebraria o tipo de
   * terceiro que as separa. A analise esta em
   * `rascunho-automatico/permissao-do-editor.ts`.
   *
   * 🔴 **Esta operacao nao esta na tabela *Contratos* de `plan.md`**, que lista
   * seis e nenhuma e esta; a entrega de T023 em `tasks.md` a exige de qualquer
   * forma. A lacuna esta declarada e **nao resolvida** no cabecalho de
   * `rascunho-automatico/abrir-editor.ts`.
   *
   * O contexto chega por argumento pela mesma razao de `publicar` e `gravar`, e
   * carrega o contexto de gravacao inteiro: no legado esta funcao **chama**
   * `wp_insert_post()` (`:775`), e rederivar os colaboradores dela daria dois
   * donos para a mesma coluna.
   */
  abrirEditor(
    contexto: ContextoDoEditor,
    tipoDoConteudo: string,
    pedido?: PedidoDeAberturaDoEditor,
  ): ResultadoDaAberturaDoEditor;
}

/**
 * Quem se versiona.
 *
 * A entrada e **so o identificador**, como em `wp_save_post_revision( $post_id )`:
 * o ouvinte do legado recebe o identificador e le a linha, e e essa releitura
 * que faz a versao carregar o texto **ja gravado**.
 */
export interface PedidoDeGuardarVersao {
  readonly conteudoId: number;

}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-DESCARTAR-009
 * descarta a redefinicao de funcao global e as 176 guardas `function_exists`, e
 * `target_business_rules.md` BR-MIGRAR-103 (`EXT-SUBST`) poe no lugar o registro
 * explicito, resolvido antes do primeiro uso. Trocar uma porta e passar outra
 * implementacao aqui — sem alterar arquivo deste modulo, que e o criterio de
 * "substituivel" que BR-MIGRAR-103 propoe.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou "nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework", porque a ordem de arranque do legado e contrato publico
 * e framework com ciclo de vida proprio disputa com ela.
 */
export function criarModuloDeConteudo(
  portas: PortasDeConteudo,
): ModuloDeConteudo {
  return {
    nome: 'conteudo',
    portas,
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui, que e o que `EXT-ORDEM` cobra e o que `modulo.test.ts` afirma.
    armazenamento: criarArmazenamentoDeConteudo(portas.dados),
    publicar,
    gravar: gravarConteudo,
    escolherVisibilidade,
    publicarSeAindaAgendado,
    submeterParaRevisao,
    revisarEPublicar,
    devolverAoAutor,
    guardarVersao: (contexto, pedido) =>
      guardarVersao(contexto, pedido.conteudoId),
    listarVersoes: listarVersoesDoConteudo,
    restaurarVersao,
    abrirEditor,
  };
}
