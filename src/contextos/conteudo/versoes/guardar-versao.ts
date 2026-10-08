/**
 * **CA-10.1** e a poda de **CA-10.2**: guardar a versao a cada gravacao, e
 * descartar o que passa do limite.
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10). Sao quatro
 * funcoes, e nenhuma delas e a mesma coisa que as outras:
 *
 * | funcao | o que e no legado | verifica capacidade? |
 * |---|---|---|
 * | {@link guardarVersaoNaInsercao} | `wp_save_post_revision_on_insert()` (`wp-includes/revision.php:105`) | **nao** |
 * | {@link guardarVersao} | `wp_save_post_revision()` (`:130`) | **nao** |
 * | {@link gravarVersaoDoConteudo} | `_wp_put_post_revision()` (`:359`) | **nao** |
 * | {@link apagarVersao} | `wp_delete_post_revision()` (`:637`) | **nao, e e o achado de CA-10.3** |
 *
 * **Nenhuma das quatro tem portao de capacidade, e as quatro sao assim no
 * legado.** Isso **nao** e a camada de autorizacao esquecida: e o default dela,
 * e o **P4** manda *"preservar o default de cada camada como ele e hoje,
 * inclusive quando o default e permissivo"*. As duas primeiras sao **ouvintes**,
 * disparadas por um ponto de extensao do caminho de gravacao, onde a capacidade
 * ja foi cobrada por quem gravou (`edit_post`, que e T005 e T017); a terceira e
 * funcao privada do nucleo com dois chamadores, um deles o salvamento automatico
 * (T023); e a quarta e o achado de CA-10.3, analisado em
 * `permissao-de-versao.ts`: **a poda apaga versao sem perguntar nada a ninguem,
 * porque pela capacidade ninguem conseguiria apaga-la.**
 *
 * ---
 *
 * # 🔴 A divergencia de redacao de CA-10.1, registrada e nao resolvida
 *
 * CA-10.1 diz *"cada gravacao de conteudo ja existente guarda **a versao
 * anterior**"*. O legado guarda **o texto como ele acabou de ser gravado**, e o
 * docblock da propria funcao e literal: *"the most recent revision always
 * matches the current post"* (`:119`-`:120`). A analise completa, com a tabela do
 * que sobra no banco depois de tres gravacoes, esta no cabecalho de
 * `contexto-de-versao.ts`. O **P1** exige decisao humana registrada para
 * divergir, e nenhuma existe — logo esta tarefa reproduz o legado e **nao
 * escolhe**.
 *
 * ---
 *
 * # As leituras, que sao muitas, e a divergencia de cache que elas carregam
 *
 * O caminho completo de {@link guardarVersao}, com uma poda que apaga uma
 * versao, le a tabela `posts` **sete** vezes:
 *
 * | # | onde | linha |
 * |---|---|---|
 * | 1 | `get_post( $post_id )` | `:139` |
 * | 2 | dentro de `wp_get_post_revisions( $post_id )` | `:163` → `:657` |
 * | 3 | dentro de `_wp_put_post_revision()`, pelo caminho de gravacao | `:372` |
 * | 4 | dentro de `wp_save_revisioned_meta_fields()`, o `get_post_type()` | `:396` |
 * | 5 | dentro de `wp_get_post_revisions( $post_id, ASC )` | `:229` → `:657` |
 * | 6 | dentro de `wp_delete_post_revision()`, o `wp_get_post_revision()` | `:638` |
 * | 7 | dentro de `wp_delete_post()`, pelo caminho de exclusao | feature 005 |
 *
 * **Com o cache de objeto do legado ligado**, 1 consulta e popula, 2 e 4 acertam
 * o cache e 6 acerta o da linha recem-inserida — saem **tres**. **Sem cache**,
 * que e o estado desta arvore, saem as sete. Isso **nao** foi decidido aqui: e a
 * mesma divergencia que T002 e T003 declararam, com REQ-165 fora do pacote e a
 * borda 5 de `target_architecture.md` mandando o cache desligado nas duas
 * metades durante a coexistencia. As leituras estao nos **mesmos pontos** do
 * legado, de modo que o cache, quando existir, entra na frente de cada uma sem
 * mudar o que ela devolve.
 *
 * ---
 *
 * # O que estas funcoes NAO fazem, e de quem e
 *
 * - **Nao gravam linha de `posts` direto.** Criar versao e gravar conteudo:
 *   `_wp_put_post_revision()` chama `wp_insert_post()`, que e **T005**. Chega
 *   por {@link GravacaoNaVersao.inserir}.
 * - **Nao apagam linha de `posts` direto.** `wp_delete_post_revision()` chama
 *   `wp_delete_post()`, que sao as **sete etapas** da **feature 005** (`PT-003`,
 *   `EXT-EXCLUSAO`, BR-MIGRAR-104). Chega por
 *   {@link GravacaoNaVersao.apagar}. Um `DELETE` emitido aqui esconderia
 *   justamente o que o **P5** manda afirmar por teste.
 * - **Nao criam salvamento automatico.** O rascunho automatico passa por
 *   `_wp_put_post_revision( $post_data, true )`
 *   (`wp-admin/includes/post.php:2022`), e e **T023** (US-11). O parametro
 *   `autosave` de {@link gravarVersaoDoConteudo} existe para que T023 reuse esta
 *   funcao em vez de escrever outra.
 * - **Nao emitem ponto de extensao por um barramento.** REQ-162 esta em
 *   `do-not-rewrite.md`. Os pontos deste caminho estao declarados em
 *   `contexto-de-versao.ts`, com nome, argumentos, tipo e posicao.
 */

