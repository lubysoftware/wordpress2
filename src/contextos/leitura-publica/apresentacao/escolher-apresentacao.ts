/**
 * A escolha da apresentacao de ponta a ponta — `wp-includes/template-loader.php`
 * inteiro, que e o que `wp-blog-header.php:19` carrega **depois** de `wp()`
 * retornar.
 *
 * Entrega de **T005** (US-2): aqui estao a ordem das decisoes, a reserva final
 * de CA-2.2 e o registro da procura que CA-2.3 pede.
 *
 * ---
 *
 * ## Isto NAO e uma etapa de `WP::main()`, e a diferenca importa
 *
 * `wp-blog-header.php` tem duas linhas de corpo: `wp()` (`:16`) e o
 * `require_once` deste arquivo (`:19`). Ou seja a escolha de apresentacao
 * acontece **fora** do atendimento, depois da acao `wp` e depois do envio de
 * cabecalhos — e e por isso que ela e operacao propria do modulo e nao a etapa 5
 * de `requisicao/atender-leitura-publica.ts`. A etapa 5 e
 * `WP::register_globals()`, que esta em `./publicacao-para-o-tema.ts`: ela
 * publica o resultado, e esta funcao e o primeiro consumidor dele.
 *
 * ## A ordem das sete decisoes, e cada uma e uma saida diferente
 *
 * | # | decisao | legado | saida |
 * |---|---|---|---|
 * | 1 | o ponto de acao `template_redirect`, **so** se o tema esta em uso | `:7-24` | — |
 * | 2 | requisicao `HEAD` sai sem corpo, se o filtro deixar | `:36-38` | `cabecalho-apenas` |
 * | 3 | `robots.txt` | `:41-48` | `robots` |
 * | 4 | `favicon.ico` | `:49-56` | `favicon` |
 * | 5 | feed | `:57-59` | `feed` |
 * | 6 | notificacao de link | `:60-62` | `notificacao-de-link` |
 * | 7 | o laco de modelos, a reserva final e `template_include` | `:65-139` | `modelo` |
 *
 * E a oitava, que e ausencia de saida: tema fora de uso **e** nenhuma das
 * quatro superficies — o arquivo simplesmente termina. Esta como `sem-tema`.
 *
 * ⚠️ **As quatro superficies do meio rodam com o tema fora de uso**, e o legado
 * diz por que num comentario de uma linha: *"Process feeds and trackbacks even
 * if not using themes"* (`:40`). Po-las dentro do `if ( wp_using_themes() )`
 * — que e o arranjo "limpo" — faria o feed de um site servido por front
 * controller proprio deixar de existir.
 *
 * ⚠️ **A decisao 2 vem antes das quatro**, logo um `HEAD` em `/feed/` nao serve
 * feed. O docblock do legado explica o motivo e cita o bilhete: *"Provides a
 * significant performance bump by exiting before the page content loads for
 * 'HEAD' requests. See #14348"* (`:28-30`).
 *
 * ## O que esta funcao decide, e o que ela deliberadamente nao faz
 *
 * Ela vai **ate** `template_include` (`:114`), que e a ultima das tres ancoras
 * que a `spec.md` desta feature registra para US-2 (`template-loader.php:23`,
 * `template-loader.php:114`, `template.php:23`). O que vem depois dela e
 * **inclusao**, nao escolha, e e de outra feature:
 *
 * | o que | legado | de quem e |
 * |---|---|---|
 * | o portao de inclusao: `realpath`, sufixo `.php` ou `.html`, `is_file`, `is_readable` | `:115-122` | `plataforma/tema` mais a borda de sistema de arquivos — feature 009 |
 * | o ponto de acao `wp_before_include_template` | `:130` | idem, e e o ponto mais novo da arvore (7.1.2) |
 * | o `include` e o `load_template()` que extrai os criterios para o escopo do modelo | `:132` e `template.php:848-880` | idem |
 * | `wp_die( $theme->errors() )` para quem pode trocar tema | `:133-137` | idem, e e o unico lugar de `template-loader.php` que pergunta capacidade |
 *
 * ⚠️ **Consequencia a nao esquecer:** o caminho que esta funcao devolve **nao e**
 * garantia de que algo sera servido. O portao de `:117-122` pode recusa-lo — e e
 * ele que torna `TEMA_SEM_MODELOS` um estado completo e nao um buraco.
 *
 * ## CA-2.2, com a nuance que a `spec.md` resume e o legado detalha
 *
 * CA-2.2 e *"ha sempre um modelo final de reserva, de modo que nenhuma
 * requisicao fica sem apresentacao"*. A primeira metade e literal no legado: o
 * laco sempre termina em `get_index_template()` (`:103-105`), e `index.php` e o
 * ultimo candidato de `is_home` tambem (`template.php:400`). A segunda metade
 * vale sob a pre-condicao que UC-01 escreve — *"o tema ativo resolve ao menos um
 * template, ou o sistema cai no `index.php` do tema"*: **existir** o
 * `index.php` e condicao do tema, nao deste codigo. Inventar aqui uma
 * apresentacao sintetica para "garantir" a segunda metade seria inventar
 * comportamento que o legado nao tem (P1) — o que o legado faz quando nem
 * `index.php` existe esta na tabela acima, no ramo de `wp_die`.
 */

