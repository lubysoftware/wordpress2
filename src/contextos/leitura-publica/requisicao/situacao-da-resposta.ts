/**
 * A situacao da resposta — o `WP::handle_404()` do legado
 * (`wp-includes/class-wp.php:724`), que e a excecao *"Nenhum registro
 * corresponde"* de UC-01 e a historia US-5 desta feature.
 *
 * O nome do legado engana e o proprio docblock dele avisa: *"handle_404() really
 * means 'handle status'"*. A funcao roda **depois** da consulta, olha o
 * resultado e decide entre 404 e 200 — e e por isso que uma requisicao
 * aparentemente bem-sucedida pode virar 404.
 *
 * ---
 *
 * 🔴 **LEIA ISTO ANTES DE FECHAR T003: o 404 desta tarefa e provisorio por
 * tarefa, e nao regra.**
 *
 * T001 entrega *"devolve a resposta de endereco inexistente"*, e isso e
 * exatamente o valor inicial do legado: `$set_404 = true`
 * (`wp-includes/class-wp.php:747`). O que derruba esse valor sao **tres ramos de
 * excecao que dependem do resultado da consulta e dos predicados de tipo de
 * consulta** — e os dois chegam em T003. Enquanto nao chegarem, **todo** endereco
 * resolve para 404 aqui, inclusive a home: no legado, conjunto vazio de criterios
 * e `is_home()`, e `is_home()` esta na lista que limpa o 404
 * (`class-wp.php:784-795`). Quem fechar T003 sem trazer a lista deixa a cara
 * publica do produto respondendo 404 na primeira pagina.
 *
 * Os ramos, transcritos do legado para servirem de lista de conferencia:
 *
 * 1. `class-wp.php:749-752` — painel, `robots`, `favicon`, mapa do site e a
 *    folha de estilo do mapa **nunca** 404am aqui. O mapa do site manda o
 *    proprio codigo, em `WP_Sitemaps::render_sitemaps()`.
 * 2. `class-wp.php:753-781` — havendo conteudo no resultado, 404 so continua se
 *    a paginacao interna do corpo nao alcanca a pagina pedida: para conteudo
 *    singular, a pagina pedida tem de caber na contagem de `<!--nextpage-->` do
 *    corpo, e corpo sem o marcador com pagina pedida **nao** tem conteudo; a
 *    pagina de posts nao suporta essa paginacao de corpo nenhuma.
 * 3. `class-wp.php:783-796` — sem conteudo e **sem paginacao de listagem**,
 *    ainda nao se 404a: arquivo de autor cujo autor e membro do site, arquivo de
 *    termo, de taxonomia ou de tipo de conteudo que casou um objeto, e home,
 *    busca e feed. Com paginacao de listagem (`is_paged()`), 404a — e e esse ramo
 *    que CA-3.3 cobra em T007, *"pedir pagina alem do total devolve a resposta de
 *    endereco sem correspondencia"*.
 *
 * ---
 *
 * **Os dois caminhos de 404 do legado sao diferentes, e esta funcao e so um
 * deles.** Quem pega T002 e T011 precisa dos dois:
 *
 * - **Endereco que nao casa regra nenhuma** (T002): `parse_request` poe o
 *   criterio `error` em `'404'` (`class-wp.php:167` e `:398-400`); a consulta le
 *   esse criterio e se marca sozinha (`class-wp-query.php:1148-1150`); esta
 *   funcao entao **desiste no comeco**, pelo `if ( is_404() ) return;`
 *   (`class-wp.php:742-745`), sem declarar codigo nenhum; e quem emite o 404 e o
 *   envio de cabecalhos, a partir do criterio `error`
 *   (`class-wp.php:455-466`).
 * - **Consulta que nao encontra conteudo** (T003 em diante): e este arquivo.
 *
 * Confundir os dois produz um sistema que 404a no lugar certo pelo motivo
 * errado — e o motivo e observavel, porque o primeiro caminho nao passa pelos
 * tres ramos de excecao acima.
 */

