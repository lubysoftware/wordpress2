/**
 * Modulo de conteudo — BC-01 de `target_architecture.md`.
 *
 * Feature `002-autoria-e-publicacao`, tarefas T001, T002, T003, T005, T007, T015
 * e T017. O que existe aqui e o que as sete entregam: o modulo carrega com as
 * tres portas declaradas, com o vocabulario de estado editorial do legado como
 * enumeracao fechada, com a forma de armazenamento de conteudo, metadado e
 * versao anterior e com **cinco** regras de negocio — a publicacao por ato
 * explicito de US-1, a gravacao com estado resolvido de US-2, o identificador na
 * URL unico so a partir da publicacao de US-3, a submissao para revisao de US-7
 * e a revisao do conteudo alheio com a autoria preservada de US-8. Agendamento,
 * visibilidade privada, versao anterior e rascunho automatico entram nas tarefas
 * delas (T009 em diante), e a leitura obrigatoria de cada uma esta em
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
  criarArmazenamentoDeConteudo,
  type ArmazenamentoDeConteudo,
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
 * | `submeterParaRevisao` | US-7 | T015 | **a capacidade de editar AQUELE conteudo** (`edit_post`, com o objeto), somada a de mexer em conteudo alheio quando o autor do pedido nao e quem pede. A capacidade de **publicar** nao e exigida: ela e perguntada, e decide o estado gravado (CA-7.1) e o identificador esvaziado (CA-7.4) |
 * | `revisarEPublicar` e `devolverAoAutor` | US-8 | T017 | **a mesma** `edit_post` com o objeto, e para conteudo de outra pessoa ela resolve na **soma** de `edit_others_posts` daquele tipo com a que o estado exige — `edit_published_posts` em publicado e agendado, `edit_private_posts` em privado (CA-8.1). Trocar o autor exige, por cima, a primitiva do alheio. A de **publicar** continua apenas perguntada: sem ela, o estado e rebaixado para `pending`, nao recusado |
 *
 * O armazenamento **nao e operacao**, e por isso nao declara permissao: ele nao
 * decide nada.
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
    submeterParaRevisao,
    revisarEPublicar,
    devolverAoAutor,
  };
}