import type { ConsultaDeConteudo } from '../consulta/consultar-conteudo.js';
import { vazioComoNoPhp } from '../consulta/semantica-de-php.js';
import {
  contextoDaApresentacaoResolvido,
  type ContextoDaApresentacao,
} from './contexto-da-apresentacao.js';
import {
  HIERARQUIA_DE_MODELOS,
  modeloDaConsulta,
  TIPO_DA_RESERVA_FINAL,
  type LeituraDaConsulta,
  type PontosDaHierarquia,
} from './hierarquia-de-modelos.js';
import { objetoConsultadoNoTema } from './objeto-consultado.js';

/** O metodo que a decisao 2 reconhece — `'HEAD' === $_SERVER['REQUEST_METHOD']`. */
export const METODO_SEM_CORPO = 'HEAD';

/**
 * O ponto de extensao que o laco de modelos **remove** quando o modelo de anexo
 * vence (`template-loader.php:96`).
 *
 * `remove_filter( 'the_content', 'prepend_attachment' )`: com modelo de anexo
 * proprio, o legado para de prefixar o anexo ao corpo, porque o modelo ja o
 * mostra. E observavel na renderizacao do corpo, e por isso sai daqui declarado
 * por nome — quem renderiza o corpo (T017 desta feature, e a feature 009) le
 * esta lista antes de montar a cadeia de filtros.
 */
export const FILTRO_DE_ANEXO_NO_CORPO = 'prepend_attachment';

/**
 * As oito saidas de `template-loader.php`.
 *
 * Nao e enfeite de tipo: as quatro do meio nao passam pelo laco de modelos, e
 * `cabecalho-apenas` e `sem-tema` nao produzem corpo nenhum. Um porte que
 * devolvesse so o caminho do modelo nao teria como dizer que a requisicao foi
 * atendida sem modelo — e sao quatro superficies publicas que acabam ali.
 */
export type SaidaDaApresentacao =
  /** O laco de modelos decidiu — pode ter terminado sem localizar arquivo. */
  | 'modelo'
  /** `wp_using_themes()` falso, e nenhuma das quatro superficies (`:65`, sem `else`). */
  | 'sem-tema'
  /** `HEAD` com o filtro `exit_on_http_head` em verdadeiro (`:36-38`). */
  | 'cabecalho-apenas'
  /** `do_robots` (`:41-48`). */
  | 'robots'
  /** `do_favicon` (`:49-56`). */
  | 'favicon'
  /** `do_feed()` (`:57-59`). */
  | 'feed'
  /** `wp-trackback.php` (`:60-62`). */
  | 'notificacao-de-link';

