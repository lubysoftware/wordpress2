/**
 * Quais campos entram na versao, e com que valores — `_wp_post_revision_fields()`
 * e `_wp_post_revision_data()` (`wp-includes/revision.php:22` e `:75`).
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10). T002 ja
 * declarou os **tres** campos de fabrica, os **nove** nomes protegidos e a
 * forma da linha (`../armazenamento/versao.ts`); o que entra aqui e a parte que
 * e **regra de fluxo** e nao forma de armazenamento: o ponto de extensao que
 * muda a lista, a ordem em que ele corre contra a remocao dos nove, e a copia.
 *
 * ---
 *
 * # A coincidencia que nao e coincidencia: os nove sao os seis mais tres
 *
 * `_wp_post_revision_data()` copia os campos filtrados e **depois** fixa seis
 * chaves (`:88`-`:93`): `post_parent`, `post_status`, `post_type`, `post_name`,
 * `post_date` e `post_date_gmt`. Os nove nomes que `_wp_post_revision_fields()`
 * remove da lista sao **exatamente** esses seis mais `ID`, `comment_count` e
 * `post_author`.
 *
 * Isto e, nenhum dos seis pode ser versionado justamente porque a versao os usa
 * para **se identificar**: o pai e o vinculo, o estado e o herdado, o tipo e o
 * discriminador, o nome e a convencao `-revision-v1`, e as duas datas carregam o
 * `post_modified` do original (e e por isso que a lista de versoes ordenada por
 * `post_date` sai na ordem das modificacoes do conteudo). Os outros tres sao os
 * que `wp_insert_post()` resolve sozinho: o `ID` e gerado, `comment_count` nao e
 * gravavel, e `post_author` cai no default `get_current_user_id()` — **a
 * armadilha** que faz a versao ficar com o autor de quem a gravou, analisada no
 * cabecalho de `../armazenamento/versao.ts`.
 *
 * Um porte que removesse a remocao dos nove — por parecer redundante com os seis
 * fixos — deixaria `ID`, `comment_count` e `post_author` versionaveis por
 * extensao, e a primeira coisa que uma extensao faria com isso e versionar o
 * autor, o que mudaria quem a tela de versoes diz que fez cada alteracao.
 */

import {
  COLUNAS_NAO_VERSIONAVEIS,
  ESTADO_DE_VERSAO,
  TIPO_DE_VERSAO,
  campoDaColuna,
  nomeDaVersao,
  type CamposDeConteudo,
  type Conteudo,
  type ConteudoGravavel,
} from '../armazenamento/index.js';
import type { CampoVersionavel, ContextoDeVersao } from './contexto-de-versao.js';

/**
 * Os **tres** campos de fabrica, com o nome de coluna e o rotulo do legado, na
 * ordem em que ele os declara (`wp-includes/revision.php:31`-`:34`).
 *
 * Os rotulos vao em ingles pela regra de `EC-05`, a mesma de
 * `../publicacao/permissao-de-publicacao.ts`: *"o `msgid` em ingles E a chave do
 * catalogo"*, logo traduzir aqui trocaria a chave.
 *
 * A lista **em nomes de dominio** esta em `CAMPOS_VERSIONAVEIS`, em
 * `../armazenamento/versao.ts`, e as duas sao a mesma coisa vista dos dois
 * lados: aqui, o nome pelo qual a **extensao** declara o campo; la, o nome pelo
 * qual o **armazenamento** o grava. Que as duas descrevam o **mesmo** conjunto,
 * coluna por campo, e afirmado por teste — para que acrescentar campo em uma e
 * esquecer a outra quebre a suite em vez de passar.
 */
export const CAMPOS_VERSIONAVEIS_DE_FABRICA: readonly CampoVersionavel[] =
  Object.freeze([
    Object.freeze({ coluna: 'post_title', rotulo: 'Title' }),
    Object.freeze({ coluna: 'post_content', rotulo: 'Content' }),
    Object.freeze({ coluna: 'post_excerpt', rotulo: 'Excerpt' }),
  ]);

/**
 * `_wp_post_revision_fields( $post )` — a lista de campos versionaveis
 * (`wp-includes/revision.php:22`-`:60`).
 *
 * Os dois passos, e a **ordem entre eles e a regra**:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | o ponto de extensao `_wp_post_revision_fields` sobre a lista de fabrica | `:54` |
 * | 2 | a remocao dos **nove** nomes protegidos, **depois** do ponto | `:56`-`:58` |
 *
 * E por o passo 2 vir depois que o ponto de extensao e **poderoso e limitado ao
 * mesmo tempo**: ele pode acrescentar qualquer coluna de `posts` e pode remover
 * qualquer uma das tres de fabrica, mas **nao consegue** versionar nenhum dos
 * nove, por mais explicitamente que os declare. Essa assimetria e contrato
 * publico (P2) e esta afirmada por teste.
 *
 * A deduplicacao existe porque no PHP a lista e um **arranjo associativo** e a
 * chave e unica: um interceptador que devolvesse a mesma coluna duas vezes
 * produziria, no legado, uma entrada so. Fica a primeira posicao, que e a que o
 * PHP mantem — e o rotulo nao decide nada neste caminho, logo a diferenca entre
 * manter o primeiro e o ultimo rotulo nao e observavel aqui.
 */
