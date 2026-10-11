/**
 * O objeto consultado **como a hierarquia de modelos o le** — o
 * `get_queried_object()` de `wp-includes/class-wp-query.php:3988-4078` visto do
 * lado de quem escolhe o modelo —, mais os dois predicados derivados que
 * `template-loader.php` chama e que **nao** estao entre as 30 propriedades
 * `is_*`: `is_front_page()` (`:4496-4507`) e `is_page( $pagina )`
 * (`:4578-4615`).
 *
 * Entrega de **T005** (US-2, CA-2.1).
 *
 * ---
 *
 * ## Por que este arquivo existe, e por que ele nao e o `get_queried_object()`
 *
 * T003 declarou `ConsultaDeConteudo.objetoConsultado` como `unknown`, e
 * escreveu a razao: *"e `unknown` porque o legado devolve quatro tipos
 * diferentes ali (`WP_Term`, `WP_Post_Type`, `WP_Post`, `WP_User`) e **nada
 * neste modulo le o conteudo dele**: o que `handle_404` pergunta e so se
 * existe"*.
 *
 * T005 e a primeira tarefa que **le o conteudo** dele: nove das dezessete
 * regras da hierarquia montam nome de arquivo a partir de campo do objeto
 * consultado. Logo este arquivo declara a leitura, e **nao** a resolucao:
 *
 * - a **resolucao** — qual dos seis colaboradores do legado (`get_term`,
 *   `get_term_by`, `get_post_type_object`, `get_post`, `get_user_by`,
 *   `get_userdata`) produz o objeto — continua fora deste modulo, por ligacao
 *   tardia, e chega pelo repositorio em `ResultadoDaConsulta.objetoConsultado`.
 *   Ela e de BC-01, BC-02 e `plataforma/tipos-de-conteudo`, e a regra de
 *   dependencia 3 proibe o `import`;
 * - a **leitura** e do nucleo: as nove regras estao em `wp-includes/template.php`
 *   e sao exatamente o que esta tarefa porta.
 *
 * `ConsultaDeConteudo.objetoConsultado` **nao muda de tipo**: alargar contrato
 * mesclado de T003 seria refazer o esqueleto. Quem precisa do conteudo passa
 * pelo reconhecedor abaixo.
 *
 * ## ⚠️ O legado discrimina por classe, e aqui a discriminacao e por campo
 *
 * Das nove regras, **oito** ja decidem por campo no proprio legado — `! empty(
 * $category->slug )` (`template.php:259`), `! empty( $term->slug )` (`:354`),
 * `! empty( $object->post_type )` (`:558` e `:607`), `if ( $attachment )`
 * (`:668`) — e para essas oito a reproducao e literal.
 *
 * A nona, `get_author_template()`, pergunta `$author instanceof WP_User`
 * (`:219`). Sem classe no destino, o equivalente e a presenca dos dois campos
 * que o ramo le, `user_nicename` e `ID`. A divergencia possivel e um objeto que
 * **nao** seja conta e carregue os dois nomes; nenhum dos seis colaboradores do
 * legado produz um assim, e por isso isto e lacuna declarada e nao decisao de
 * comportamento. A decima regra, `get_post_type_archive_template()`, tambem usa
 * `instanceof` (`:183`) e **nao** passa por aqui: ela consulta o registro de
 * tipos de conteudo, que ja chega tipado em `../consulta/registro-consultavel.ts`.
 *
 * ## Um identificador, e nao tres
 *
 * O legado le `$author->ID`, `$term->term_id` e `$post->ID` — tres nomes de
 * propriedade em tres classes. Aqui e um campo so, {@link
 * ObjetoConsultadoNoTema.id}, porque um objeto consultado e sempre **uma** das
 * quatro coisas e nunca duas: nao existe estado em que `term_id` e `ID` sejam
 * ambos legiveis no mesmo objeto. O `get_queried_object_id()` de `:4087-4090`
 * esta em {@link identificadorDoObjetoConsultado}.
 */

import type { ConteudoPorCaminho } from '../consulta/conteudo-consultado.js';
import {
  FRENTE_COMO_PAGINA,
  type ConfiguracaoDoSiteNaConsulta,
} from '../consulta/contexto-da-consulta.js';
import type { CriteriosDaConsulta } from '../consulta/criterios-da-consulta.js';
import {
  escalarComoNoPhp,
  vazioComoNoPhp,
  type ValorDaConsulta,
} from '../consulta/semantica-de-php.js';
import type { TiposDeConsulta } from '../consulta/tipo-de-consulta.js';