/**
 * Um passo da procura — uma volta do laco de `template-loader.php:89-101`.
 *
 * E o registro que CA-2.3 cobra: *"a ordem de procura e inspecionavel por quem
 * desenvolve o tema"*. Ele distingue os tres estados que um passo pode ter, e os
 * tres sao diferentes no legado:
 *
 * | estado | `valeu` | `consultouOTema` | legado |
 * |---|---|---|---|
 * | o predicado nao valeu | falso | falso | `if ( call_user_func( $tag ) )` nao entrou |
 * | valeu e a regra saiu sem consultar | verdadeiro | falso | `get_post_type_archive_template()` em `template.php:184` |
 * | valeu e o tema foi consultado | verdadeiro | verdadeiro | `get_query_template()` correu |
 */
export interface PassoDaProcura {
  /**
   * O nome do predicado no legado — `is_single`, `is_404`, ...
   *
   * Texto vazio no passo da reserva final, que roda **fora** do laco
   * (`:103-105`) e nao tem predicado.
   */
  readonly predicado: string;
  readonly valeu: boolean;
  readonly consultouOTema: boolean;
  /** O `$type` saneado, ou texto vazio quando o tema nao foi consultado. */
  readonly tipo: string;
  /** Os candidatos consultados, em ordem decrescente de prioridade. */
  readonly candidatos: readonly string[];
  /** O caminho localizado neste passo, ou texto vazio. */
  readonly modelo: string;
}

/** A acao `template_redirect` (`template-loader.php:23`). */
export type ObservadorDaApresentacao = () => void;

/**
 * O filtro `exit_on_http_head` (`template-loader.php:36`).
 *
 * Default **verdadeiro**, declarado no proprio `apply_filters`. Recebe o valor
 * que o anterior devolveu, como todo filtro.
 */
export type IntercepcaoDeSaidaNoCabecalho = (sair: boolean) => boolean;

/**
 * O filtro `template_include` (`template-loader.php:114`).
 *
 * O ultimo ponto antes da inclusao, e o docblock do legado o recomenda em lugar
 * de `template_redirect` para quem quer trocar o modelo: *"use the
 * {@see 'template_include'} filter hook to return the path to the new template
 * you want to use"* (`:17-19`).
 *
 * ⚠️ O legado aceita retorno que **nao e texto** e o converte depois, no portao
 * de inclusao (`:115-116`, `$is_stringy`), onde valor nao convertivel vira nulo
 * e nada e incluido. Aqui o tipo e texto porque o portao de inclusao nao e desta
 * tarefa — ver o cabecalho deste arquivo.
 */
export type IntercepcaoDoModeloIncluido = (modelo: string) => string;

/** Os pontos de extensao desta operacao, na ordem em que disparam. */
export interface PontosDaApresentacao {
  /** `template_redirect`, antes de tudo e so com o tema em uso (`:23`). */
  readonly aoDecidirApresentacao?: readonly ObservadorDaApresentacao[];
  /** `exit_on_http_head` (`:36`). */
  readonly sobreSairNoCabecalho?: readonly IntercepcaoDeSaidaNoCabecalho[];
  /** `do_robots` (`:47`). */
  readonly aoServirRobots?: readonly ObservadorDaApresentacao[];
  /** `do_favicon` (`:55`). */
  readonly aoServirFavicon?: readonly ObservadorDaApresentacao[];
  /** `{$type}_template_hierarchy` e `{$type}_template`, dentro do laco. */
  readonly hierarquia?: PontosDaHierarquia;
  /** `template_include`, no fim (`:114`). */
  readonly sobreOModeloIncluido?: readonly IntercepcaoDoModeloIncluido[];
}

/** O que a escolha de apresentacao recebe alem da consulta. */
export interface OpcoesDaApresentacao {
  readonly contexto?: ContextoDaApresentacao;
  readonly pontosDeExtensao?: PontosDaApresentacao;
}

