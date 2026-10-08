/**
 * Modulo de conteudo — BC-01 de `target_architecture.md`.
 *
 * Feature `002-autoria-e-publicacao`, tarefas T001, T002, T003 e T021. O que existe
 * aqui e o que as quatro entregam: o modulo carrega com as tres portas
 * declaradas, com o vocabulario de estado editorial do legado como enumeracao
 * fechada, com a forma de armazenamento de conteudo, metadado e versao anterior
 * e com **duas** regras de negocio — a publicacao por ato explicito de US-1 e as
 * versoes anteriores de US-10. Gravacao, agendamento, identificador na URL,
 * submissao, revisao, notificacao e rascunho automatico entram nas tarefas delas
 * (T005 em diante), e a leitura obrigatoria de cada uma esta em `./README.md`.
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
 * | `guardarVersao` | US-10 | T021 | **nenhuma, e e assim no legado** — e ouvinte do caminho de gravacao, onde `edit_post` ja foi cobrada |
 * | `listarVersoes` | US-10 | T021 | **`edit_post` do conteudo** (nao `read_post`) |
 * | `restaurarVersao` | US-10 | T021 | **`edit_post` do conteudo pai** da versao |
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
    guardarVersao: (contexto, pedido) =>
      guardarVersao(contexto, pedido.conteudoId),
    listarVersoes: listarVersoesDoConteudo,
    restaurarVersao,
  };
}