import type { Conteudo } from '../armazenamento/index.js';
import {
  camposDaVersaoFiltrados,
  camposVersionaveis,
} from './campos-da-versao.js';
import {
  quantasVersoesGuardar,
  versionamentoLigado,
} from './configuracao-de-versoes.js';
import {
  PONTO_DE_CONTEUDO_ATUALIZADO,
  REGISTRO_DE_FABRICA_DA_VERSAO,
  type ContextoDeVersao,
} from './contexto-de-versao.js';
import {
  listarVersoes,
  ultimaVersaoQueNaoEAutomatica,
  versaoPorId,
} from './leitura-de-versoes.js';
import {
  guardarMetadadosVersionados,
  metadadoVersionadoMudou,
} from './metadado-versionado.js';
import { conteudoMudou } from './mudanca-de-versao.js';

/** Um erro de versao, devolvido **como valor** (tabela *Contratos* de `plan.md`). */
export interface ErroDeVersao {
  /** O codigo do `WP_Error` do legado. */
  readonly codigo: string;
  /** O texto do legado, em ingles — a chave do catalogo (`EC-05`). */
  readonly mensagem: string;
}

/** `invalid_post` — o codigo de `_wp_put_post_revision()` sem linha (`:363`). */
export const CODIGO_DE_CONTEUDO_INVALIDO = 'invalid_post';

/** O texto do legado para o codigo acima (`wp-includes/revision.php:363`). */
export const MENSAGEM_DE_CONTEUDO_INVALIDO = 'Invalid post ID.';

/** `post_type` — o codigo da recusa de versionar uma versao (`:367`). */
export const CODIGO_DE_VERSAO_DE_VERSAO = 'post_type';

/**
 * O texto do legado para o codigo acima (`wp-includes/revision.php:367`).
 *
 * ⚠️ **Sem ponto final**, e nao e descuido de transcricao: o legado escreve
 * `__( 'Cannot create a revision of a revision' )`, enquanto o irmao dele na
 * linha acima tem ponto. O `msgid` **e** a chave do catalogo (`EC-05`), logo
 * acrescentar o ponto trocaria a chave e perderia a traducao.
 */
export const MENSAGEM_DE_VERSAO_DE_VERSAO =
  'Cannot create a revision of a revision';