/** A apresentacao escolhida, com o registro de como se chegou nela. */
export interface ApresentacaoEscolhida {
  readonly saida: SaidaDaApresentacao;
  /**
   * O caminho do modelo escolhido, depois de `template_include`.
   *
   * Texto vazio quando nenhum candidato foi localizado, e tambem nas seis saidas
   * que nao passam pelo laco.
   */
  readonly modelo: string;
  /** O `$type` da regra que venceu, ou texto vazio. */
  readonly tipo: string;
  /** O predicado que venceu, ou texto vazio — inclusive na reserva final. */
  readonly predicado: string;
  /** Os candidatos da regra que venceu, em ordem decrescente de prioridade. */
  readonly candidatos: readonly string[];
  /** A procura inteira, na ordem em que aconteceu (CA-2.3). */
  readonly procura: readonly PassoDaProcura[];
  /** Os pontos de extensao que esta etapa removeu, por nome do legado. */
  readonly filtrosRemovidos: readonly string[];
}

/** Um passo em que nada foi consultado. */
function passoSemConsulta(predicado: string, valeu: boolean): PassoDaProcura {
  return Object.freeze({
    predicado,
    valeu,
    consultouOTema: false,
    tipo: '',
    candidatos: Object.freeze([]),
    modelo: '',
  });
}

/** Uma das seis saidas que nao passam pelo laco de modelos. */
function saidaSemModelo(saida: SaidaDaApresentacao): ApresentacaoEscolhida {
  return Object.freeze({
    saida,
    modelo: '',
    tipo: '',
    predicado: '',
    candidatos: Object.freeze([]),
    procura: Object.freeze([]),
    filtrosRemovidos: Object.freeze([]),
  });
}

/**
 * Escolhe a apresentacao do resultado de uma consulta publica.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). E a mesma
 * declaracao das outras quatro operacoes desta feature, e o motivo e UC-01:
 * *"nao ha verificacao de capacidade. O portao e o `post_status`"*. O unico
 * `current_user_can()` de `template-loader.php` esta no ramo de inclusao
 * (`:133`), que nao e desta tarefa, e ele **nao** decide a apresentacao: decide
 * se quem pode trocar tema ve os erros do tema.
 *
 * Recebe a consulta, e nao o endereco: o legado le `$wp_query` por dezessete
 * predicados e dois criterios, e nada do endereco original.
 */
