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
 * ## ✅ Os tres ramos de excecao, que T003 trouxe
 *
 * O valor inicial do legado e `$set_404 = true` (`wp-includes/class-wp.php:747`),
 * que e o que T001 entregava. O que o derruba sao tres ramos `elseif` que
 * dependem do **resultado da consulta** e dos **predicados de tipo de consulta**,
 * e os dois chegaram com a etapa 3 do atendimento:
 *
 * 1. `class-wp.php:749-752` — painel, `robots`, `favicon`, mapa do site e a
 *    folha de estilo do mapa **nunca** 404am aqui. O mapa do site manda o
 *    proprio codigo, em `WP_Sitemaps::render_sitemaps()`.
 * 2. `class-wp.php:755-781` — havendo conteudo no resultado, 404 so continua se
 *    a paginacao interna do corpo nao alcanca a pagina pedida: para conteudo
 *    singular, a pagina pedida tem de caber na contagem de `<!--nextpage-->` do
 *    corpo, e corpo sem o marcador com pagina pedida **nao** tem conteudo; a
 *    pagina de posts nao suporta essa paginacao de corpo nenhuma.
 * 3. `class-wp.php:784-796` — sem conteudo e **sem paginacao de listagem**,
 *    ainda nao se 404a: arquivo de autor cujo autor e membro do site, arquivo de
 *    termo, de taxonomia ou de tipo de conteudo que casou um objeto, e home,
 *    busca e feed. Com paginacao de listagem (`is_paged()`), 404a — e e esse ramo
 *    que CA-3.3 cobra em T007, *"pedir pagina alem do total devolve a resposta de
 *    endereco sem correspondencia"*.
 *
 * E o ramo final, que T001 nao tinha: nao marcando, o legado **declara 200**
 * (`:804`, `status_header( 200 )`). Antes de T003 toda leitura respondia 404,
 * inclusive a home de uma instalacao nova — porque conjunto vazio de criterios e
 * `is_home()`, e `is_home()` esta na lista do ramo 3.
 *
 * ## 🔴 Dois valores que este ramo le de **lugares diferentes**, e isso e do legado
 *
 * `handle_404()` e metodo de `WP`, e ele le `$this->query_vars` **e**
 * `$wp_query`. Os dois conjuntos nascem iguais e podem divergir:
 *
 * | valor | de onde o legado o le | por que divergem |
 * |---|---|---|
 * | `page` (`:763` e `:766`) | `$this->query_vars` — os criterios da **resolucao** | `parse_query` pode ter gravado `page` na copia da consulta, na correcao pela pagina da frente (`class-wp-query.php:1073`), e `pre_get_posts` pode ter mexido na copia da consulta |
 * | `author` (`:785`) e `sitemap-stylesheet` (`:751`) | `get_query_var()` — os criterios **da consulta** | idem, do outro lado |
 *
 * Ler os tres do mesmo lugar e a simplificacao obvia, e ela troca o 404 de um
 * endereco de pagina da frente com paginacao interna.
 *
 * ---
 *
 * **Os dois caminhos de 404 do legado sao diferentes, e esta funcao e so um
 * deles.** Quem pega T002 e T011 precisa dos dois:
 *
 * - **Endereco que nao casa regra nenhuma** (T002): `parse_request` poe o
 *   criterio `error` em `'404'` (`class-wp.php:167` e `:398-400`); a consulta le
 *   esse criterio e se marca sozinha (`class-wp-query.php:1148-1150`, a etapa 15
 *   de `../consulta/analisar-consulta.ts`); esta funcao entao **desiste no
 *   comeco**, pelo `if ( is_404() ) return;` (`class-wp.php:742-745`), sem
 *   declarar codigo nenhum; e quem emite o 404 e o envio de cabecalhos, a partir
 *   do criterio `error` (`class-wp.php:455-466`).
 * - **Consulta que nao encontra conteudo**: e este arquivo, pelos tres ramos
 *   acima.
 *
 * Confundir os dois produz um sistema que 404a no lugar certo pelo motivo
 * errado — e o motivo e observavel, porque o primeiro caminho nao passa pelos
 * tres ramos de excecao e **nao** declara codigo nenhum aqui.
 */

