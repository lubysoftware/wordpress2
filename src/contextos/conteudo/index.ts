/**
 * Modulo de conteudo — BC-01 de `target_architecture.md`.
 *
 * Feature `002-autoria-e-publicacao`, tarefas T001, T002 e T003. O que existe
 * aqui e o que as tres entregam: o modulo carrega com as tres portas
 * declaradas, com o vocabulario de estado editorial do legado como enumeracao
 * fechada, com a forma de armazenamento de conteudo, metadado e versao anterior
 * e com **uma** regra de negocio — a publicacao por ato explicito de US-1.
 * Gravacao, agendamento, identificador na URL, submissao, revisao, versao
 * anterior e rascunho automatico entram nas tarefas delas (T005 em diante), e a
 * leitura obrigatoria de cada uma esta em `./README.md`.
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
  T009 (US-4) sai pelo barril E pela composicao, pela mesma razao: `plan.md` nao
  lista "escolher visibilidade" na tabela *Contratos* porque no legado ela nao e
  uma funcao — e o `switch` de `wp-admin/includes/post.php:318` somado ao
  `case 'private'` de `handle_status_param()`, as duas pecas que preparam o
  pedido ANTES de `wp_insert_post()`. A operacao existe aqui porque e ela que
  declara a permissao que o P4 cobra, e o resto da pasta sai pelo barril porque e
  o que a consulta publica e a leitura por identificador precisam alcancar.
*/
export * from './visibilidade/index.js';

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
 * | `publicar` | US-1 | T003 | **a capacidade de publicar daquele tipo** (`$post_type->cap->publish_posts`), CA-1.1 |
 * | `escolherVisibilidade` | US-4 | T009 | **a mesma capacidade**, e **somente** quando a visibilidade resolve em `private`, CA-4.1 |
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
    escolherVisibilidade,
  };
}