export function escolherApresentacao(
  consulta: ConsultaDeConteudo,
  opcoes: OpcoesDaApresentacao = {},
): ApresentacaoEscolhida {
  const contexto = contextoDaApresentacaoResolvido(opcoes.contexto);
  const pontos = opcoes.pontosDeExtensao ?? {};

  // Decisao 1 — `template_redirect`, dentro do `if ( wp_using_themes() )` de
  // `:7`. Com o tema fora de uso ele NAO dispara, e um feed servido assim nunca
  // ve o gancho.
  if (contexto.usandoTemas) {
    for (const observador of pontos.aoDecidirApresentacao ?? []) {
      observador();
    }
  }

  // Decisao 2 — `HEAD` (`:36-38`).
  if (contexto.metodoHttp === METODO_SEM_CORPO) {
    let sair = true;
    for (const intercepcao of pontos.sobreSairNoCabecalho ?? []) {
      sair = intercepcao(sair);
    }
    if (sair) {
      return saidaSemModelo('cabecalho-apenas');
    }
  }

  // Decisoes 3 a 6 — as quatro superficies, FORA do `if ( wp_using_themes() )`
  // (`:40-63`), e numa cadeia `elseif`: a primeira que casa encerra.
  if (consulta.tipos.robots) {
    for (const observador of pontos.aoServirRobots ?? []) {
      observador();
    }
    return saidaSemModelo('robots');
  }
  if (consulta.tipos.favicon) {
    for (const observador of pontos.aoServirFavicon ?? []) {
      observador();
    }
    return saidaSemModelo('favicon');
  }
  if (consulta.tipos.feed) {
    // `do_feed()` monta o RSS ou o Atom. O corpo dele e da feature 013
    // (`feeds-e-sitemap`), que sai desta mesma consulta publica; aqui fica so a
    // decisao, que e o que `template-loader.php` tem.
    return saidaSemModelo('feed');
  }
  if (consulta.tipos.notificacaoDeLink) {
    // `require ABSPATH . 'wp-trackback.php'` — front controller proprio, e e
    // dele a resposta.
    return saidaSemModelo('notificacao-de-link');
  }

  // Decisao 7 — o laco, e so com o tema em uso (`:65`).
  if (!contexto.usandoTemas) {
    return saidaSemModelo('sem-tema');
  }

  const objeto = objetoConsultadoNoTema(consulta.objetoConsultado);
  const leitura: LeituraDaConsulta = {
    tipos: consulta.tipos,
    criterios: consulta.criterios,
    ...(consulta.conteudo === undefined
      ? {}
      : { conteudo: consulta.conteudo }),
    ...(objeto === undefined ? {} : { objetoConsultado: objeto }),
    contexto,
  };

  const procura: PassoDaProcura[] = [];
  const filtrosRemovidos: string[] = [];
  // `$template = false;` (`:86`) — a variavel atravessa o laco e NAO e
  // reiniciada a cada volta: e por isso que uma regra que devolve vazio nao
  // apaga o resultado de outra, e que o laco pode terminar sem nada.
  let modelo = '';
  let vencedor: PassoDaProcura | undefined;

  for (const regra of HIERARQUIA_DE_MODELOS) {
    if (!regra.vale(leitura)) {
      procura.push(passoSemConsulta(regra.predicado, false));
      continue;
    }

    const candidatosDaRegra = regra.candidatos(leitura);
    if (candidatosDaRegra === undefined) {
      procura.push(passoSemConsulta(regra.predicado, true));
      continue;
    }

    const entrada = modeloDaConsulta(
      regra.tipo,
      candidatosDaRegra,
      contexto.tema,
      pontos.hierarquia,
    );
    const passo: PassoDaProcura = Object.freeze({
      predicado: regra.predicado,
      valeu: true,
      consultouOTema: true,
      tipo: entrada.tipo,
      candidatos: entrada.candidatos,
      modelo: entrada.modelo,
    });
    procura.push(passo);
    modelo = entrada.modelo;

    // `if ( $template ) { ... break; }` (`:94-100`) — o teste e de verdade do
    // interpretador, logo um caminho `'0'` nao encerra o laco.
    if (!vazioComoNoPhp(modelo)) {
      if (regra.predicado === 'is_attachment') {
        filtrosRemovidos.push(FILTRO_DE_ANEXO_NO_CORPO);
      }
      vencedor = passo;
      break;
    }
  }

  // A reserva final (`:103-105`), fora do laco.
  if (vazioComoNoPhp(modelo)) {
    const reserva = modeloDaConsulta(
      TIPO_DA_RESERVA_FINAL,
      [],
      contexto.tema,
      pontos.hierarquia,
    );
    const passo: PassoDaProcura = Object.freeze({
      predicado: '',
      valeu: true,
      consultouOTema: true,
      tipo: reserva.tipo,
      candidatos: reserva.candidatos,
      modelo: reserva.modelo,
    });
    procura.push(passo);
    modelo = reserva.modelo;
    vencedor = passo;
  }

  // `template_include` (`:114`), depois da reserva e antes do portao de
  // inclusao.
  for (const intercepcao of pontos.sobreOModeloIncluido ?? []) {
    modelo = intercepcao(modelo);
  }

  return Object.freeze({
    saida: 'modelo',
    modelo,
    tipo: vencedor?.tipo ?? '',
    predicado: vencedor?.predicado ?? '',
    candidatos: vencedor?.candidatos ?? Object.freeze([]),
    procura: Object.freeze([...procura]),
    filtrosRemovidos: Object.freeze([...filtrosRemovidos]),
  });
}