/**
 * O que aconteceu ao pedir que a versao fosse guardada. **Oito desfechos, e
 * sete deles sao `null` no legado.**
 *
 * `wp_save_post_revision()` devolve `null` em sete pontos diferentes e nao
 * distingue nenhum deles para quem chama — e o chamador e um ouvinte de ponto de
 * extensao, que tambem ignora o retorno. O **P7** manda *"preservar o modo de
 * falha, inclusive o silencio"*, e e por isso que estes nomes existem **sem**
 * mensagem: eles tornam cada desvio afirmavel por teste sem inventar superficie
 * que o legado nao tem.
 */
export type DesfechoDeGuardarVersao =
  /** A versao foi gravada. */
  | 'guardada'
  /** `DOING_AUTOSAVE` esta definida: salvamento automatico em curso (`:131`). */
  | 'salvamento-automatico-em-curso'
  /** A guarda cruzada do par de ouvintes adiou para o outro (`:136`, `:112`). */
  | 'adiada-para-o-outro-ouvinte'
  /** `get_post()` nao achou a linha (`:141`). */
  | 'inexistente'
  /** O tipo nao declara suporte a `revisions` (`:148`). */
  | 'tipo-sem-suporte'
  /** O conteudo esta em rascunho automatico (`:152`). */
  | 'rascunho-automatico'
  /** `WP_POST_REVISIONS` resolveu em zero (`:154`). */
  | 'versionamento-desligado'
  /** Nenhum campo versionavel mudou desde a ultima versao (`:211`). */
  | 'sem-mudanca'
  /** `_wp_put_post_revision()` devolveu erro (`:217`). */
  | 'recusada';

/** O que guardar uma versao devolve. */
export interface ResultadoDeGuardarVersao {
  readonly desfecho: DesfechoDeGuardarVersao;
  /** O identificador da versao criada, ou `null`. */
  readonly versaoId: number | null;
  /** O erro de {@link gravarVersaoDoConteudo}, ou `null`. */
  readonly erro: ErroDeVersao | null;
  /**
   * **CA-10.2**: os identificadores das versoes que a poda apagou, na ordem.
   *
   * **O legado nao devolve isto a ninguem**: a poda corre depois de `$return` ja
   * estar decidido, e o valor dela e descartado (`wp-includes/revision.php:217`
   * e `:260`). Entra aqui pela mesma razao que o retorno de `limparGancho()`
   * entrou no resultado de T003 — para que o criterio seja **afirmavel por
   * teste** —, e **nenhum ramo do fluxo o consulta** (P7). Lista vazia e
   * afirmacao, nao ausencia.
   */
  readonly versoesApagadas: readonly number[];
  /**
   * As chaves de metadado versionado copiadas para a versao, na ordem.
   *
   * Mesma regra do campo de cima: efeito do ouvinte de fabrica
   * `wp_save_revisioned_meta_fields`, exposto para ser afirmavel e consultado
   * por ramo nenhum.
   */
  readonly metadadosCopiados: readonly string[];
}

const SEM_VERSAO = {
  versaoId: null,
  erro: null,
  versoesApagadas: [],
  metadadosCopiados: [],
} as const;

/**
 * `wp_save_post_revision_on_insert( $post_id, $post, $update )` — **ouvinte de
 * fabrica do ponto `wp_after_insert_post`, prioridade 9**
 * (`wp-includes/revision.php:105`-`:117`, `default-filters.php:445`).
 *
 * **E aqui que a instalacao de fabrica versiona**, e nao em `post_updated`: ver
 * `OUVINTES_DE_FABRICA_DA_VERSAO`, em `contexto-de-versao.ts`, para a guarda
 * cruzada do par e para a razao da mudanca de 6.4.0 (*"after all changes have
 * been made"*).
 *
 * As duas guardas, na ordem:
 *
 * 1. **`! $update` desiste** (`:106`). E esta a linha que faz **CA-10.1** valer
 *    so para *"conteudo ja existente"*: criar conteudo **nao** cria versao. Um
 *    porte que versionasse na insercao produziria, no primeiro `INSERT`, uma
 *    versao que o legado nao tem;
 * 2. **o outro ouvinte do par tem de estar registrado** (`:112`). O `if (
 *    ! has_action( 'post_updated', 'wp_save_post_revision' ) ) { return; }` e
 *    contraintuitivo e e deliberado: quem tirou `wp_save_post_revision` de
 *    `post_updated` desligou o versionamento, e este ouvinte respeita a decisao
 *    em vez de contorna-la.
 *
 * O terceiro argumento do ponto (`$post`) nao viaja: este ouvinte nao o le — ele
 * chama `wp_save_post_revision( $post_id )`, que le a linha de novo.
 */
