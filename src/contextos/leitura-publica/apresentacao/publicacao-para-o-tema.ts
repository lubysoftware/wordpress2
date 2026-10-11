/**
 * A etapa 5 do atendimento — `WP::register_globals()`
 * (`wp-includes/class-wp.php:662-683`), *"publica o resultado para o tema"*.
 *
 * Entrega de **T005** (US-2), na posicao que
 * `../requisicao/atender-leitura-publica.ts` marcou desde T001: entre
 * `handle_404()` e `send_headers()`. A ordem e contrato publico (BR-MIGRAR-106,
 * `EXT-ORDEM`) e a tabela *Nao negociavel* da constituicao a tira das maos do
 * agente de codificacao — acrescentar esta etapa no fim do atendimento, em lugar
 * de na posicao marcada, seria mudanca de contrato.
 *
 * ---
 *
 * ## Um metodo que escreve em `$GLOBALS`, portado como VALOR
 *
 * O legado faz literalmente `$GLOBALS[ $key ] = $value` para **cada** criterio
 * da consulta (`:666-668`) e mais cinco nomes fixos. BR-MIGRAR-105
 * (`EXT-CONTEXTO`) e o registro de descarte correspondente de
 * `discard_log.md` dizem o que acontece com isso no destino: *"substituido por
 * contexto por requisicao explicito. **A regra nao e descartada**: EXT-CONTEXTO
 * migra a invariante de que identidade, consulta, conexao e requisicao corrente
 * sao escopo de requisicao. O que sai e o mecanismo"*.
 *
 * Logo o mecanismo — o dicionario global — nao se reproduz, e o **conteudo** se
 * reproduz inteiro: e isso que este valor e. Quem monta a borda que renderiza o
 * modelo (feature 009) extrai daqui as variaveis do escopo do modelo, que e o
 * que `load_template()` faz com `extract()` em `wp-includes/template.php:860` —
 * e o legado comenta que esse `extract()` *"cannot be removed"*.
 *
 * ## Os sete nomes, e por que `$more` e `$single` sao dois e nao um
 *
 * | global | legado | aqui |
 * |---|---|---|
 * | cada criterio da consulta, pelo proprio nome | `:666-668` | {@link PublicacaoParaOTema.criterios} |
 * | `$query_string` | `:670` | {@link PublicacaoParaOTema.cadeiaDeConsulta} |
 * | `$posts` | `:671` | {@link PublicacaoParaOTema.conteudos} |
 * | `$post` | `:672` | {@link PublicacaoParaOTema.conteudo} |
 * | `$request` | `:673` | {@link PublicacaoParaOTema.consultaEnviada} |
 * | `$more` e `$single` | `:675-678` | {@link PublicacaoParaOTema.corpoInteiro} e {@link PublicacaoParaOTema.conteudoUnico} |
 * | `$authordata` | `:680-682` | {@link PublicacaoParaOTema.dadosDoAutor} |
 *
 * `$more` e `$single` recebem o mesmo valor na mesma condicao, e sao dois nomes
 * porque dois publicos os leem: `$more` governa a quebra por `<!--more-->` no
 * corpo e `$single` e lido por tema. Juntar os dois num campo so quebraria o
 * segundo no dia em que o legado mudasse um deles.
 *
 * ⚠️ **`$post` e publicado como nulo quando a consulta nao encontrou nada**
 * (`:672`, `$wp_query->post ?? null`), e nao e omitido. A diferenca e o que
 * distingue, no tema, *"nao ha conteudo"* de *"a variavel nao existe"* — e
 * `../consulta/consultar-conteudo.ts` registra que o legado deixa
 * `WP_Query::$post` **sem definir** nesse caso. Os dois fatos convivem: a
 * propriedade nao existe, e o global existe valendo nulo.
 *
 * ## As duas lacunas declaradas, e de quem e cada uma
 *
 * | lacuna | legado | de quem e |
 * |---|---|---|
 * | `$query_string` | `WP::$query_string`, montado por `WP::build_query_string()` (`class-wp.php:612-659`) e chamado de `query_posts()` (`:703`) | de quem portar `build_query_string`, que e o unico ponto desta feature que ninguem nomeou numa tarefa. O proprio legado o marca como compatibilidade: a montagem existe para o global, nao para a consulta |
 * | `$request` | `WP_Query::$request`, o SQL que `get_posts()` montou (`class-wp-query.php:3540`) | do repositorio: o SQL e dele por ligacao tardia, e `ResultadoDaConsulta` nao o devolve. T003 registrou a razao inteira em `../consulta/conteudo-consultado.ts` |
 *
 * Nenhuma das duas e decisao: as duas sao texto que **chega de fora**, e por
 * isso os dois campos existem e nascem vazios. Omiti-los faria o tema que le
 * `$request` — e ha tema que le, para depurar consulta — encontrar variavel
 * ausente onde o legado tem texto.
 */

