/**
 * Modulo de classificacao — BC-02 de `target_architecture.md`.
 *
 * Feature `003-classificacao-do-conteudo`, tarefas T001, T002 e T003. O que
 * existe aqui e o que as tres entregam: o modulo carrega com a porta de dados
 * declarada, com os oito contextos de classificacao do nucleo registrados, com a
 * forma de armazenamento de rotulo, contexto e juncao — e com **a separacao
 * entre rotulo e contexto** (US-1), que e a primeira regra de negocio desta
 * feature a entrar, em `./rotulo-e-contexto/`. A classificacao (US-2) entra em
 * T005, o termo padrao (US-3) em T007, a manutencao da lista (US-4) em T009 e a
 * proibicao de apagar o padrao (US-5) em T011. A leitura obrigatoria de cada uma
 * esta em `./README.md`.
 *
 * BC-02 e a fusao de `taxonomias-e-termos` com `links-e-bookmarks`, e
 * `target_architecture.md` chama a fusao de *"contraintuitiva e necessaria"*:
 * `term_relationships.object_id` e polimorfico e serve `posts` **e** `links`, e
 * separa-los *"deixaria a coluna polimorfica sem dono"*. E por isso que
 * `link_category` esta entre os oito contextos registrados aqui.
 *
 * Duas coisas que este arquivo faz de proposito:
 *
 * - **Nao guarda estado de modulo.** `BR-MIGRAR-105` (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO, e a
 *   dimensao **D-A** de `parity_specs.md` da nome ao risco. Aqui isso alcanca o
 *   registro de contextos: no legado `$wp_taxonomies` e uma `global` mutavel por
 *   extensao, e um mapa no escopo deste modulo cruzaria os contextos de duas
 *   requisicoes concorrentes. Por isso as portas chegam por argumento e o
 *   registro nasce **dentro** de {@link criarModuloDeClassificacao}: duas
 *   composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados e nao escreve nada ao ser criado — registrar os oito contextos e
 *   trabalho em memoria, sobre declaracao em codigo, sem tocar a porta. A ordem
 *   de arranque e contrato publico (`BR-MIGRAR-106`, `EXT-ORDEM`), e trabalho
 *   feito na importacao e trabalho fora da ordem.
 */

import {
  criarArmazenamentoDeClassificacao,
  type ArmazenamentoDeClassificacao,
} from './armazenamento/index.js';
import type { PortaDeDados } from './portas/index.js';
import {
  criarRegistroComOsContextosDoNucleo,
  type ContextoDeClassificacao,
  type RegistroDeContextos,
} from './registro/index.js';
import {
  contextoAceitaTipoDeObjeto,
  contextosDoTipoDeObjeto,
  nomesDosContextosDoTipoDeObjeto,
  obterTermo,
  renomearRotulo,
  type EscopoDeRotuloEContexto,
  type PedidoDeRenomeacao,
  type ResultadoDaRenomeacao,
  type RotuloLido,
} from './rotulo-e-contexto/index.js';

export * from './portas/index.js';
export * from './registro/index.js';
export * from './armazenamento/index.js';
export * from './rotulo-e-contexto/index.js';

/**
 * A porta de que este modulo depende, na forma em que ele a recebe.
 *
 * E uma so, e continua sendo uma depois de T002 e de T003: as tres estruturas de
 * armazenamento leem e gravam **por ela**, e nenhuma outra borda entrou. A razao
 * de nao haver porta de cache nem de serializacao esta em `portas/index.ts`; a de
 * nao haver porta de opcoes e que nenhuma das tres tarefas le opcao nenhuma — as
 * operacoes de US-1 perguntam ao registro desta requisicao ou ao banco, e nada
 * mais. A opcao `default_category`, que US-3 consulta, chega com T007.
 */
export interface PortasDeClassificacao {
  readonly dados: PortaDeDados;
}