export function guardarVersaoNaInsercao(
  contexto: ContextoDeVersao,
  conteudoId: number,
  atualizacao: boolean,
): ResultadoDeGuardarVersao {
  // Guarda 1 (`:106`): o `$update` falso e a insercao, e insercao nao versiona.
  if (!atualizacao) {
    return { desfecho: 'adiada-para-o-outro-ouvinte', ...SEM_VERSAO };
  }

  // Guarda 2 (`:112`).
  const registro = contexto.registro ?? REGISTRO_DE_FABRICA_DA_VERSAO;
  if (!registro.ouvinteDeAtualizacao) {
    return { desfecho: 'adiada-para-o-outro-ouvinte', ...SEM_VERSAO };
  }

  return guardarVersao(contexto, conteudoId);
}

/**
 * `wp_save_post_revision( $post_id )` — **CA-10.1**, e a poda de **CA-10.2**
 * (`wp-includes/revision.php:130`-`:262`).
 *
 * E tambem **ouvinte de fabrica do ponto `post_updated`, prioridade 10**
 * (`default-filters.php:446`), e nessa posicao ela normalmente nao faz nada: ver
 * a guarda 2.
 *
 * Os onze passos, na ordem do legado — e a ordem e a regra duas vezes, nos
 * passos 2 e 10:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | `DOING_AUTOSAVE` desiste | `:131` |
 * | 2 | a guarda cruzada do par de ouvintes | `:136` |
 * | 3 | ler o conteudo; sem linha, desiste | `:139`-`:143` |
 * | 4 | o tipo tem de suportar `revisions` | `:148` |
 * | 5 | rascunho automatico nao versiona | `:152` |
 * | 6 | versionamento desligado nao versiona | `:154` |
 * | 7 | listar as versoes, decrescente | `:163` |
 * | 8 | achar a ultima que **nao** e salvamento automatico | `:165`-`:169` |
 * | 9 | comparar, e desistir se nada mudou | `:186`-`:213` |
 * | 10 | gravar a versao | `:217` |
 * | 11 | a poda do que passa do limite | `:223`-`:260` |
 */
