/**
 * A hierarquia de modelos — a tabela de `template-loader.php:67-85` e as
 * dezoito funcoes `get_*_template()` de `wp-includes/template.php:118-684`,
 * passando todas por `get_query_template()` (`:23-104`).
 *
 * Entrega de **T005** (US-2): e **aqui** que CA-2.1, CA-2.2 e CA-2.3 vivem —
 * *"para cada tipo de resultado de consulta, o sistema procura os modelos em
 * ordem declarada e usa o primeiro que existe"*, *"ha sempre um modelo final de
 * reserva"* e *"a ordem de procura e inspecionavel por quem desenvolve o
 * tema"*.
 *
 * ---
 *
 * ## A hierarquia e DADO, e e por isso que CA-2.3 e conferivel
 *
 * {@link HIERARQUIA_DE_MODELOS} e um arranjo de dezessete regras na ordem do
 * legado, cada uma com o nome do predicado, o `$type` que ela passa a
 * `get_query_template()` e a lista de candidatos que ela monta. Nao e um
 * `switch`, e nao e uma cadeia de `if`: a ordem e um dado que se pode ler,
 * imprimir e comparar — que e o que *"inspecionavel por quem desenvolve o
 * tema"* significa quando ninguem tem o tema na mao.
 *
 * ⚠️ **A ordem nao e a ordem de especificidade**, e isso surpreende: `is_single`
 * vem **antes** de `is_singular`, `is_post_type_archive` vem antes de
 * `is_archive`, e `is_front_page` vem antes de `is_home`. Reordenar "para ficar
 * logico" troca a apresentacao de todo site que tenha os dois arquivos.
 *
 * ## As quatro formas de candidato, e nenhuma e cosmetica
 *
 * | forma | exemplo | de onde sai o pedaco variavel |
 * |---|---|---|
 * | o modelo declarado no proprio conteudo | `templates/largura-total.php` | metadado `_wp_page_template`, e so entra se `0 === validate_file()` |
 * | a forma decodificada, quando ela difere | `category-sao-paulo.php` | `urldecode()` do identificador, para identificador com caractere de varios bytes |
 * | o identificador | `single-livro-dom-casmurro.php` | `post_name`, `slug`, `user_nicename` |
 * | o identificador numerico | `page-7.php`, `category-5.php` | `ID`, `term_id` |
 *
 * A segunda e a que um porte perde: ela existe desde a versao 4.7 do legado e
 * **antecede** a forma nao decodificada na lista, logo um tema que tenha os dois
 * arquivos usa o decodificado.
 *
 * ## 🔴 Uma regra pode devolver NADA sem consultar o tema, e e observavel
 *
 * `get_post_type_archive_template()` sai com texto vazio quando o tipo nao esta
 * registrado ou nao tem pagina de arquivo (`template.php:183-185`) — **sem**
 * chamar `get_query_template()`. O laco de `template-loader.php` trata o vazio
 * como "nao decidiu" e segue para a regra seguinte, logo um `post_type` sem
 * arquivo cai em `is_archive` e procura `archive.php`.
 *
 * E a diferenca entre *"nao consultei o tema"* e *"consultei e nao achei"* e
 * visivel em {@link EntradaDaHierarquia}: a primeira e ausencia de entrada, a
 * segunda e entrada com modelo vazio. Juntar as duas num unico "vazio"
 * apagaria metade da procura do registro que CA-2.3 pede.
 */

import type { ConteudoConsultado } from '../consulta/conteudo-consultado.js';
import type { CriteriosDaConsulta } from '../consulta/criterios-da-consulta.js';
import {
  escalarComoNoPhp,
  vazioComoNoPhp,
  type ValorDaConsulta,
} from '../consulta/semantica-de-php.js';
import type { TiposDeConsulta } from '../consulta/tipo-de-consulta.js';
import { decodificarUrl } from '../traducao-de-endereco/cadeia-de-consulta.js';
import { validarArquivo } from './caminho-de-modelo.js';
import { localizarModelo } from './localizar-modelo.js';
import {
  consultaDaPaginaDaFrente,
  criterioDaConsulta,
  identificadorDoObjetoConsultado,
  type ObjetoConsultadoNoTema,
} from './objeto-consultado.js';
import type { ContextoDaApresentacaoResolvido } from './contexto-da-apresentacao.js';
import type { TemaAtivo } from './tema-ativo.js';

