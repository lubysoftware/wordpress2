/**
 * As quatro colunas `datetime` da gravacao, e a sentinela que US-2 escreve.
 *
 * Entrega de **T005** da feature `002-autoria-e-publicacao`, e e a metade de
 * CA-2.1 que ninguem lembra: **a linha de um rascunho nao e so
 * `post_status = 'draft'`**. Um rascunho gravado pelo caminho de aplicacao sai
 * com `post_date` resolvida para agora, no fuso do site, e
 * `post_date_gmt = '0000-00-00 00:00:00'` — a sentinela —, porque `draft` e um
 * dos tres estados cujo registro declara `date_floating`
 * (`wp-includes/post.php:4779`-`:4784`, e as propriedades estao em
 * `../estado-editorial.ts`). Um porte que gravasse a data GMT real num rascunho
 * produziria uma linha que o legado nunca produz, e `DB-SENT` (BR-MIGRAR-081)
 * poe a sentinela no comportamento observavel.
 *
 * ---
 *
 * # Os quatro passos, na ordem do legado
 *
 * | # | passo | ancora |
 * |---|---|---|
 * | 1 | `wp_resolve_post_date()` resolve `post_date`; sem data valida, a gravacao **nao acontece** | `:4769`-`:4777`, `:5520`-`:5544` |
 * | 2 | `post_date_gmt` e a sentinela quando o estado tem data flutuante, e a conversao de `post_date` quando nao tem | `:4779`-`:4787` |
 * | 3 | `post_modified` e `post_modified_gmt` sao agora na atualizacao, e a data do conteudo na insercao | `:4789`-`:4795` |
 * | 4 | a comparacao de 60 segundos que troca `publish` por `future` e vice-versa | `:4797`-`:4809` — **T013**, nao esta aqui |
 *
 * **O passo 4 esta ausente de proposito e a ausencia e visivel** em `gravar.ts`,
 * na posicao exata do fluxo: ele e US-6 (CA-6.1 e CA-6.2), tem o numero 60 — que
 * o **P6** manda viver num ponto de configuracao nomeado com teste de borda — e
 * usa a porta de relogio, que esta tarefa nao toca. O que ele **le** e o que o
 * passo 2 produz (`$post_date_gmt`), e e por isso que o passo 2 ficou aqui
 * inteiro.
 *
 * ---
 *
 * # 🔴 A sentinela e decisao humana PENDENTE, e esta tarefa nao a toma
 *
 * `BR-HUMANA-003` esta **PENDENTE**: `'0000-00-00 00:00:00'` *"nao e data
 * valida em MySQL com `NO_ZERO_DATE`"*, a fonte a chama de *"a maior
 * incompatibilidade do schema com qualquer banco moderno"*, e a recomendacao do
 * Curator depende de outra decisao pendente (o banco alvo, `BR-HUMANA-002`). As
 * tres opcoes mudam o **valor gravado**, logo mudam o efeito no banco.
 *
 * Esta tarefa segue a premissa que `target_data_model.md` declara e que T002 ja
 * seguiu — manter a cadeia literal — e **nao escolhe nada**: a sentinela e
 * importada de `../armazenamento/conteudo.ts`, onde T002 a declarou com a mesma
 * marca vermelha. Se a decisao vier e for a opcao (a), o marcador explicito
 * substitui a constante **em um lugar so**, e a propria recomendacao do Curator
 * diz o que ele tem de preservar: *"o marcador de data flutuante precisa
 * reproduzir exatamente quais status sao flutuantes, porque isso e o que o
 * legado deduz do sentinela"* — que e {@link ESTADOS_DE_DATA_FLUTUANTE}.
 */

import { DATA_SENTINELA } from '../armazenamento/index.js';
import {
  ESTADOS_EDITORIAIS,
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
} from '../estado-editorial.js';
import type { DatasDoSite, GanchosDaGravacao } from './contexto-de-gravacao.js';
import { vazioComoNoPhp, verdadeiroComoNoPhp } from './verdade-de-php.js';

/**
 * `get_post_stati( array( 'date_floating' => true ) )` (`:4780`) — os estados
 * cuja data *"ainda nao foi escolhida"*.
 *
 * **Derivado, e nao escrito a mao.** Sao os tres que T001 marcou com
 * `dataFlutuante` ao transcrever o registro do legado — `draft`, `pending` e
 * `auto-draft` —, e derivar e o que mantem esta lista e aquele registro em
 * acordo: uma segunda transcricao divergiria da primeira no dia em que alguem
 * acrescentasse um estado de fabrica.
 *
 * ⚠️ **No legado esta lista e aberta**, porque `get_post_stati()` consulta o
 * registro em tempo de execucao e `register_post_status()` aceita
 * `date_floating` de terceiro. Aqui ela cobre o **vocabulario de fabrica**, que e
 * o que `../estado-editorial.ts` declara ser — e e por isso que a comparacao
 * abaixo e sobre `readonly string[]`, nao sobre o tipo fechado: estado de
 * extensao passa, e passa sendo tratado como nao flutuante, que e o default de
 * `register_post_status()` (`:1523`).
 */