/**
 * O modulo carregado.
 *
 * A superficie cresce **uma historia por vez**: cada tarefa acrescenta aqui a
 * sua operacao — as cinco da tabela *Contratos* de `plan.md` —, com a declaracao
 * explicita de permissao que o **P4** da constituicao exige, e nenhuma antes da
 * propria tarefa. Com T003 fechada, o que entrou foram as de US-1.
 *
 * O armazenamento **nao e operacao**, e por isso nao declara permissao: ele nao
 * decide nada. Quem decide e a historia que o chama.
 *
 * ⚠️ **Uma peca de US-1 fica de fora desta superficie de proposito:**
 * `removerRotuloDoContexto()`, que e o trecho final de `wp_delete_term()`
 * (`wp-includes/taxonomy.php:2200`-`:2216`) e e onde **CA-1.3** se decide. Ela e
 * exportada pelo modulo (por `./rotulo-e-contexto/`) e **nao** e operacao: sem a
 * protecao do termo padrao (US-5, T011) e sem a cascata (US-4, T009), publica-la
 * criaria um caminho de apagar dado que o legado **nao expoe** — e a tabela *Nao
 * negociavel* da constituicao poe "apagar dado" fora do alcance do agente. A
 * razao inteira esta no bloco 🔴 de `rotulo-e-contexto/remover-rotulo-do-contexto.ts`.
 */
export interface ModuloDeClassificacao {
  readonly nome: 'classificacao';
  readonly portas: PortasDeClassificacao;
  /**
   * Os contextos desta requisicao, com os oito do nucleo ja dentro.
   *
   * E **mutavel de proposito**: `register_taxonomy()` e API publica e uma extensao
   * registra contexto em execucao (P2, P8). O que nao e compartilhado e o
   * registro entre composicoes — ver o cabecalho.
   */
  readonly contextos: RegistroDeContextos;
  /**
   * A forma de armazenamento de rotulo, contexto e juncao (T002). Le e grava
   * **somente** pela porta de dados.
   */
  readonly armazenamento: ArmazenamentoDeClassificacao;

  /**
   * Le um rotulo, opcionalmente dentro de um contexto — `get_term()` sobre
   * `WP_Term::get_instance()` (US-1, T003, **CA-1.1**).
   *
   * **Permissao exigida: nenhuma**, e isso e leitura do legado, nao economia:
   * `get_term()` nao verifica capacidade, e e chamada em pagina publica sem
   * ninguem autenticado. Quem cobra e a tela de termos (`manage_terms`,
   * `wp-admin/edit-tags.php:26`), que e **CA-4.1**, de T009.
   *
   * As quatro saidas — a linha do contexto pedido, a linha unica,
   * `ambiguous_term_id` e `invalid_taxonomy` — estao em
   * `rotulo-e-contexto/resolucao-do-rotulo-no-contexto.ts`, com o inventario de
   * por que o rotulo compartilhado e, no legado de hoje, dado herdado.
   */
  obterTermo(rotuloId: number, contexto?: string): RotuloLido;

  /**
   * Os contextos registrados que se aplicam ao tipo de objeto —
   * `get_object_taxonomies( $tipo, 'objects' )` (US-1, T003, **CA-1.4**).
   *
   * **Permissao exigida: nenhuma** — le o registro desta requisicao, nao o
   * banco. A ordem e a de registro, e ela e dado: ver
   * `rotulo-e-contexto/tipos-de-objeto-do-contexto.ts`.
   */
  contextosDoTipoDeObjeto(
    tipoDeObjeto: string | readonly string[],
  ): readonly ContextoDeClassificacao[];

  /**
   * Os **nomes** dos mesmos contextos — `get_object_taxonomies( $tipo )`, o
   * default `$output = 'names'` (US-1, T003, **CA-1.4**).
   *
   * **Permissao exigida: nenhuma.** As duas formas entram porque as duas sao
   * contrato publico da mesma funcao do legado (P8).
   */
  nomesDosContextosDoTipoDeObjeto(
    tipoDeObjeto: string | readonly string[],
  ): readonly string[];

  /**
   * Se aquele tipo de objeto aceita vinculo naquele contexto —
   * `is_object_in_taxonomy()` (US-1, T003, **CA-1.4**).
   *
   * **Permissao exigida: nenhuma**, e a **recusa e silenciosa**: devolve `false`
   * e quem perguntou segue adiante sem erro, sem mensagem e sem registro, como
   * em `wp-includes/post.php:5053`. O P7 poe esse silencio no contrato.
   */
  contextoAceitaTipoDeObjeto(tipoDeObjeto: string, contexto: string): boolean;