/**
 * O que cada regra da hierarquia le da requisicao em curso.
 *
 * Os quatro campos sao o que o legado tem em maos naquele ponto: `$wp_query`
 * (os predicados e os criterios), o global `$post` que `register_globals()`
 * publicou, o `get_queried_object()` e os colaboradores do contexto.
 */
export interface LeituraDaConsulta {
  readonly tipos: TiposDeConsulta;
  readonly criterios: CriteriosDaConsulta;
  /**
   * `$wp_query->post`, que e o global `$post`.
   *
   * ⚠️ **Nao e o objeto consultado**, e a diferenca decide um candidato:
   * `get_page_template()` le o modelo declarado com `get_page_template_slug()`
   * **sem argumento** (`template.php:473`), isto e do global `$post`, enquanto
   * le o identificador e o nome do **objeto consultado** (`:472` e `:481`).
   * Com os valores de fabrica os dois sao o mesmo registro; com uma pagina
   * estatica na frente, nao sao.
   */
  readonly conteudo?: ConteudoConsultado;
  readonly objetoConsultado?: ObjetoConsultadoNoTema;
  readonly contexto: ContextoDaApresentacaoResolvido;
}

/** O resultado de uma regra que consultou o tema. */
export interface EntradaDaHierarquia {
  /** O `$type` de `get_query_template()`, ja saneado. */
  readonly tipo: string;
  /** Os candidatos consultados, em ordem decrescente de prioridade. */
  readonly candidatos: readonly string[];
  /** O caminho localizado, ou texto vazio quando nenhum candidato existe. */
  readonly modelo: string;
}

/**
 * Uma regra da hierarquia: o predicado que a ativa e a lista que ela monta.
 *
 * `candidatos` devolvendo ausencia e a regra que sai com texto vazio **sem**
 * consultar o tema — hoje so `get_post_type_archive_template()`.
 */
export interface RegraDeModelo {
  /** O nome do predicado no legado, como `template-loader.php:67-85` o escreve. */
  readonly predicado: string;
  /** O `$type` que a regra passa a `get_query_template()`. */
  readonly tipo: string;
  readonly vale: (leitura: LeituraDaConsulta) => boolean;
  readonly candidatos: (
    leitura: LeituraDaConsulta,
  ) => readonly string[] | undefined;
}

/**
 * O ponto de filtro `{$type}_template_hierarchy`
 * (`wp-includes/template.php:62`).
 *
 * **Substitui a lista de candidatos**, e o docblock do legado e literal sobre o
 * contrato dela: *"The last element in the array should always be the fallback
 * template for this query type"* (`:35`).
 *
 * O nome do ponto carrega o tipo, e sao dezoito nomes possiveis — `404_`,
 * `archive_`, `attachment_`, `author_`, `category_`, `date_`, `embed_`,
 * `frontpage_`, `home_`, `index_`, `page_`, `paged_`, `privacypolicy_`,
 * `search_`, `single_`, `singular_`, `tag_`, `taxonomy_` (`:39-56`). Por isso o
 * interceptador recebe o tipo: enquanto `plataforma/barramento/` nao existe,
 * quem despacha por nome e quem alimenta o ponto.
 *
 * ⚠️ `paged_template_hierarchy` esta na lista de nomes do legado e **nao tem
 * funcao que o dispare**: nao existe `get_paged_template()` em
 * `wp-includes/template.php`, e `is_paged` nao esta na tabela de
 * `template-loader.php`. Fica registrado, nao implementado — e lacuna do legado,
 * nao deste porte.
 */