import type { ConsultaDeConteudo } from '../consulta/consultar-conteudo.js';
import type { ConteudoConsultado } from '../consulta/conteudo-consultado.js';
import type { CriteriosDaConsulta } from '../consulta/criterios-da-consulta.js';
import {
  contextoDaApresentacaoResolvido,
  type ContextoDaApresentacao,
} from './contexto-da-apresentacao.js';
import {
  identificadorDoObjetoConsultado,
  objetoConsultadoNoTema,
} from './objeto-consultado.js';

/** O que `WP::register_globals()` publica para o tema. */
export interface PublicacaoParaOTema {
  /**
   * Os criterios da consulta, cada nome publicado como variavel propria.
   *
   * ⚠️ A ordem de insercao importa, e e a da consulta: no legado dois criterios
   * com o mesmo nome nao existem, mas a ordem decide qual valor um nome de
   * criterio que colide com um global do nucleo assume — e o legado sobrescreve
   * sem testar.
   */
  readonly criterios: CriteriosDaConsulta;
  /** `$query_string` — ver a tabela de lacunas no cabecalho deste arquivo. */
  readonly cadeiaDeConsulta: string;
  /** `$posts`, na ordem em que o repositorio os devolveu. */
  readonly conteudos: readonly ConteudoConsultado[];
  /** `$post`, **nulo** quando a consulta nao encontrou nada. */
  readonly conteudo: ConteudoConsultado | null;
  /** `$request` — ver a tabela de lacunas no cabecalho deste arquivo. */
  readonly consultaEnviada: string;
  /** `$more` — verdadeiro quando `is_single()` ou `is_page()`. */
  readonly corpoInteiro: boolean;
  /** `$single` — a mesma condicao de `corpoInteiro`, e nome proprio. */
  readonly conteudoUnico: boolean;
  /**
   * `$authordata` — presente so quando `is_author()`.
   *
   * `unknown` porque o tema e que o le — ver `DadosDaConta` em
   * `./contexto-da-apresentacao.ts`. Ausente quando a consulta nao e de arquivo
   * de autor, que e o legado nao definir o global.
   */
  readonly dadosDoAutor?: unknown;
}

/**
 * Publica o resultado da consulta para o tema (`WP::register_globals()`).
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). O legado nao
 * pergunta nada aqui, e nao poderia: esta etapa roda para todo visitante, e o
 * portao de visibilidade do conteudo ja agiu dentro da consulta (T009).
 *
 * Nao toca em porta nenhuma e nao consulta nada, exceto o colaborador
 * `dadosDaConta` no ramo de arquivo de autor — que e a unica chamada externa que
 * `register_globals` faz no legado (`class-wp.php:681`).
 */
export function publicarParaOTema(
  consulta: ConsultaDeConteudo,
  contextoRecebido: ContextoDaApresentacao = {},
): PublicacaoParaOTema {
  const contexto = contextoDaApresentacaoResolvido(contextoRecebido);

  // `$wp_query->is_single() || $wp_query->is_page()` (`:675`) — e `is_single`,
  // nao `is_singular`: um anexo e `is_single` no legado (`class-wp-query.php:1145`),
  // logo entra; uma busca de um resultado so, nao.
  const umConteudoSo = consulta.tipos.unico || consulta.tipos.pagina;

  const publicacao: PublicacaoParaOTema = {
    criterios: consulta.criterios,
    cadeiaDeConsulta: '',
    conteudos: consulta.conteudos,
    conteudo: consulta.conteudo ?? null,
    consultaEnviada: '',
    corpoInteiro: umConteudoSo,
    conteudoUnico: umConteudoSo,
  };

  if (!consulta.tipos.autor) {
    return Object.freeze(publicacao);
  }

  // `get_userdata( get_queried_object_id() )` (`:681`) — e o legado publica o
  // retorno sem testar, logo conta inexistente publica a ausencia.
  const dadosDoAutor = contexto.dadosDaConta(
    identificadorDoObjetoConsultado(
      objetoConsultadoNoTema(consulta.objetoConsultado),
    ),
  );

  return Object.freeze({ ...publicacao, dadosDoAutor });
}
