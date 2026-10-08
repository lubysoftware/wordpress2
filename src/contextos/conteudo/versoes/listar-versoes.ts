/**
 * A operacao *"listar versoes"* da tabela **Contratos** de `plan.md` — a
 * leitura **com** a declaracao de permissao que o **P4** cobra.
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10). A linha do
 * plano e uma so e cobre as duas operacoes desta pasta:
 *
 * | operacao | entrada | saida | erros |
 * |---|---|---|---|
 * | listar versoes e restaurar | identificador do conteudo, identificador da versao | lista, ou conteudo com o corpo da versao | versao inexistente |
 *
 * Esta e a metade de **listar**; a de **restaurar** e `restaurar-versao.ts`.
 *
 * ---
 *
 * # Por que ela existe separada de `listarVersoes()`
 *
 * `listarVersoes()`, em `leitura-de-versoes.ts`, e `wp_get_post_revisions()`: a
 * funcao do legado, **sem portao**, chamada de nove lugares diferentes do nucleo
 * — inclusive de dentro de `wp_save_post_revision()`, onde nao ha ator. Esta e a
 * **superficie**, e e ela que pergunta a capacidade, exatamente como o
 * controlador REST de versoes faz
 * (`class-wp-rest-revisions-controller.php:180`-`:195`).
 *
 * E a mesma razao pela qual T003 entregou `publicar()` e
 * `transitarParaPublicado()` em vez de uma funcao so: *"a operacao declara a
 * capacidade, a funcao do legado declara que nao tem nenhuma"*.
 *
 * ---
 *
 * # O erro que a tabela *Contratos* nomeia, e o que o legado faz com ele
 *
 * `plan.md` diz *"erros: versao inexistente"*. Nesta metade, o que pode nao
 * existir e o **conteudo**, e o legado nao trata isso como erro:
 * `wp_get_post_revisions()` devolve **lista vazia** para conteudo inexistente
 * (`wp-includes/revision.php:669`), e quem distingue os dois casos e a
 * superficie, nao a leitura. O controlador REST o faz **antes** da capacidade,
 * com `rest_post_invalid_parent` e 404
 * (`class-wp-rest-revisions-controller.php:152`), e e por isso que
 * {@link listarVersoesDoConteudo} tem um desfecho proprio para conteudo
 * inexistente em vez de devolver lista vazia: sem ele, a operacao responderia
 * *"este conteudo nao tem versao"* a quem pediu versoes de um conteudo que nao
 * existe, e essas sao duas respostas diferentes na API do legado.
 *
 * ⚠️ **E o 404 vem antes do 403**, o que e enumeracao de identificador e e
 * comportamento do produto: pela resposta, um ator sem permissao descobre se o
 * conteudo existe. E a mesma postura do **P1** sobre a mensagem de login, que a
 * resposta 6 de `questions.md` manda preservar — *"a mensagem de erro do login
 * continua distinguindo conta inexistente de senha errada, e isso permite
 * enumerar contas"*. Inverter a ordem fecharia o sistema mais que o legado.
 */

import type { Conteudo } from '../armazenamento/index.js';
import type { ContextoDeVersao } from './contexto-de-versao.js';
import { listarVersoes, type OpcoesDaListaDeVersoes } from './leitura-de-versoes.js';
import {
  autorizarLeituraDeVersoes,
  type RecusaDeVersao,
} from './permissao-de-versao.js';

/** De quem se listam as versoes. */
export interface PedidoDeListaDeVersoes {
  readonly conteudoId: number;
  /**
   * As opcoes de `wp_get_post_revisions()`.
   *
   * ⚠️ O controlador REST **nao** informa nenhuma das duas: ele usa os defaults
   * (`class-wp-rest-revisions-controller.php:260`), logo a ordem e decrescente e
   * o versionamento desligado devolve lista vazia. Viajam aqui porque sao
   * superficie publicada da funcao do legado (P8) e porque tres chamadores do
   * nucleo as informam — ver `OpcoesDaListaDeVersoes`.
   */
  readonly opcoes?: OpcoesDaListaDeVersoes;
}

/** O que a operacao devolve. */
export interface ResultadoDaListaDeVersoes {
  readonly desfecho: 'listado' | 'conteudo-inexistente' | 'recusado';
  /** As versoes, na ordem pedida. **Lista vazia e resposta**, nao ausencia. */
  readonly versoes: readonly Conteudo[];
  /** A recusa de capacidade, ou `null`. Preenchida **so** em `recusado`. */
  readonly recusa: RecusaDeVersao | null;
}

/**
 * **A operacao de listar versoes.** Devolve as versoes do conteudo, exigindo a
 * capacidade de **editar** aquele conteudo.
 *
 * **Permissao exigida: `edit_post` do conteudo** — e nao `read_post`
 * (`class-wp-rest-revisions-controller.php:186`). Ver versao de conteudo exige
 * poder edita-lo: o visitante que le o post publicado nao ve o historico dele, e
 * um autor nao ve o historico do conteudo de outra pessoa.
 *
 * Os tres passos, na ordem do controlador do legado:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | o conteudo tem de existir | `:152`-`:168` |
 * | 2 | `edit_post` do conteudo | `:186` |
 * | 3 | `wp_get_post_revisions()` | `:260` |
 *
 * ⚠️ **O passo 1 do legado confere tambem o TIPO do pai** — `$this->parent_post_type
 * !== $parent_post->post_type` (`:164`) —, porque a rota e registrada por tipo
 * de conteudo: pedir versoes de uma pagina pela rota de posts devolve 404. Aqui
 * o tipo nao viaja no pedido porque esta pasta nao conhece roteamento, e
 * declarar o parametro sem a rota que o alimenta inventaria superficie. Fica
 * registrado para quem portar a API REST: a conferencia e **da rota**, nao desta
 * operacao.
 */
export function listarVersoesDoConteudo(
  contexto: ContextoDeVersao,
  pedido: PedidoDeListaDeVersoes,
): ResultadoDaListaDeVersoes {
  // Passo 1 (`:152`): e ANTES da capacidade — ver a nota de enumeracao no
  // cabecalho.
  const conteudo = contexto.armazenamento.conteudo.obterPorId(pedido.conteudoId);
  if (conteudo === null) {
    return { desfecho: 'conteudo-inexistente', versoes: [], recusa: null };
  }

  // Passo 2 (`:186`).
  const recusa = autorizarLeituraDeVersoes(contexto, pedido.conteudoId);
  if (recusa !== null) {
    return { desfecho: 'recusado', versoes: [], recusa };
  }

  // Passo 3 (`:260`): a leitura do legado, que torna a ler o conteudo. Ver a
  // nota de cache no cabecalho de `leitura-de-versoes.ts`.
  return {
    desfecho: 'listado',
    versoes: listarVersoes(contexto, pedido.conteudoId, pedido.opcoes),
    recusa: null,
  };
}