export type IntercepcaoDaHierarquia = (
  tipo: string,
  candidatos: readonly string[],
) => readonly string[];

/**
 * O ponto de filtro `{$type}_template` (`wp-includes/template.php:103`).
 *
 * **Substitui o caminho** do modelo, e recebe os tres argumentos da linha do
 * legado: o caminho localizado, o tipo saneado e a lista de candidatos.
 *
 * Dispara **depois** de `locate_block_template()` (`:66`), e e por isso que uma
 * extensao que queira vencer o modelo em blocos usa este ponto e nao o anterior.
 */
export type IntercepcaoDoModelo = (
  modelo: string,
  tipo: string,
  candidatos: readonly string[],
) => string;

/** Os dois pontos de extensao de `get_query_template()`, na ordem em que disparam. */
export interface PontosDaHierarquia {
  /** `{$type}_template_hierarchy`, antes da procura (`:62`). */
  readonly sobreOsCandidatos?: readonly IntercepcaoDaHierarquia[];
  /** `{$type}_template`, depois da procura (`:103`). */
  readonly sobreOModelo?: readonly IntercepcaoDoModelo[];
}

/** `preg_replace( '|[^a-z0-9-]+|', '', $type )` (`template.php:24`). */
export function tipoSaneado(tipo: string): string {
  return tipo.replace(/[^a-z0-9-]+/g, '');
}

/**
 * `get_query_template( $type, $templates )`
 * (`wp-includes/template.php:23-104`).
 *
 * As cinco etapas, na ordem do legado, e cada uma e observavel:
 *
 * | # | etapa | legado |
 * |---|---|---|
 * | 1 | saneia o tipo | `:24` |
 * | 2 | lista vazia vira `"{$type}.php"` | `:26-28` |
 * | 3 | o ponto `{$type}_template_hierarchy` substitui a lista | `:62` |
 * | 4 | `locate_template()` procura, e `locate_block_template()` corre depois | `:64` e `:66` |
 * | 5 | o ponto `{$type}_template` substitui o caminho | `:103` |
 *
 * ⚠️ **A etapa 2 e o que faz as cinco regras simples funcionarem.** `404`,
 * `date`, `search`, `singular` e `index` passam lista **vazia**
 * (`get_query_template( '404' )`), e e esta linha que a transforma em
 * `['404.php']`. Um porte que declarasse `['404.php']` na regra mudaria o
 * argumento que o ponto de extensao recebe — que BR-MIGRAR-102 poe no contrato.
 */
export function modeloDaConsulta(
  tipo: string,
  candidatosDaRegra: readonly string[],
  tema: TemaAtivo,
  pontos: PontosDaHierarquia = {},
): EntradaDaHierarquia {
  const tipoLimpo = tipoSaneado(tipo);

  let candidatos: readonly string[] =
    candidatosDaRegra.length === 0 ? [`${tipoLimpo}.php`] : candidatosDaRegra;

  for (const intercepcao of pontos.sobreOsCandidatos ?? []) {
    candidatos = intercepcao(tipoLimpo, candidatos);
  }
  candidatos = Object.freeze([...candidatos]);

  let modelo = localizarModelo(candidatos, tema);

  const emBlocos = tema.modeloEmBlocos;
  if (emBlocos !== undefined) {
    modelo = emBlocos(modelo, tipoLimpo, candidatos);
  }

  for (const intercepcao of pontos.sobreOModelo ?? []) {
    modelo = intercepcao(modelo, tipoLimpo, candidatos);
  }

  return Object.freeze({ tipo: tipoLimpo, candidatos, modelo });
}

/**
 * A interpolacao de um criterio de consulta num nome de arquivo.
 *
 * ⚠️ **Arranjo interpolado da o texto `Array` no interpretador**, com aviso, e o
 * legado interpola `$pagename` sem testar o tipo (`template.php:496`). Isso
 * significa que `?pagename[]=sobre` procura o modelo `page-Array.php` — nao e
 * erro, nao e recusa, e um porte que lancasse ali derrubaria a requisicao onde o
 * legado serve a pagina pelo candidato seguinte.
 */