/**
 * O objeto consultado nos campos que a hierarquia de modelos le.
 *
 * Todos opcionais, porque cada regra da hierarquia testa o seu antes de usar —
 * e a ausencia significa, em cada uma, o que a ausencia significa no legado:
 * os candidatos especificos nao entram na lista e o candidato generico fica.
 *
 * | campo | legado | quem o le |
 * |---|---|---|
 * | `id` | `WP_User::$ID`, `WP_Term::$term_id`, `WP_Post::$ID` | autor, categoria, etiqueta, taxonomia, pagina |
 * | `apelidoNaUrl` | `WP_User::$user_nicename` | autor (`template.php:220`) |
 * | `identificadorDoTermo` | `WP_Term::$slug` | categoria, etiqueta, taxonomia |
 * | `contextoDoTermo` | `WP_Term::$taxonomy` | taxonomia (`:355`) |
 * | `tipo` | `WP_Post::$post_type` | unico, incorporacao (`:558` e `:607`) |
 * | `identificadorNaUrl` | `WP_Post::$post_name` | unico, pagina (`:483` e `:564`) |
 * | `titulo` | `WP_Post::$post_title` | `is_page( $pagina )` (`:4596`) |
 * | `tipoDeMidia` | `WP_Post::$post_mime_type` | anexo (`:669`) |
 */
export interface ObjetoConsultadoNoTema {
  readonly id?: number;
  readonly apelidoNaUrl?: string;
  readonly identificadorDoTermo?: string;
  readonly contextoDoTermo?: string;
  readonly tipo?: string;
  readonly identificadorNaUrl?: string;
  readonly titulo?: string;
  readonly tipoDeMidia?: string;
}

/**
 * O tipo que `get_page_by_path( $pagepath )` procura em
 * `class-wp-query.php:4606` — o default do legado, que e `page`.
 *
 * Declarado aqui, e nao reusado de `../consulta/conteudo-consultado.ts`, porque
 * la a constante serve a chamada de `class-wp-query.php:1080`: as duas chamadas
 * tem o mesmo valor e sao independentes, e amarra-las esconderia o dia em que o
 * legado mudar uma so.
 */
const TIPO_DE_CAMINHO_DE_PAGINA = 'page';

/**
 * `(string) $page_obj->ID` (`class-wp-query.php:4594`).
 *
 * ⚠️ Identificador ausente compara como **texto vazio**, e nao como zero: e o
 * `(string) null` do interpretador para propriedade nao definida. Escrever zero
 * aqui faria `is_page( '0' )` casar um objeto consultado sem identificador por
 * esta tentativa; no legado o que casa `'0'` e a saida antecipada de `empty()`,
 * em `:4583`, e as duas coisas diferem para quem passa lista.
 */
function identificadorComoTexto(id: number | undefined): string {
  return id === undefined ? '' : String(id);
}

/** Os sete campos de texto que este modulo le de um objeto consultado. */
const CAMPOS_DE_TEXTO = [
  'apelidoNaUrl',
  'identificadorDoTermo',
  'contextoDoTermo',
  'tipo',
  'identificadorNaUrl',
  'titulo',
  'tipoDeMidia',
] as const;

/**
 * Le o objeto consultado que a consulta trouxe, nos campos que a hierarquia
 * usa.
 *
 * Devolve `undefined` quando nao ha objeto — que e o `null` com que
 * `get_queried_object()` sai em `:3993` quando nenhum dos cinco ramos casa.
 *
 * ⚠️ **Nao valida e nao recusa: le o que reconhece e ignora o resto**, que e o
 * que o legado faz ao acessar propriedade de objeto de classe qualquer. Campo
 * com tipo diferente do declarado chega como ausente, e ausente e um estado com
 * significado em cada regra — nao um erro.
 */
export function objetoConsultadoNoTema(
  valor: unknown,
): ObjetoConsultadoNoTema | undefined {
  if (valor === null || typeof valor !== 'object') {
    return undefined;
  }

  const bruto = valor as Record<string, unknown>;
  const lido: Record<string, string | number> = {};

  if (typeof bruto['id'] === 'number') {
    lido['id'] = bruto['id'];
  }
  for (const campo of CAMPOS_DE_TEXTO) {
    const conteudo = bruto[campo];
    if (typeof conteudo === 'string') {
      lido[campo] = conteudo;
    }
  }

  return Object.freeze(lido) as ObjetoConsultadoNoTema;
}

/**
 * `WP_Query::get_queried_object_id()` (`class-wp-query.php:4087-4090`) —
 * `$this->queried_object_id ?? 0`.
 *
 * ⚠️ **No legado o identificador e o objeto sao dois campos, e eles divergem em
 * dois ramos:** `is_post_type_archive` grava o objeto e **nao** grava o
 * identificador (`:4046`), e `is_author` grava o identificador **antes** de
 * saber se a conta existe, logo pode ficar com identificador e sem objeto
 * (`:4057-4075`). Aqui o identificador sai do objeto, e os dois ramos nao sao
 * alcancados por quem chama esta funcao: o unico chamador da hierarquia e
 * `get_page_template()` (`template.php:472`), que so roda sob `is_page`, onde o
 * legado grava os dois juntos (`:4051` ou `:4055`). Quem precisar da divergencia
 * — e ninguem nesta feature precisa — a traz do repositorio como campo proprio.
 */
export function identificadorDoObjetoConsultado(
  objeto: ObjetoConsultadoNoTema | undefined,
): number {
  return objeto?.id ?? 0;
}