import type { ResolucaoDeEndereco } from './resolver-endereco.js';

/**
 * A situacao da resposta de leitura publica.
 *
 * Os tres campos sao as tres coisas que o legado faz ao 404ar, e nao uma
 * invencao de forma: marca a consulta (`$wp_query->set_404()`), declara o
 * codigo (`status_header( 404 )`) e manda nao guardar em cache
 * (`nocache_headers()`) — `class-wp.php:798-805`.
 */
export interface RespostaDaLeitura {
  /**
   * O codigo HTTP que **esta decisao** declara, ou `null` quando ela nao
   * declara nenhum.
   *
   * `null` nao e ausencia de resposta: e a fidelidade dos dois caminhos em que o
   * legado sai de `handle_404` sem chamar `status_header` — o curto-circuito por
   * ponto de extensao e a desistencia por consulta ja marcada. Nos dois, o
   * codigo da resposta e decidido depois, no envio de cabecalhos.
   */
  readonly codigoHttp: number | null;
  /**
   * A consulta fica marcada como "nao encontrada" — o `is_404()` do legado.
   *
   * E este campo, e nao o codigo, que leva o tema ao modelo de erro (CA-5.1):
   * sao duas consequencias de uma decisao, e um porte que as junte num unico
   * booleano perde o caso em que a consulta esta marcada e o codigo vem de
   * outro lugar.
   */
  readonly naoEncontrado: boolean;
  /**
   * A resposta pede para nao ser guardada em cache.
   *
   * O legado chama `nocache_headers()` junto com o 404
   * (`class-wp.php:802`). Os valores dos cabecalhos **nao** estao aqui: eles
   * saem de `wp_get_nocache_headers()` (`wp-includes/functions.php:1508-1530`),
   * que e funcao da plataforma, substituivel e com ponto de extensao proprio
   * (`nocache_headers`). Reproduzi-los aqui seria este contexto decidir borda
   * HTTP que nao e dele.
   */
  readonly semCache: boolean;
}

/**
 * A situacao em que **nenhuma** decisao de situacao foi tomada.
 *
 * E o estado da resposta quando o legado nunca chega a `handle_404` — porque
 * `do_parse_request` recusou a resolucao e `WP::main()` pula a consulta, o
 * tratamento de situacao e o registro das variaveis
 * (`wp-includes/class-wp.php:822-830`). Nao e 200: e a ausencia de decisao, e
 * quem decide o codigo depois e o envio de cabecalhos.
 */
export const SITUACAO_NAO_DECIDIDA: RespostaDaLeitura = Object.freeze({
  codigoHttp: null,
  naoEncontrado: false,
  semCache: false,
});

/**
 * O ponto de extensao `pre_handle_404` (`wp-includes/class-wp.php:738`).
 *
 * **A regra de curto-circuito e literal, e nao e "retornou verdadeiro":** o
 * legado testa `false !== $valor`, logo qualquer valor que nao seja exatamente
 * `false` encerra o tratamento — inclusive nulo, zero e texto vazio. E por isso
 * que o valor que atravessa a cadeia e `unknown` aqui: tipar como booleano
 * trocaria a regra em silencio.
 *
 * Curto-circuitar **nao** e responder 200: o legado volta sem chamar
 * `status_header` nenhuma vez.
 */
export type IntercepcaoDaSituacao = (
  preempcao: unknown,
  resolucao: ResolucaoDeEndereco,
) => unknown;

/**
 * O ponto de acao `set_404` (`wp-includes/class-wp-query.php:1858`), disparado
 * por `WP_Query::set_404()` depois de a consulta ser marcada.
 *
 * Nao devolve valor. No legado ele recebe a consulta por referencia; aqui recebe
 * a resposta ja decidida, pelo mesmo motivo do ponto `parse_request`.
 *
 * ⚠️ `set_404()` faz mais do que marcar: ele **zera todos os predicados de tipo
 * de consulta** e preserva **so** `is_feed` (`class-wp-query.php:1843-1850`).
 * Esse zeramento e observavel por quem le os predicados depois, e pertence a
 * consulta — T003 —, nao a este arquivo, que ainda nao tem predicado algum para
 * zerar.
 */