function textoDoCriterio(valor: ValorDaConsulta): string {
  return escalarComoNoPhp(valor) ? String(valor) : 'Array';
}

/**
 * `array_filter( (array) get_query_var( 'post_type' ) )`
 * (`wp-includes/template.php:151`).
 *
 * O molde `(array)` embrulha escalar, e `array_filter` sem callback descarta o
 * que o interpretador considera falso — inclusive o texto `'0'`, que e um nome
 * de tipo que `register_post_type()` nao impede.
 */
function tiposDeConteudoDoCriterio(valor: ValorDaConsulta): readonly string[] {
  const lista = escalarComoNoPhp(valor) ? [valor] : valor;
  return lista
    .filter((item) => !vazioComoNoPhp(item))
    .map((item) => String(item));
}

/**
 * `get_archive_template()` (`wp-includes/template.php:150-162`).
 *
 * Compartilhada por duas regras — `is_post_type_archive` chama esta depois de
 * confirmar o tipo (`:187`) —, e e por isso que as duas declaram o mesmo
 * `$type`, `archive`, e portanto o **mesmo** ponto de extensao
 * `archive_template_hierarchy`.
 */
function candidatosDeArquivo(leitura: LeituraDaConsulta): readonly string[] {
  const tipos = tiposDeConteudoDoCriterio(
    criterioDaConsulta(leitura.criterios, 'post_type'),
  );
  const candidatos: string[] = [];
  if (tipos.length === 1) {
    candidatos.push(`archive-${tipos[0] as string}.php`);
  }
  candidatos.push('archive.php');
  return candidatos;
}

/**
 * O modelo que o conteudo declara, ja passado pelo tratamento de
 * `get_page_template_slug()` (`post-template.php:1913-1915`) e pelo
 * `validate_file()` dos dois chamadores (`template.php:488` e `:560`).
 *
 * `'default'` e tratado como ausencia pelo proprio legado, e nao e constante de
 * configuracao: e literal nas duas pontas.
 */
function modeloDeclarado(
  leitura: LeituraDaConsulta,
  idDoConteudo: number | undefined,
): string {
  // `if ( ! $post ) { return false; }` (`post-template.php:1907-1909`): sem
  // registro nenhum, nao ha metadado a consultar — e os dois chamadores tratam
  // `false` e texto vazio igual, porque os dois testam `if ( $template && ... )`.
  if (idDoConteudo === undefined) {
    return '';
  }
  const declarado = leitura.contexto.modeloDeclaradoNoConteudo(idDoConteudo);
  if (declarado === '' || declarado === 'default') {
    return '';
  }
  return validarArquivo(declarado) === 0 ? declarado : '';
}

/**
 * O identificador do objeto consultado **interpolado num nome de arquivo**.
 *
 * ⚠️ Nao e `get_queried_object_id()`: as quatro regras de termo interpolam
 * `$term->term_id` direto (`template.php:267`, `:313`, `:363`), sem o `?? 0` de
 * `class-wp-query.php:4089`. Identificador ausente da texto vazio, e nao zero —
 * `category-.php` e nao `category-0.php`. Quem precisa do zero e
 * `get_page_template()`, e ele usa {@link identificadorDoObjetoConsultado}.
 */
function identificadorNoNomeDeArquivo(
  objeto: ObjetoConsultadoNoTema,
): string {
  return objeto.id === undefined ? '' : String(objeto.id);
}

/**
 * As **dezessete** regras da hierarquia, na ordem de `template-loader.php:67-85`.
 *
 * A ordem e contrato publico: ela decide qual modelo um site com varios
 * arquivos usa, e mexer nela e mudar a apresentacao de todo tema de terceiro
 * (P8). A decima oitava funcao, `get_index_template()`, **nao** esta aqui: ela e
 * a reserva final de `:103-105`, fora do laco, e esta em
 * `./escolher-apresentacao.ts`.
 */