  /**
   * Renomeia o rotulo, e o nome muda em todos os contextos em que ele serve —
   * o caminho do nome de `wp_update_term()` (US-1, T003, **CA-1.2**).
   *
   * **Permissao declarada: a capacidade que o contexto declara em
   * `capacidades.editarRotulos` (`$tax->cap->edit_terms`), e ela nao e
   * verificada aqui** — porque `wp_update_term()` tambem nao a verifica. Quem
   * cobra e a tela (`wp-admin/edit-tags.php:112`) e a API REST, e o nucleo chama
   * a funcao **sem ator** em `register_taxonomy()` e em `wp_set_object_terms()`.
   * Verificar aqui recusaria o que o legado aceita (P1). A cobranca entra com a
   * superficie: CA-4.1 em T009, e a capacidade de criar termo de CA-2.2 em T005.
   *
   * 🔴 **Ha uma divergencia aberta neste criterio**, e ela esta registrada em
   * `rotulo-e-contexto/renomear-rotulo.ts`, nao resolvida: para um rotulo
   * **compartilhado** entre dois contextos, o legado **divide** o rotulo antes
   * de renomear (`_split_shared_term()`) em vez de propagar o nome. As duas
   * leituras coincidem em tudo que uma instalacao nova alcanca.
   */
  renomearRotulo(pedido: PedidoDeRenomeacao): ResultadoDaRenomeacao;
}

/**
 * Compoe o modulo sobre a porta recebida, e registra os oito contextos do
 * nucleo.
 *
 * Substitui, no alvo, o que no legado era `create_initial_taxonomies()`
 * chamada a partir de `wp-settings.php` sobre uma `global`
 * (`wp-includes/taxonomy.php:25`). Trocar a porta e passar outra implementacao
 * aqui — sem alterar arquivo deste modulo, que e o criterio de "substituivel"
 * que `BR-MIGRAR-103` (`EXT-SUBST`) propoe.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework"*, porque a ordem de arranque do legado e contrato
 * publico e framework com ciclo de vida proprio disputa com ela.
 */
export function criarModuloDeClassificacao(
  portas: PortasDeClassificacao,
): ModuloDeClassificacao {
  const contextos = criarRegistroComOsContextosDoNucleo();
  // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
  // sai daqui, que e o que `EXT-ORDEM` cobra e o que `modulo.test.ts` afirma.
  const armazenamento = criarArmazenamentoDeClassificacao(portas.dados);

  /*
   * O escopo das operacoes de US-1 (T003), fechado sobre ESTA composicao e nao
   * sobre o modulo: e o mesmo motivo pelo qual o registro nasce aqui dentro
   * (`EXT-CONTEXTO`, BR-MIGRAR-105, dimensao D-A de `parity_specs.md`). Duas
   * requisicoes concorrentes tem dois escopos, e nenhuma enxerga o contexto que
   * uma extensao registrou na outra.
   *
   * Ele e deliberadamente mais estreito que o modulo: `rotulo-e-contexto/`
   * **nao recebe a juncao** (`vinculos`), porque US-1 nao escreve nela. Ver
   * `rotulo-e-contexto/escopo-de-rotulo-e-contexto.ts`.
   */
  const escopo: EscopoDeRotuloEContexto = { contextos, armazenamento };

  return {
    nome: 'classificacao',
    portas,
    contextos,
    armazenamento,
    obterTermo: (rotuloId, contexto) => obterTermo(escopo, rotuloId, contexto),
    contextosDoTipoDeObjeto: (tipoDeObjeto) =>
      contextosDoTipoDeObjeto(escopo, tipoDeObjeto),
    nomesDosContextosDoTipoDeObjeto: (tipoDeObjeto) =>
      nomesDosContextosDoTipoDeObjeto(escopo, tipoDeObjeto),
    contextoAceitaTipoDeObjeto: (tipoDeObjeto, contexto) =>
      contextoAceitaTipoDeObjeto(escopo, tipoDeObjeto, contexto),
    renomearRotulo: (pedido) => renomearRotulo(escopo, pedido),
  };
}