export type ObservadorDeNaoEncontrado = (resposta: RespostaDaLeitura) => void;

/** Os pontos de extensao desta funcao, na ordem em que disparam. */
export interface PontosDeExtensaoDaSituacao {
  /** `pre_handle_404`, antes de tudo. */
  readonly antesDeDecidir?: readonly IntercepcaoDaSituacao[];
  /** `set_404`, so quando a decisao e marcar como nao encontrado. */
  readonly aoMarcarNaoEncontrado?: readonly ObservadorDeNaoEncontrado[];
}

/** O que a decisao de situacao recebe alem da resolucao. */
export interface OpcoesDaSituacao {
  /**
   * A consulta ja se marcou como nao encontrada.
   *
   * Hoje nunca: a consulta e T003, e o criterio `error` que a faz se marcar e
   * T002. Esta aqui porque e a primeira coisa que o legado testa depois do ponto
   * de extensao, e esquece-la faz o sistema novo decidir duas vezes o mesmo 404
   * — disparando `set_404` de novo, que e ponto de extensao de terceiro.
   */
  readonly jaMarcadaComoNaoEncontrada?: boolean;
  readonly pontosDeExtensao?: PontosDeExtensaoDaSituacao;
}

/**
 * Decide a situacao da resposta para uma resolucao de endereco.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). UC-01 nao tem
 * verificacao de capacidade, e CA-4.4 e CA-5.3 pedem o contrario de uma
 * verificacao aqui: a resposta de quem nao pode ver tem de ser
 * **indistinguivel** da de conteudo inexistente. Quem acrescentar aqui uma
 * mensagem, um codigo ou um campo que separe "nao existe" de "nao e para voce"
 * quebra as duas, e e assim que um porte vaza a existencia de rascunho.
 */
export function situacaoDaResposta(
  resolucao: ResolucaoDeEndereco,
  opcoes: OpcoesDaSituacao = {},
): RespostaDaLeitura {
  const pontos = opcoes.pontosDeExtensao ?? {};
  const jaMarcada = opcoes.jaMarcadaComoNaoEncontrada ?? false;

  // `pre_handle_404`: o valor corrente comeca em `false` e o retorno do ultimo
  // interceptador e o que vale (`class-wp.php:738`).
  let preempcao: unknown = false;
  for (const intercepcao of pontos.antesDeDecidir ?? []) {
    preempcao = intercepcao(preempcao, resolucao);
  }
  if (preempcao !== false) {
    // O legado volta sem declarar codigo e sem marcar nada: o que ja estava
    // marcado continua marcado.
    return Object.freeze({
      codigoHttp: null,
      naoEncontrado: jaMarcada,
      semCache: false,
    });
  }

  // `if ( is_404() ) return;` — ja decidido, nao se decide de novo
  // (`class-wp.php:742-745`).
  if (jaMarcada) {
    return Object.freeze({
      codigoHttp: null,
      naoEncontrado: true,
      semCache: false,
    });
  }

  // `$set_404 = true` (`class-wp.php:747`). Os tres ramos que o derrubam estao
  // no cabecalho deste arquivo e entram em T003, T007 e T009: nenhum deles tem,
  // hoje, consulta nem predicado de tipo de consulta de que depender.
  const resposta: RespostaDaLeitura = Object.freeze({
    codigoHttp: 404,
    naoEncontrado: true,
    semCache: true,
  });

  // `set_404`, disparado de dentro de `WP_Query::set_404()`
  // (`class-wp-query.php:1858`), que o legado chama antes de `status_header`.
  for (const observador of pontos.aoMarcarNaoEncontrado ?? []) {
    observador(resposta);
  }

  return resposta;
}