export const HIERARQUIA_DE_MODELOS: readonly RegraDeModelo[] = Object.freeze([
  {
    // `get_embed_template()` (`template.php:602-618`).
    predicado: 'is_embed',
    tipo: 'embed',
    vale: (leitura) => leitura.tipos.incorporacao,
    candidatos: (leitura) => {
      const objeto = leitura.objetoConsultado;
      const candidatos: string[] = [];
      if (objeto !== undefined && !vazioComoNoPhp(objeto.tipo)) {
        const tipo = objeto.tipo as string;
        const formato = leitura.contexto.formatoDoConteudo(
          identificadorDoObjetoConsultado(objeto),
        );
        if (!vazioComoNoPhp(formato)) {
          candidatos.push(`embed-${tipo}-${formato}.php`);
        }
        candidatos.push(`embed-${tipo}.php`);
      }
      candidatos.push('embed.php');
      return candidatos;
    },
  },
  {
    // `get_404_template()` (`template.php:134-136`).
    predicado: 'is_404',
    tipo: '404',
    vale: (leitura) => leitura.tipos.naoEncontrado,
    candidatos: () => [],
  },
  {
    // `get_search_template()` (`template.php:518-520`).
    predicado: 'is_search',
    tipo: 'search',
    vale: (leitura) => leitura.tipos.busca,
    candidatos: () => [],
  },
  {
    // `get_front_page_template()` (`template.php:417-421`).
    predicado: 'is_front_page',
    tipo: 'frontpage',
    vale: (leitura) =>
      consultaDaPaginaDaFrente(
        leitura.tipos,
        leitura.objetoConsultado,
        leitura.contexto.configuracao,
        leitura.contexto.conteudoPorCaminho,
      ),
    candidatos: () => ['front-page.php'],
  },
  {
    // `get_home_template()` (`template.php:399-403`).
    predicado: 'is_home',
    tipo: 'home',
    vale: (leitura) => leitura.tipos.inicio,
    // ⚠️ A unica regra que declara `index.php` **dentro** da lista: a listagem
    // inicial cai no modelo de reserva sem passar pela reserva final.
    candidatos: () => ['home.php', 'index.php'],
  },
  {
    // `get_privacy_policy_template()` (`template.php:435-439`).
    predicado: 'is_privacy_policy',
    tipo: 'privacypolicy',
    vale: (leitura) => leitura.tipos.politicaDePrivacidade,
    candidatos: () => ['privacy-policy.php'],
  },
  {
    // `get_post_type_archive_template()` (`template.php:176-188`).
    predicado: 'is_post_type_archive',
    tipo: 'archive',
    vale: (leitura) => leitura.tipos.arquivoDeTipoDeConteudo,
    candidatos: (leitura) => {
      // ⚠️ Aqui NAO ha `array_filter`: o legado pega o primeiro elemento do
      // arranjo mesmo que ele seja vazio (`:177-180`), e um `post_type` vazio
      // nao casa tipo registrado nenhum.
      const criterio = criterioDaConsulta(leitura.criterios, 'post_type');
      const nome = escalarComoNoPhp(criterio)
        ? String(criterio)
        : String(criterio[0] ?? '');
      const registrado = leitura.contexto
        .tiposDeConteudo()
        .find((tipo) => tipo.nome === nome);
      if (registrado === undefined || !registrado.temArquivo) {
        return undefined;
      }
      return candidatosDeArquivo(leitura);
    },
  },
  {
    // `get_taxonomy_template()` (`template.php:349-369`).
    predicado: 'is_tax',
    tipo: 'taxonomy',
    vale: (leitura) => leitura.tipos.taxonomia,
    candidatos: (leitura) => {
      const termo = leitura.objetoConsultado;
      const candidatos: string[] = [];
      if (termo !== undefined && !vazioComoNoPhp(termo.identificadorDoTermo)) {
        const identificador = termo.identificadorDoTermo as string;
        const contexto = termo.contextoDoTermo ?? '';
        const decodificado = decodificarUrl(identificador);
        if (decodificado !== identificador) {
          candidatos.push(`taxonomy-${contexto}-${decodificado}.php`);
        }
        candidatos.push(`taxonomy-${contexto}-${identificador}.php`);
        candidatos.push(
          `taxonomy-${contexto}-${identificadorNoNomeDeArquivo(termo)}.php`,
        );
        candidatos.push(`taxonomy-${contexto}.php`);
      }
      candidatos.push('taxonomy.php');
      return candidatos;
    },
  },
  {
    // `get_attachment_template()` (`template.php:663-684`).
    predicado: 'is_attachment',
    tipo: 'attachment',
    vale: (leitura) => leitura.tipos.anexo,
    candidatos: (leitura) => {
      const anexo = leitura.objetoConsultado;
      const candidatos: string[] = [];
      if (anexo !== undefined) {
        const midia = anexo.tipoDeMidia ?? '';
        // `list( $type, $subtype ) = explode( '/', ... )` (`:670`) — a lista
        // consome os dois primeiros pedacos e descarta o resto.
        const pedacos = midia.includes('/') ? midia.split('/') : [midia, ''];
        const tipo = pedacos[0] as string;
        const subtipo = pedacos[1] ?? '';
        if (!vazioComoNoPhp(subtipo)) {
          candidatos.push(`${tipo}-${subtipo}.php`);
          candidatos.push(`${subtipo}.php`);
        }
        candidatos.push(`${tipo}.php`);
      }
      candidatos.push('attachment.php');
      return candidatos;
    },
  },
  {
    // `get_single_template()` (`template.php:553-576`).
    predicado: 'is_single',
    tipo: 'single',
    vale: (leitura) => leitura.tipos.unico,
    candidatos: (leitura) => {
      const objeto = leitura.objetoConsultado;
      const candidatos: string[] = [];
      if (objeto !== undefined && !vazioComoNoPhp(objeto.tipo)) {
        const tipo = objeto.tipo as string;
        // Aqui o modelo declarado sai do **objeto consultado** (`:559`), e nao
        // do global `$post` como em `get_page_template()`.
        const declarado = modeloDeclarado(
          leitura,
          identificadorDoObjetoConsultado(objeto),
        );
        if (declarado !== '') {
          candidatos.push(declarado);
        }
        const identificador = objeto.identificadorNaUrl ?? '';
        const decodificado = decodificarUrl(identificador);
        if (decodificado !== identificador) {
          candidatos.push(`single-${tipo}-${decodificado}.php`);
        }
        candidatos.push(`single-${tipo}-${identificador}.php`);
        candidatos.push(`single-${tipo}.php`);
      }
      candidatos.push('single.php');
      return candidatos;
    },
  },
  {
    // `get_page_template()` (`template.php:471-504`).
    predicado: 'is_page',
    tipo: 'page',
    vale: (leitura) => leitura.tipos.pagina,
    candidatos: (leitura) => {
      const objeto = leitura.objetoConsultado;
      const id = identificadorDoObjetoConsultado(objeto);
      const declarado = modeloDeclarado(leitura, leitura.conteudo?.id ?? 0);

      let nome = textoDoCriterio(
        criterioDaConsulta(leitura.criterios, 'pagename'),
      );
      // `if ( ! $pagename && $id )` (`:476-485`) — *"If a static page is set as
      // the front page, $pagename will not be set"*.
      if (vazioComoNoPhp(nome) && id !== 0 && objeto !== undefined) {
        nome = objeto.identificadorNaUrl ?? '';
      }

      const candidatos: string[] = [];
      if (declarado !== '') {
        candidatos.push(declarado);
      }
      if (!vazioComoNoPhp(nome)) {
        const decodificado = decodificarUrl(nome);
        if (decodificado !== nome && validarArquivo(decodificado) === 0) {
          candidatos.push(`page-${decodificado}.php`);
        }
        candidatos.push(`page-${nome}.php`);
      }
      if (id !== 0) {
        candidatos.push(`page-${id}.php`);
      }
      candidatos.push('page.php');
      return candidatos;
    },
  },
  {
    // `get_singular_template()` (`template.php:632-634`).
    predicado: 'is_singular',
    tipo: 'singular',
    vale: (leitura) => leitura.tipos.singular,
    candidatos: () => [],
  },
  {
    // `get_category_template()` (`template.php:254-272`).
    predicado: 'is_category',
    tipo: 'category',
    vale: (leitura) => leitura.tipos.categoria,
    candidatos: (leitura) =>
      candidatosDeTermo('category', leitura.objetoConsultado),
  },
  {
    // `get_tag_template()` (`template.php:300-318`).
    predicado: 'is_tag',
    tipo: 'tag',
    vale: (leitura) => leitura.tipos.etiqueta,
    candidatos: (leitura) =>
      candidatosDeTermo('tag', leitura.objetoConsultado),
  },
  {
    // `get_author_template()` (`template.php:214-226`).
    predicado: 'is_author',
    tipo: 'author',
    vale: (leitura) => leitura.tipos.autor,
    candidatos: (leitura) => {
      const conta = leitura.objetoConsultado;
      const candidatos: string[] = [];
      // `$author instanceof WP_User` (`:219`) — ver o cabecalho de
      // `./objeto-consultado.ts` sobre a discriminacao por campo.
      if (
        conta !== undefined &&
        conta.apelidoNaUrl !== undefined &&
        conta.id !== undefined
      ) {
        candidatos.push(`author-${conta.apelidoNaUrl}.php`);
        candidatos.push(`author-${conta.id}.php`);
      }
      candidatos.push('author.php');
      return candidatos;
    },
  },
  {
    // `get_date_template()` (`template.php:383-385`).
    predicado: 'is_date',
    tipo: 'date',
    vale: (leitura) => leitura.tipos.data,
    candidatos: () => [],
  },
  {
    // `get_archive_template()` (`template.php:150-162`).
    predicado: 'is_archive',
    tipo: 'archive',
    vale: (leitura) => leitura.tipos.arquivo,
    candidatos: candidatosDeArquivo,
  },
]);