export function guardarVersao(
  contexto: ContextoDeVersao,
  conteudoId: number,
): ResultadoDeGuardarVersao {
  // Passo 1 (`:131`): durante salvamento automatico, nenhuma versao comum.
  if (contexto.salvamentoAutomaticoEmCurso === true) {
    return { desfecho: 'salvamento-automatico-em-curso', ...SEM_VERSAO };
  }

  // Passo 2 (`:136`): os DOIS termos, e o `&&` e o que importa. Chamada direta,
  // fora do ponto `post_updated`, passa mesmo com o par inteiro registrado — e e
  // assim que `_wp_upgrade_revisions_of_post()` (`:1100`) e o changeset do
  // customizador (`wp-includes/theme.php:2160`) versionam.
  const registro = contexto.registro ?? REGISTRO_DE_FABRICA_DA_VERSAO;
  if (
    contexto.pontoEmCurso === PONTO_DE_CONTEUDO_ATUALIZADO &&
    registro.ouvinteDeInsercao
  ) {
    return { desfecho: 'adiada-para-o-outro-ouvinte', ...SEM_VERSAO };
  }

  // Passo 3 (`:139`): a leitura 1 de sete. Ver a nota de cache no cabecalho.
  const conteudo = contexto.armazenamento.conteudo.obterPorId(conteudoId);
  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_VERSAO };
  }

  // Passo 4 (`:148`).
  if (!contexto.suportaVersao(conteudo.tipo)) {
    return { desfecho: 'tipo-sem-suporte', ...SEM_VERSAO };
  }

  // Passo 5 (`:152`): o rascunho automatico e o registro que o editor reserva
  // antes da primeira digitacao (US-11), e versiona-lo guardaria o vazio.
  if (conteudo.estado === ESTADO_DE_RASCUNHO_AUTOMATICO) {
    return { desfecho: 'rascunho-automatico', ...SEM_VERSAO };
  }

  // Passo 6 (`:154`): CA-10.2 na borda do zero (UT-029-6).
  if (!versionamentoLigado(contexto, conteudo)) {
    return { desfecho: 'versionamento-desligado', ...SEM_VERSAO };
  }

  // Passos 7 a 9 (`:163`-`:213`): a comparacao so acontece quando ja existe
  // versao comum. **Sem versao nenhuma, grava sempre** — e o comentario do
  // legado diz isso em uma linha: *"If no previous revisions, save one."*
  const versoes = listarVersoes(contexto, conteudo.id);
  const ultimaVersao = ultimaVersaoQueNaoEAutomatica(versoes);
  if (ultimaVersao !== null && !mudouDesdeAUltimaVersao(contexto, conteudo, ultimaVersao)) {
    return { desfecho: 'sem-mudanca', ...SEM_VERSAO };
  }

  // Passo 10 (`:217`).
  const gravacao = gravarVersaoDoConteudo(contexto, conteudo);
  if (!gravacao.ok) {
    return {
      desfecho: 'recusada',
      ...SEM_VERSAO,
      erro: { codigo: gravacao.codigo, mensagem: gravacao.mensagem },
    };
  }

  // Passo 11 (`:223`): a poda. Corre DEPOIS da gravacao, logo a versao
  // recem-criada conta no total — e e por isso que um limite de 3 deixa 3 e nao
  // 4 depois da quarta gravacao.
  const versoesApagadas = podarVersoes(contexto, conteudo);

  return {
    desfecho: 'guardada',
    versaoId: gravacao.id,
    erro: null,
    versoesApagadas,
    metadadosCopiados: gravacao.metadadosCopiados,
  };
}

/**
 * `auto-draft` — o estado que o passo 5 recusa.
 *
 * Declarado aqui, e nao importado de `../estado-editorial.ts`, pela mesma razao
 * que `ESTADO_PUBLICADO` esta em `../publicacao/transicao-de-estado.ts`: e o
 * valor que **esta** regra compara, e o vocabulario de T001 descreve o registro
 * de estados, nao o dominio da comparacao.
 */
const ESTADO_DE_RASCUNHO_AUTOMATICO = 'auto-draft';

/**
 * Os passos 8 e 9 de {@link guardarVersao}, juntos: se vale a pena gravar.
 *
 * `wp_save_post_revision_check_for_changes` (`:186`) decide se a comparacao
 * **acontece**; dando falso, o legado grava versao sem comparar nada — *"so a
 * revision is saved even if nothing has changed"*.
 *
 * A cadeia de `wp_save_post_revision_post_has_changed` tem **duas** posicoes, e
 * a ordem delas e o que `OUVINTES_DE_FABRICA_DA_VERSAO` declara: primeiro o
 * ouvinte do nucleo, `wp_check_revisioned_meta_fields_have_changed()` em
 * prioridade 10, e depois o interceptador de terceiro, que `add_filter` sem
 * prioridade tambem poe em 10 e que portanto corre atras. Um interceptador que
 * rodasse antes veria a resposta sem o metadado versionado.
 */
function mudouDesdeAUltimaVersao(
  contexto: ContextoDeVersao,
  conteudo: Conteudo,
  ultimaVersao: Conteudo,
): boolean {
  // `:186`: o ponto que decide se a comparacao acontece.
  const conferir =
    contexto.ganchos?.filtrarConferirMudanca?.(true, ultimaVersao, conteudo) ??
    true;
  if (!conferir) {
    return true;
  }

  // `:189`-`:196`: os campos versionaveis, um a um, com normalizacao.
  let mudou = conteudoMudou(contexto, conteudo, ultimaVersao);

  // `:208`, posicao 1: o ouvinte do nucleo, prioridade 10.
  mudou = metadadoVersionadoMudou(contexto, mudou, ultimaVersao, conteudo);

  // `:208`, posicao 2: o interceptador de terceiro. O `(bool)` do legado e o
  // tipo do retorno declarado em `GanchosDaVersao.filtrarConteudoMudou`.
  return (
    contexto.ganchos?.filtrarConteudoMudou?.(mudou, ultimaVersao, conteudo) ??
    mudou
  );
}