/**
 * `WP_Query::is_page( $pagina )` (`class-wp-query.php:4578-4615`).
 *
 * O predicado com argumento, que **nao** e a propriedade `is_page`: sem
 * argumento ele e a propriedade, com argumento ele compara o objeto consultado
 * com o que recebeu, em quatro tentativas e nesta ordem — identificador, titulo,
 * identificador na URL, e caminho de pagina.
 *
 * ⚠️ **A quarta tentativa e o unico ponto da apresentacao que procura conteudo
 * por caminho**, e ela so acontece para valor que contem `/` **fora da primeira
 * posicao**: o legado usa `! strpos( $pagepath, '/' )` (`:4602`), e `strpos`
 * devolve `0` para barra inicial, que e falso — logo `'/sobre'` e saltado e
 * `'pai/filho'` nao. Trocar por `str_contains` faria `is_page( '/sobre' )`
 * consultar o banco onde o legado nao consulta.
 *
 * O unico chamador do nucleo e `is_front_page()`, que passa a opcao
 * `page_on_front` — um inteiro. As quatro tentativas estao portadas inteiras
 * porque o predicado e superficie publicada (`wp-includes/query.php`), e P8
 * proibe entregar menos do que ele faz.
 */
export function consultaDePagina(
  tipos: TiposDeConsulta,
  objeto: ObjetoConsultadoNoTema | undefined,
  pagina: ValorDaConsulta | undefined,
  conteudoPorCaminho: ConteudoPorCaminho,
): boolean {
  if (!tipos.pagina) {
    return false;
  }
  if (vazioComoNoPhp(pagina)) {
    return true;
  }
  if (objeto === undefined) {
    return false;
  }

  // `array_map( 'strval', (array) $page )` (`:4592`).
  const pedidos = (escalarComoNoPhp(pagina) ? [pagina] : pagina ?? []).map(
    (valor) => String(valor),
  );

  if (pedidos.includes(identificadorComoTexto(objeto.id))) {
    return true;
  }
  if (objeto.titulo !== undefined && pedidos.includes(objeto.titulo)) {
    return true;
  }
  if (
    objeto.identificadorNaUrl !== undefined &&
    pedidos.includes(objeto.identificadorNaUrl)
  ) {
    return true;
  }

  for (const caminho of pedidos) {
    const barra = caminho.indexOf('/');
    if (barra <= 0) {
      continue;
    }
    const achado = conteudoPorCaminho(caminho, TIPO_DE_CAMINHO_DE_PAGINA);
    if (achado !== undefined && achado.id === objeto.id) {
      return true;
    }
  }

  return false;
}

/**
 * `WP_Query::is_front_page()` (`class-wp-query.php:4496-4507`).
 *
 * E a quarta regra da cascata de `template-loader.php` e **nao** e uma das 30
 * propriedades `is_*`: ela e derivada, de duas opcoes do site mais um predicado.
 *
 * Os dois ramos, na ordem do legado:
 *
 * 1. o caso provavel, que o proprio legado comenta como *"Most likely case"*:
 *    `show_on_front` em `'posts'` **e** `is_home()`. Com os valores de fabrica
 *    de uma instalacao nova de site unico (`schema.php:476`), e este ramo que
 *    vale, e por isso a frente de um site novo procura `front-page.php` antes de
 *    `home.php`;
 * 2. `show_on_front` em `'page'`, `page_on_front` com valor, e o objeto
 *    consultado sendo aquela pagina.
 *
 * ⚠️ `page_on_front` nasce em **zero** (`schema.php:519`), e zero e vazio para o
 * interpretador: num site novo o segundo ramo nunca roda, mesmo que alguem troque
 * so o `show_on_front`.
 */
export function consultaDaPaginaDaFrente(
  tipos: TiposDeConsulta,
  objeto: ObjetoConsultadoNoTema | undefined,
  configuracao: ConfiguracaoDoSiteNaConsulta,
  conteudoPorCaminho: ConteudoPorCaminho,
): boolean {
  if (configuracao.mostrarNaFrente === 'posts' && tipos.inicio) {
    return true;
  }
  return (
    configuracao.mostrarNaFrente === FRENTE_COMO_PAGINA &&
    !vazioComoNoPhp(configuracao.paginaDaFrente) &&
    consultaDePagina(
      tipos,
      objeto,
      configuracao.paginaDaFrente,
      conteudoPorCaminho,
    )
  );
}

/**
 * `get_query_var( $nome )` restrito ao que a apresentacao le — `pagename` em
 * `template.php:474` e `post_type` em `:151` e `:177`.
 *
 * Esta aqui, e nao em `../consulta/`, porque o que o legado faz nesses tres
 * pontos e ler `$wp_query->query_vars[ $nome ]` com default texto vazio
 * (`wp-includes/query.php`), e e esse default — e nao a ausencia — que as tres
 * leituras testam.
 */
export function criterioDaConsulta(
  criterios: CriteriosDaConsulta,
  nome: string,
): ValorDaConsulta {
  return criterios[nome] ?? '';
}
