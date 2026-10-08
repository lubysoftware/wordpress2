/**
 * Modulo de conteudo — BC-01 de `target_architecture.md`.
 *
 * Feature `002-autoria-e-publicacao`, tarefas T001, T002, T003, T005 e T023. O
 * que existe aqui e o que as cinco entregam: o modulo carrega com as tres portas
 * declaradas, com o vocabulario de estado editorial do legado como enumeracao
 * fechada, com a forma de armazenamento de conteudo, metadado e versao anterior
 * e com **tres** regras de negocio — a publicacao por ato explicito de US-1, a
 * gravacao com estado resolvido de US-2 e o rascunho automatico reservado ao
 * abrir o editor de US-11. Agendamento, identificador na URL, submissao, revisao
 * e versao anterior entram nas tarefas delas (T007 em diante), e a leitura
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
 * | `gravar` | US-2 | T005 | **nenhuma, como no legado** — `wp_insert_post()` nao tem portao, e o achado de QA de REQ-020 registra que o card nao tem recusa propria |
 * | `publicar` | US-1 | T003 | **a capacidade de publicar daquele tipo** (`$post_type->cap->publish_posts`), CA-1.1 |
 * | `abrirEditor` | US-11 | T023 | **duas**: o slot de editar **e** o slot de criar daquele tipo (`$post_type->cap->edit_posts` e `->create_posts`), CA-11.1 |
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
   * o informa (US-2, T005). E `wp_insert_post()`
   * (`wp-includes/post.php:4598`).
   *
   * **Permissao exigida: nenhuma, e isso e o legado, nao uma brecha.** A funcao
   * e chamada pelo painel, pela API REST, pelo XML-RPC, pela publicacao por
   * e-mail, pelo importador e pelo proprio nucleo, e **cada superficie decide a
   * permissao antes de chamar**. O **P4** manda preservar *"o default de cada
   * camada como ele e hoje, inclusive quando o default e permissivo"*, e o
   * achado de QA de REQ-020 e literal: *"nao ha entrada invalida nem permissao
   * ausente propria deste card"*. A unica decisao de capacidade do caminho de
   * gravacao — o identificador na URL de quem nao pode publicar — e CA-7.4, em
   * T015, e esta marcada na posicao exata do fluxo em `gravacao/gravar.ts`.
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
    abrirEditor,
  };
}
