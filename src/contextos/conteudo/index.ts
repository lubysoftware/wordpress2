/**
 * Modulo de conteudo — BC-01 de `target_architecture.md`.
 *
 * Feature `002-autoria-e-publicacao`, tarefas T001, T002, T003, T005, T007,
 * T009, T011 e T013. O que existe aqui e o que as oito entregam: o modulo
 * carrega com as tres portas declaradas, com o vocabulario de estado editorial
 * do legado como enumeracao fechada, com a forma de armazenamento de conteudo,
 * metadado e versao anterior e com **seis** regras de negocio — a publicacao por
 * ato explicito de US-1, a gravacao com estado resolvido de US-2, o
 * identificador na URL unico so a partir da publicacao de US-3, o conteudo
 * privado de US-4, a republicacao nula de US-5 e o agendamento por comparacao de
 * data, com verificacao dupla, de US-6. Submissao, revisao, versao anterior e
 * rascunho automatico entram nas tarefas delas (T015 em diante), e a leitura
 * obrigatoria de cada uma esta em `./README.md`.
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
  };
}