export const ESTADOS_DE_DATA_FLUTUANTE: readonly string[] = Object.freeze(
  ESTADOS_EDITORIAIS.filter(
    (estado) => PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].dataFlutuante,
  ),
);

/**
 * `preg_match( '/^(\d{4})-(\d{1,2})-(\d{1,2})/', $post_date, $matches )`
 * (`:5536`).
 *
 * A expressao e a do legado, inclusive nas duas tolerancias que ela tem: ancora
 * so no **inicio** (logo `'2026-10-08 lixo'` casa) e aceita mes e dia com **um**
 * digito (logo `'2026-1-5'` casa). Estreitar qualquer uma das duas recusaria
 * data que o legado aceita.
 */
const PARTES_DA_DATA = /^(\d{4})-(\d{1,2})-(\d{1,2})/;

/** Quantos dias cada mes tem, com fevereiro resolvido por {@link eAnoBissexto}. */
const DIAS_DO_MES: readonly number[] = Object.freeze([
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
]);

/**
 * A regra gregoriana de ano bissexto, como `checkdate()` do PHP a aplica.
 *
 * Divisivel por 4, menos os seculos, mais os multiplos de 400. Escrita aqui
 * porque a funcao equivalente deste runtime nao existe, e porque uma conta
 * aproximada (so `% 4`) aceitaria `2100-02-29`, que o legado recusa.
 */
function eAnoBissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

/**
 * `checkdate( $mes, $dia, $ano )` — o calendario gregoriano do PHP
 * (`wp-includes/functions.php:7530`).
 *
 * Os limites sao os da funcao da linguagem de origem: mes de 1 a 12, ano de 1 a
 * 32767, dia de 1 ao ultimo do mes. O limite do ano importa pouco na pratica e
 * esta aqui porque e dele que sai a recusa de `'0000-00-00 00:00:00'` quando
 * alguem a informa **sem** passar pelo ramo de vazio — mes `00` e dia `00` ja
 * reprovariam, e o ano `0000` tambem.
 */
export function eDataGregorianaValida(
  mes: number,
  dia: number,
  ano: number,
): boolean {
  // `is_numeric()` nos tres, que no legado antecede o `checkdate()` (`:7529`).
  if (
    !Number.isInteger(mes) ||
    !Number.isInteger(dia) ||
    !Number.isInteger(ano)
  ) {
    return false;
  }
  if (ano < 1 || ano > 32767 || mes < 1 || mes > 12) {
    return false;
  }
  const diasDoMes = DIAS_DO_MES[mes - 1];
  if (diasDoMes === undefined) {
    return false;
  }
  const limite = mes === 2 && eAnoBissexto(ano) ? 29 : diasDoMes;
  return dia >= 1 && dia <= limite;
}

/**
 * `wp_resolve_post_date( $post_date, $post_date_gmt )` — `:5520`.
 *
 * Os tres ramos do legado, na ordem:
 *
 * 1. data vazia (ou a sentinela) **e** data GMT vazia (ou a sentinela) → agora,
 *    no fuso do site (`current_time( 'mysql' )`);
 * 2. data vazia e data GMT informada → a data GMT convertida para o fuso do site
 *    (`get_date_from_gmt()`);
 * 3. data informada → ela mesma, intocada.
 *
 * Depois dos tres, a validacao: a expressao de `:5536`, o calendario gregoriano
 * e o filtro `wp_checkdate`. **`false` aqui aborta a gravacao** (`:4771`), e e um
 * dos dois unicos retornos de erro de `wp_insert_post()` que nao vem do banco.
 *
 * ⚠️ **O ramo 2 tem uma consequencia que o docblock do legado explica e que nao
 * se "corrige":** *"For back-compat purposes in wp_insert_post, an empty
 * post_date and an invalid post_date_gmt will continue to return
 * '1970-01-01 00:00:00' rather than false."* Quem implementa
 * {@link DatasDoSite.deUtcParaOFusoDoSite} reproduz isso — `get_date_from_gmt()`
 * devolve a epoca para texto que nao parseia —, e e por isso que a validacao
 * desta funcao **nao** e suficiente para garantir que a data veio de alguem:
 * data GMT lixo grava `1970-01-01`, em vez de recusar.
 */