/** O que {@link gravarVersaoDoConteudo} devolve. */
export type ResultadoDaGravacaoDeVersao =
  | {
      readonly ok: true;
      readonly id: number;
      /** As chaves que o ouvinte do nucleo copiou para a versao. */
      readonly metadadosCopiados: readonly string[];
    }
  | { readonly ok: false; readonly codigo: string; readonly mensagem: string };

/**
 * `_wp_put_post_revision( $post, $autosave )` — a linha da versao
 * (`wp-includes/revision.php:359`-`:391`).
 *
 * Os cinco passos, na ordem do legado:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | sem linha, ou com `ID` vazio: erro `invalid_post` | `:361`-`:363` |
 * | 2 | linha de tipo `revision`: erro `post_type` | `:365`-`:367` |
 * | 3 | montar os campos da versao | `:370` |
 * | 4 | `wp_insert_post( $post, true )` | `:372` |
 * | 5 | com identificador, disparar o ponto `_wp_put_post_revision` | `:381`-`:388` |
 *
 * ⚠️ **A ordem dos passos 1 e 2 e observavel**: um pedido para versionar uma
 * linha que **nao existe** devolve `invalid_post`, e um para versionar uma
 * **versao** devolve `post_type`. Invertendo, uma versao inexistente devolveria
 * o codigo errado — e sao dois codigos de erro publicos, que o endpoint de
 * salvamento automatico repassa (`class-wp-rest-autosaves-controller.php:434`).
 *
 * ⚠️ **O passo 2 e a metade de CA-10.3 que diz que a versao nao e editavel pelo
 * caminho de gravacao de versao**: nao existe versao de versao, e a tentativa e
 * recusada com texto. A outra metade — nao haver superficie que escreva na linha
 * de uma versao — esta em `permissao-de-versao.ts`.
 *
 * O passo 5 so dispara **quando o identificador e verdadeiro** (`:381`): a
 * insercao que devolve `0` nao dispara o ponto, e portanto nao copia metadado
 * versionado. Silencio do legado, preservado (P7).
 */
export function gravarVersaoDoConteudo(
  contexto: ContextoDeVersao,
  original: Conteudo,
  autosave = false,
): ResultadoDaGravacaoDeVersao {
  // Passo 1 (`:361`): o `empty( $post['ID'] )` e um teste de valor verdadeiro,
  // logo `ID = 0` tambem cai aqui.
  if (original.id === 0) {
    return {
      ok: false,
      codigo: CODIGO_DE_CONTEUDO_INVALIDO,
      mensagem: MENSAGEM_DE_CONTEUDO_INVALIDO,
    };
  }

  // Passo 2 (`:365`).
  if (original.tipo === TIPO_DA_VERSAO) {
    return {
      ok: false,
      codigo: CODIGO_DE_VERSAO_DE_VERSAO,
      mensagem: MENSAGEM_DE_VERSAO_DE_VERSAO,
    };
  }

  // Passo 3 (`:370`). O `wp_slash()` da linha seguinte do legado nao viaja:
  // escapar e da camada de dados, e a porta parametrizada nao concatena cadeia.
  const campos = camposDaVersaoFiltrados(
    original,
    camposVersionaveis(contexto, original),
    autosave,
  );

  // Passo 4 (`:372`): e **gravacao de conteudo**, com todos os pontos de
  // extensao do caminho de gravacao disparando para a linha da versao.
  const insercao = contexto.gravacao.inserir(campos);
  if (!insercao.ok) {
    return { ok: false, codigo: insercao.codigo, mensagem: insercao.mensagem };
  }

  // Passo 5 (`:381`): `if ( $revision_id )`.
  //
  // ⚠️ **Este ramo e inalcancavel pelo chamador do legado, e existe porque o
  // `if` do legado existe.** `_wp_put_post_revision()` chama `wp_insert_post(
  // $post, true )`, e com `$wp_error = true` a funcao devolve `WP_Error` em vez
  // de `0` em todo caminho de falha — logo o `0` que o retorno documenta (*"0 if
  // error"*) so chega a quem a chame com `$wp_error` falso. Retirar o `if` daria
  // uma versao de identificador `0` ao ponto de extensao e ao ouvinte do
  // metadado, e o P2 poe o argumento do ponto no contrato publico.
  if (insercao.id === 0) {
    return { ok: true, id: 0, metadadosCopiados: [] };
  }

  // O ouvinte do nucleo, prioridade 10, antes do interceptador de terceiro.
  const metadadosCopiados = guardarMetadadosVersionados(
    contexto,
    insercao.id,
    original.id,
  );
  contexto.ganchos?.aoGuardarVersao?.(insercao.id, original.id);

  return { ok: true, id: insercao.id, metadadosCopiados };
}