/**
 * Os candidatos de categoria e de etiqueta, que o legado escreve duas vezes com
 * o mesmo corpo (`template.php:254-272` e `:300-318`).
 *
 * As duas funcoes diferem **so** no prefixo do nome de arquivo e no `$type` que
 * passam adiante; o resto — o teste `! empty( $x->slug )`, a forma decodificada
 * antes da literal, e o identificador numerico depois — e identico. Esta
 * duplicacao do legado nao e reproduzida como duplicacao porque nao ha
 * comportamento nela: o que e observavel sao os dois prefixos e os dois nomes de
 * ponto de extensao, e os dois estao declarados nas regras acima.
 */
function candidatosDeTermo(
  prefixo: string,
  termo: ObjetoConsultadoNoTema | undefined,
): readonly string[] {
  const candidatos: string[] = [];
  if (termo !== undefined && !vazioComoNoPhp(termo.identificadorDoTermo)) {
    const identificador = termo.identificadorDoTermo as string;
    const decodificado = decodificarUrl(identificador);
    if (decodificado !== identificador) {
      candidatos.push(`${prefixo}-${decodificado}.php`);
    }
    candidatos.push(`${prefixo}-${identificador}.php`);
    candidatos.push(`${prefixo}-${identificadorNoNomeDeArquivo(termo)}.php`);
  }
  candidatos.push(`${prefixo}.php`);
  return candidatos;
}

/** O `$type` da reserva final, `get_index_template()` (`template.php:118-120`). */
export const TIPO_DA_RESERVA_FINAL = 'index';