import type { ConsultaDeConteudo } from '../consulta/consultar-conteudo.js';
import { MARCADOR_DE_PAGINA_NO_CORPO } from '../consulta/conteudo-consultado.js';
import type { ContaMembroDoSite } from '../consulta/contexto-da-consulta.js';
import {
  escalarComoNoPhp,
  inteiroComoNoPhp,
  numericoComoNoPhp,
  vazioComoNoPhp,
} from '../consulta/semantica-de-php.js';
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
   * `$wp_query` — o resultado da etapa 3 do atendimento.
   *
   * Ausente, os tres ramos de excecao nao tem predicado nem registro de que
   * depender e a decisao fica no valor inicial do legado, 404 — que e a decisao
   * correta para uma consulta sem predicado e sem resultado, e nao um esboco.
   */
  readonly consulta?: ConsultaDeConteudo;
  /**
   * A consulta ja se marcou como nao encontrada — o `is_404()` de `:743`.
   *
   * Ausente, o valor sai de {@link OpcoesDaSituacao.consulta}, que e de onde o
   * legado o le. Esta declarado em separado porque e a primeira coisa que o
   * legado testa depois do ponto de extensao, e esquece-la faz o sistema novo
   * decidir duas vezes o mesmo 404 — disparando `set_404` de novo, que e ponto
   * de extensao de terceiro.
   */
  readonly jaMarcadaComoNaoEncontrada?: boolean;
  /**
   * `is_user_member_of_blog()`, o unico colaborador que o ramo 3 precisa
   * (`class-wp.php:788`).
   *
   * Ausente, nenhuma conta e membro — que e a resposta do legado para conta que
   * nao e membro, e faz o arquivo de autor sem conteudo 404ar.
   */
  readonly contaMembroDoSite?: ContaMembroDoSite;
  readonly pontosDeExtensao?: PontosDeExtensaoDaSituacao;
}

/** A situacao de quem respondeu 200: o `status_header( 200 )` de `:804`. */
const SITUACAO_ENCONTRADA: RespostaDaLeitura = Object.freeze({
  codigoHttp: 200,
  naoEncontrado: false,
  semCache: false,
});

/** `trim( $pagina, '/' )` de `class-wp.php:766`. */
function recortarBarras(texto: string): string {
  return texto.replace(/^\/+/, '').replace(/\/+$/, '');
}

/** `substr_count( $corpo, '<!--nextpage-->' ) + 1` (`class-wp.php:767`). */
function paginasNoCorpo(corpo: string): number {
  return corpo.split(MARCADOR_DE_PAGINA_NO_CORPO).length;
}

/**
 * Ramo 1 — `:749-752`: as cinco superficies que **nunca** 404am aqui.
 *
 * A quinta e lida por `get_query_var( 'sitemap-stylesheet' )`, ou seja dos
 * criterios **da consulta** — ver a tabela do cabecalho.
 */
function superficieQueNunca404a(consulta: ConsultaDeConteudo): boolean {
  const { tipos } = consulta;
  return (
    tipos.painel ||
    tipos.robots ||
    tipos.favicon ||
    tipos.mapaDoSite ||
    !vazioComoNoPhp(consulta.criterios['sitemap-stylesheet'])
  );
}

/**
 * Ramo 2 — `:755-781`: ha conteudo, e o que resta decidir e a paginacao **de
 * corpo**.
 *
 * A pagina pedida vem dos criterios da **resolucao** (`$this->query_vars`), e
 * nao dos da consulta — ver a tabela do cabecalho.
 */