/**
 * `revision` — o tipo que o passo 2 de {@link gravarVersaoDoConteudo} recusa.
 *
 * Mesma razao de {@link ESTADO_DE_RASCUNHO_AUTOMATICO} para nao vir do
 * vocabulario: e o valor que **esta** comparacao compara. O nome canonico da
 * coluna esta em `TIPO_DE_VERSAO`, em `../armazenamento/vinculo-com-o-pai.ts`, e
 * os dois sao a mesma cadeia — afirmado por teste.
 */
const TIPO_DA_VERSAO = 'revision';

/**
 * A poda de **CA-10.2** — *"If a limit for the number of revisions to keep has
 * been set, delete the oldest ones"* (`wp-includes/revision.php:219`-`:260`).
 *
 * Os seis passos:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | quantas guardar; **negativo desiste antes de consultar** | `:223`-`:227` |
 * | 2 | listar as versoes em ordem **crescente** | `:229` |
 * | 3 | o ponto `wp_save_post_revision_revisions_before_deletion` | `:240` |
 * | 4 | quantas sobram do limite; menos de uma desiste | `:245`-`:248` |
 * | 5 | cortar as `$delete` primeiras da lista | `:250` |
 * | 6 | apagar, **pulando salvamento automatico** | `:252`-`:259` |
 *
 * ⚠️ **O passo 1 e o que torna `-1` literalmente ilimitado** em vez de muito
 * grande: com limite negativo, a segunda consulta **nao sai**. E e o estado de
 * fabrica, porque `WP_POST_REVISIONS` e `true` — ou seja, numa instalacao sem
 * configuracao, a poda nunca consulta o banco.
 *
 * ⚠️ **O passo 6 guarda mais do que o limite quando ha salvamento automatico
 * entre as mais antigas**, e isso e do legado, nao defeito deste porte: o
 * `count( $revisions )` do passo 4 conta a linha de salvamento automatico, e o
 * `str_contains( ..., 'autosave' )` do passo 6 a **pula** em vez de apagar outra
 * no lugar dela. Com limite 2, tres versoes comuns e um salvamento automatico
 * mais antigo, `$delete` e 2 e so **uma** versao comum sai. Um porte que
 * filtrasse o salvamento automatico antes de contar apagaria uma versao a mais.
 *
 * ⚠️ **E o teste do passo 6 e a cadeia nua `'autosave'`**, nao
 * `"{$pai}-autosave"` como em `wp_is_post_autosave()`: e um teste **diferente**,
 * mais largo, e o legado usa os dois no mesmo arquivo. Unifica-los mudaria quais
 * linhas a poda pula.
 */