export function camposVersionaveis(
  contexto: ContextoDeVersao,
  conteudo: Conteudo,
): readonly CampoVersionavel[] {
  // Passo 1 (`:54`).
  const filtrados =
    contexto.ganchos?.filtrarCamposVersionaveis?.(
      CAMPOS_VERSIONAVEIS_DE_FABRICA,
      conteudo,
    ) ?? CAMPOS_VERSIONAVEIS_DE_FABRICA;

  // Passo 2 (`:56`): e DEPOIS do ponto, de proposito.
  const vistos = new Set<string>();
  const resultado: CampoVersionavel[] = [];
  for (const campo of filtrados) {
    if (COLUNAS_NAO_VERSIONAVEIS.includes(campo.coluna) || vistos.has(campo.coluna)) {
      continue;
    }
    vistos.add(campo.coluna);
    resultado.push(campo);
  }
  return resultado;
}

/**
 * `_wp_post_revision_data( $post, $autosave )` — a linha da versao, com os
 * campos filtrados copiados e as seis chaves fixas
 * (`wp-includes/revision.php:75`-`:95`).
 *
 * Devolve {@link CamposDeConteudo} — **parcial de proposito**, e nao a
 * `CamposDaVersao` de T002 — porque o legado devolve **nove chaves de 21** e
 * porque o ponto de extensao pode tirar uma das tres: um interceptador que
 * remova `post_content` da lista faz o legado **nao** copiar o corpo, e a coluna
 * recebe o default de `wp_insert_post()`, nao o corpo do original. Um tipo com
 * os tres campos obrigatorios nao conseguiria representar isso.
 *
 * ⚠️ **O `array_intersect` nao e simetria: ele descarta nome que nao e coluna da
 * linha** (`:84`). Um interceptador que declare `campo_inventado` o ve na lista
 * de {@link camposVersionaveis} e **nao** o ve na linha gravada, porque
 * `array_intersect( array_keys( $post ), ... )` o deixa de fora — e e isso que
 * {@link campoDaColuna} devolvendo `null` reproduz.
 *
 * A **ordem** da copia segue, no legado, a ordem das colunas da linha lida (e a
 * do primeiro arranjo do `array_intersect`), e nao a do interceptador. Ela nao
 * chega ao comando: quem monta o `INSERT` e `wp_insert_post()`, com o
 * `compact()` dele, e o repositorio de T002 reproduz essa ordem em
 * `COLUNAS_GRAVAVEIS`. Fica registrado porque e a pergunta que um porte faz ao
 * ler o `array_intersect` e nao achar resposta no codigo.
 */
export function camposDaVersaoFiltrados(
  original: Conteudo,
  campos: readonly CampoVersionavel[],
  autosave = false,
): CamposDeConteudo {
  const copiados: {
    -readonly [Campo in keyof ConteudoGravavel]?: ConteudoGravavel[Campo];
  } = {};

  for (const { coluna } of campos) {
    const campo = campoDaColuna(coluna);
    if (campo === null) {
      // `array_intersect`: nome que nao e coluna gravavel nao chega a linha.
      continue;
    }
    // A chave e dinamica, e `Object.assign` e o unico caminho que o `tsc` aceita
    // sem converter o tipo a mao: o valor vem da MESMA coluna do mesmo registro,
    // logo o par chave-valor e correto por construcao.
    Object.assign(copiados, { [campo]: original[campo] });
  }

  return {
    ...copiados,
    // As seis chaves fixas (`:88`-`:93`), **depois** da copia. Nao ha conflito
    // possivel: as seis estao entre os nove que o passo 2 de
    // `camposVersionaveis` removeu.
    vinculo: { tipo: 'original-da-versao', id: original.id },
    estado: ESTADO_DE_VERSAO,
    tipo: TIPO_DE_VERSAO,
    identificadorNaUrl: nomeDaVersao(original.id, autosave),
    /** `post_date` = o `post_modified` do original, e nao a hora corrente. */
    data: original.modificadoEm,
    dataGmt: original.modificadoEmGmt,
  };
}

/**
 * Os campos que a **restauracao** escreve de volta no conteudo — o `$update` de
 * `wp_restore_post_revision()` (`wp-includes/revision.php:488`-`:496`).
 *
 * E o espelho de {@link camposDaVersaoFiltrados}, com **duas** diferencas que
 * decidem:
 *
 * 1. **nenhuma das seis chaves fixas volta.** A restauracao escreve so os campos
 *    versionaveis mais o `ID`, logo o estado, o tipo, o nome na URL e as datas
 *    do **conteudo** ficam como estao. Um porte que devolvesse a linha inteira
 *    da versao poria o conteudo em `inherit`, com tipo `revision` — e o tiraria
 *    do ar;
 * 2. **o alvo e o pai.** `$update['ID'] = $revision['post_parent']` (`:496`): a
 *    versao nunca e escrita, e e dai que sai a metade de **CA-10.3** que diz que
 *    *"uma versao nao e editavel"*.
 *
 * O `array_intersect` do legado e sobre as chaves da **versao**, nao sobre as do
 * conteudo (`:488`), e a diferenca aparece quando um interceptador acrescenta
 * coluna: so o que a linha da versao tem e que volta.
 *
 * Devolve lista vazia de campos como `{}`, e e quem chama que transforma isso no
 * `false` do legado (`:493`) — ver `restaurar-versao.ts`.
 */
export function camposDaRestauracao(
  versao: Conteudo,
  campos: readonly CampoVersionavel[],
): CamposDeConteudo {
  const atualizacao: {
    -readonly [Campo in keyof ConteudoGravavel]?: ConteudoGravavel[Campo];
  } = {};

  for (const { coluna } of campos) {
    const campo = campoDaColuna(coluna);
    if (campo === null) {
      continue;
    }
    Object.assign(atualizacao, { [campo]: versao[campo] });
  }
  return atualizacao;
}