function conteudoAlcancaAPaginaPedida(
  consulta: ConsultaDeConteudo,
  paginaPedida: ResolucaoDeEndereco['criterios'][string],
): boolean {
  let achou = true;

  // `:758-772` — so para conteudo singular.
  if (consulta.tipos.singular) {
    const conteudo = consulta.conteudo;
    if (conteudo !== undefined && !vazioComoNoPhp(paginaPedida)) {
      if (conteudo.corpo.includes(MARCADOR_DE_PAGINA_NO_CORPO)) {
        // `:766` — `trim( $this->query_vars['page'], '/' )`. Com o criterio em
        // arranjo o interpretador lanca erro de tipo; aqui o primeiro elemento
        // vale, e e a mesma borda declarada em `../consulta/consulta-de-taxonomia.ts`.
        const texto =
          typeof paginaPedida === 'string'
            ? paginaPedida
            : (paginaPedida?.[0] ?? '');
        achou =
          inteiroComoNoPhp(recortarBarras(texto)) <=
          paginasNoCorpo(conteudo.corpo);
      } else {
        // Corpo sem marcador **e** pagina pedida: o legado decide que nao ha
        // conteudo, e isso 404a um endereco cujo conteudo existe.
        achou = false;
      }
    }
  }

  // `:774-777` — a pagina de listagem nao suporta paginacao de corpo nenhuma, e
  // este teste e **fora** do `if ( is_singular() )`.
  if (consulta.tipos.paginaDeConteudos && !vazioComoNoPhp(paginaPedida)) {
    achou = false;
  }

  return achou;
}

/**
 * Ramo 3 — `:784-796`: nao ha conteudo, e ainda assim ha cinco casos em que nao
 * se 404a.
 *
 * A precedencia dos operadores do legado agrupa as cinco condicoes assim:
 * `( autor && numerico && positivo && membro ) || ( ( termo || categoria ||
 * taxonomia || arquivo de tipo ) && objeto ) || inicio || busca || feed`.
 * Escrever o `&&` e o `||` na ordem textual, sem esse agrupamento, troca o
 * resultado de um arquivo de termo vazio.
 */
function naoEncontraMasNao404a(
  consulta: ConsultaDeConteudo,
  contaMembroDoSite: ContaMembroDoSite,
): boolean {
  const { tipos } = consulta;
  const autor = consulta.criterios['author'];

  const autorDoSite =
    tipos.autor &&
    numericoComoNoPhp(autor) &&
    escalarComoNoPhp(autor) &&
    Number(autor) > 0 &&
    contaMembroDoSite(inteiroComoNoPhp(autor));

  const termoQueCasouObjeto =
    (tipos.etiqueta ||
      tipos.categoria ||
      tipos.taxonomia ||
      tipos.arquivoDeTipoDeConteudo) &&
    consulta.objetoConsultado !== undefined;

  return (
    autorDoSite ||
    termoQueCasouObjeto ||
    tipos.inicio ||
    tipos.busca ||
    tipos.feed
  );
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
  const consulta = opcoes.consulta;
  const jaMarcada =
    opcoes.jaMarcadaComoNaoEncontrada ??
    consulta?.tipos.naoEncontrado ??
    false;

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

  // `$set_404 = true` (`class-wp.php:747`), e os tres ramos `elseif` que o
  // derrubam (`:749-796`). A ordem e a do legado e e ela que decide: sao
  // `elseif`, logo o ramo 2 **nao** e consultado para `robots.txt` e o ramo 3
  // **nao** e consultado quando houve conteudo.
  let marcar = true;
  if (consulta !== undefined) {
    if (superficieQueNunca404a(consulta)) {
      marcar = false;
    } else if (consulta.conteudos.length > 0) {
      if (
        conteudoAlcancaAPaginaPedida(consulta, resolucao.criterios['page'])
      ) {
        marcar = false;
      }
    } else if (!consulta.tipos.paginado) {
      // Com paginacao de listagem, 404a — e e esse ramo que CA-3.3 cobra em
      // T007.
      if (
        naoEncontraMasNao404a(
          consulta,
          opcoes.contaMembroDoSite ?? (() => false),
        )
      ) {
        marcar = false;
      }
    }
  }

  // `:803-805` — nao marcando, o legado declara 200 e nao manda nada sobre
  // cache.
  if (!marcar) {
    return SITUACAO_ENCONTRADA;
  }

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