function podarVersoes(
  contexto: ContextoDeVersao,
  conteudo: Conteudo,
): readonly number[] {
  // Passo 1 (`:223`): e o `< 0`, nao o `<= 0` — a comparacao e a do legado, e
  // nao a igualdade com `VERSOES_ILIMITADAS`: um filtro que devolva `-7` tambem
  // desiste aqui, e limite `0` NAO desiste (ele apaga tudo), que e o que a
  // guarda de `versionamentoLigado` no passo 6 de `guardarVersao` ja impediu.
  const quantasGuardar = quantasVersoesGuardar(contexto, conteudo);
  if (quantasGuardar < 0) {
    return [];
  }

  // Passo 2 (`:229`): CRESCENTE. Ver `OrdemDasVersoes`, em
  // `../armazenamento/versao.ts`.
  let versoes = listarVersoes(contexto, conteudo.id, { ordem: 'asc' });

  // Passo 3 (`:240`).
  versoes =
    contexto.ganchos?.filtrarVersoesAntesDaExclusao?.(versoes, conteudo.id) ??
    versoes;

  // Passo 4 (`:245`).
  const quantasApagar = versoes.length - quantasGuardar;
  if (quantasApagar < 1) {
    return [];
  }

  // Passos 5 e 6 (`:250`-`:259`).
  const apagadas: number[] = [];
  for (const versao of versoes.slice(0, quantasApagar)) {
    if (versao.identificadorNaUrl.includes(MARCA_DE_SALVAMENTO_AUTOMATICO)) {
      continue;
    }
    if (apagarVersao(contexto, versao.id)) {
      apagadas.push(versao.id);
    }
  }
  return apagadas;
}

/**
 * `autosave` — a marca **nua** que a poda procura no identificador na URL
 * (`wp-includes/revision.php:253`).
 *
 * Declarada como constante porque ela e **mais larga** que a de
 * `wp_is_post_autosave()`, que monta `"{$pai}-autosave"`
 * (`../armazenamento/versao.ts`, `eSalvamentoAutomatico`). As duas convivem no
 * mesmo arquivo do legado e nao se substituem: esta pula toda linha cujo nome
 * **contenha** a palavra, inclusive a de um pai diferente.
 */
const MARCA_DE_SALVAMENTO_AUTOMATICO = 'autosave';

/**
 * `wp_delete_post_revision( $revision )` — apagar uma versao
 * (`wp-includes/revision.php:637`-`:653`).
 *
 * Os tres passos:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | `wp_get_post_revision()`: a linha tem de ser de versao | `:638` |
 * | 2 | `wp_delete_post( $revision->ID )` — a exclusao da **feature 005** | `:642` |
 * | 3 | com exclusao feita, o ponto `wp_delete_post_revision` | `:644`-`:650` |
 *
 * ⚠️ **Nao ha portao de capacidade aqui, e e esse o achado de CA-10.3.** Pela
 * capacidade, `delete_post` sobre uma versao devolve `do_not_allow` **para todo
 * mundo, inclusive o super administrador** (`capabilities.php:108`,
 * `PERM-5`/BR-MIGRAR-091) — logo nenhuma superficie consegue apagar versao
 * pedindo permissao. A poda apaga **sem pedir**, porque ela nao e superficie: e
 * o nucleo arrumando a propria casa. As duas coisas valem ao mesmo tempo, e
 * estao afirmadas por teste em `permissao-de-versao.ts`.
 *
 * O passo 1 **e uma releitura**: a poda tem a linha em maos e passa o
 * identificador, como o legado passa. Ver a nota de cache no cabecalho.
 */
export function apagarVersao(
  contexto: ContextoDeVersao,
  versaoId: number,
): boolean {
  // Passo 1 (`:638`).
  const versao = versaoPorId(contexto, versaoId);
  if (versao === null) {
    return false;
  }

  // Passo 2 (`:642`): a linha nao e apagada aqui. `wp_delete_post()` sao sete
  // etapas em quatro tabelas, e o P5 cobra o conjunto exato do que fica orfao.
  const apagou = contexto.gravacao.apagar(versao.id);

  // Passo 3 (`:644`): so com exclusao feita.
  if (apagou) {
    contexto.ganchos?.aoApagarVersao?.(versao.id, versao);
  }
  return apagou;
}