export function resolverDataDaGravacao(
  datas: DatasDoSite,
  ganchos: GanchosDaGravacao | undefined,
  dataPedida: string | undefined,
  dataGmtPedida: string | undefined,
): string | false {
  let data: string;

  if (vazioComoNoPhp(dataPedida) || dataPedida === DATA_SENTINELA) {
    // Ramos 1 e 2 (`:5522`-`:5528`).
    data =
      vazioComoNoPhp(dataGmtPedida) || dataGmtPedida === DATA_SENTINELA
        ? datas.agoraNoFusoDoSite()
        : datas.deUtcParaOFusoDoSite(dataGmtPedida);
  } else {
    // Ramo 3: o legado nao toca na data informada — nem normaliza, nem completa
    // a hora. O que vier vai para a coluna.
    data = dataPedida;
  }

  // `empty( $matches ) || ! is_array( $matches ) || count( $matches ) < 4`
  // (`:5538`): com tres grupos na expressao, o unico caso alcancavel e o de nao
  // casar — e e por isso que aqui ha uma comparacao so.
  const partes = PARTES_DA_DATA.exec(data);
  if (partes === null) {
    return false;
  }

  // `wp_checkdate( $matches[2], $matches[3], $matches[1], $post_date )`
  // (`:5542`): mes, dia, ano — **nesta** ordem, que nao e a do texto.
  const valida = eDataGregorianaValida(
    Number(partes[2] ?? ''),
    Number(partes[3] ?? ''),
    Number(partes[1] ?? ''),
  );

  const filtro = ganchos?.filtrarDataValida;
  const vereditoFinal = filtro === undefined ? valida : filtro(valida, data);

  // `if ( ! $valid_date ) { return false; }` (`:5544`): a verdade de PHP do que
  // o filtro devolveu, nao um booleano.
  return verdadeiroComoNoPhp(vereditoFinal) ? data : false;
}

/**
 * `post_date_gmt` — a sentinela, ou a conversao (`:4779`-`:4787`).
 *
 * A condicao externa pergunta pelo **pedido**, nao pela data resolvida: data GMT
 * informada e diferente da sentinela vai para a coluna como veio, sem conversao
 * e sem validacao. Dentro, a pergunta e sobre o **estado resolvido**, e e aqui
 * que o rascunho recebe a sentinela — CA-2.1 no plural das colunas.
 */
export function resolverDataGmtDaGravacao(
  datas: DatasDoSite,
  estadoResolvido: string,
  data: string,
  dataGmtPedida: string | undefined,
): string {
  if (
    vazioComoNoPhp(dataGmtPedida) ||
    dataGmtPedida === DATA_SENTINELA
  ) {
    return ESTADOS_DE_DATA_FLUTUANTE.includes(estadoResolvido)
      ? DATA_SENTINELA
      : datas.doFusoDoSiteParaUtc(data);
  }
  return dataGmtPedida;
}

/** As duas colunas de modificacao, que andam sempre juntas. */
export interface ModificacaoDaGravacao {
  readonly modificadoEm: string;
  readonly modificadoEmGmt: string;
}

/**
 * `post_modified` e `post_modified_gmt` (`:4789`-`:4795`).
 *
 * **Atualizacao carimba agora; insercao copia a data do conteudo.** A segunda
 * metade e o que faz um conteudo novo nascer com modificacao igual a criacao, e
 * um rascunho recem-criado nascer com `post_modified_gmt` na **sentinela** — o
 * que, visto de fora, parece defeito e e o que o legado grava.
 *
 * ⚠️ A segunda condicao do `if` (`'0000-00-00 00:00:00' === $post_date`) e
 * **inalcancavel** pelo caminho normal: `wp_resolve_post_date()` ja troca a
 * sentinela por agora antes de chegar aqui. Esta reproduzida porque o legado a
 * tem, porque um interceptador do filtro `wp_checkdate` pode fazer a data
 * sentinela passar, e porque o P1 nao autoriza remover ramo por parecer morto.
 */
export function resolverModificacaoDaGravacao(
  datas: DatasDoSite,
  atualizacao: boolean,
  data: string,
  dataGmt: string,
): ModificacaoDaGravacao {
  if (atualizacao || data === DATA_SENTINELA) {
    return {
      modificadoEm: datas.agoraNoFusoDoSite(),
      modificadoEmGmt: datas.agoraEmUtc(),
    };
  }
  return { modificadoEm: data, modificadoEmGmt: dataGmt };
}
