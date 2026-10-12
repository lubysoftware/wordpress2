/**
 * A expansao da macro textual de ponta a ponta — `do_shortcode()`
 * (`wp-includes/shortcodes.php:243`), o apelido `apply_shortcodes()` (`:223`),
 * `do_shortcode_tag()` (`:392`), `strip_shortcodes()` (`:706`) e
 * `strip_shortcode_tag()` (`:757`).
 *
 * Entrega de **T017** (US-8): aqui estao **CA-8.1**, **CA-8.2** e **CA-8.3**, e
 * daqui saem as duas chamadas do caminho de CA-8.4 em `./macros-em-atributo.ts`.
 *
 * ---
 *
 * ## CA-8.3 e uma propriedade desta assinatura, e nao um teste
 *
 * CA-8.3 e *"a expansao acontece na renderizacao, nao na gravacao: o corpo
 * gravado continua com a marca"*. Ela e verdadeira aqui porque
 * {@link expandirMacros} **recebe texto e devolve texto**: nao recebe
 * identificador de conteudo, nao recebe a porta de dados e nao tem como gravar.
 * O modulo tambem nao a poe em caminho de gravacao nenhum — ele e de leitura
 * publica.
 *
 * E e assim no legado, por posicao de registro e nao por promessa:
 * `add_filter( 'the_content', 'do_shortcode', 11 ); // AFTER wpautop().`
 * (`wp-includes/default-filters.php:209`). Esta em
 * {@link LIGACAO_NA_RENDERIZACAO} como dado, com os quatro pontos em que o
 * legado liga a expansao e a prioridade de cada um — porque a prioridade e o que
 * decide a ordem contra `wpautop` (10) e contra `wp_filter_content_tags` (12), e
 * ordem de ponto de extensao e contrato publico (P2, e a tabela *Nao negociavel*
 * da constituicao).
 *
 * O risco 4 do [plano](../../../../.specify/specs/004-leitura-publica/plan.md)
 * desta feature nomeia exatamente o jeito de perder CA-8.3: *"a expansao de
 * macro textual acontece na renderizacao, e o corpo gravado continua com a
 * macro. Expandir na gravacao e mais rapido e muda o que fica gravado."*
 *
 * ## As tres saidas antecipadas, e por que cada uma e observavel
 *
 * | # | teste | legado | o que o visitante ve |
 * |---|---|---|---|
 * | 1 | o corpo nao tem `[` | `:246` | o corpo, intocado — **nem a normalizacao de entidade roda** |
 * | 2 | nenhuma marca esta registrada | `:250` | idem; e o estado de `REGISTRO_SEM_MACROS` |
 * | 3 | nenhuma marca **registrada** aparece no corpo | `:258` | idem; e **CA-8.2** no caso de a marca escrita nao existir |
 *
 * ⚠️ A diferenca entre sair por uma das tres e seguir adiante nao e so
 * desempenho: seguir adiante faz a normalizacao `&#91;` para `&#091;` rodar no
 * corpo inteiro, e ela sobra depois do desfazer. Ver o cabecalho de
 * `./macros-em-atributo.ts`. Logo o corpo `a &#91;b` sai igual quando nenhuma
 * marca esta registrada, e sai como `a &#091;b` quando qualquer marca esta
 * registrada **e** aparece no corpo.
 */

import {
  contextoDaMacroResolvido,
  type ContextoDaMacro,
  type ContextoDaMacroResolvido,
  type EstadoDoContextoDeImagem,
  type PontosDaMacro,
} from './contexto-da-macro.js';
import {
  desfazerEsconderijoDeColchete,
  expandirMacrosNoHtml,
  type PassoNoHtml,
} from './macros-em-atributo.js';
import { atributosDaMacro } from './atributos-da-macro.js';
import {
  expressaoDeMacro,
  marcasDoCorpoEntre,
  marcasDoCorpoParaExpandir,
} from './regex-de-macro.js';
import {
  chamavelComoNoPhp,
  marcasRegistradas,
} from './registro-de-macros.js';
import {
  substituirComCallback,
  type AchadoDoPhp,
} from './semantica-de-pcre.js';

/** Onde o legado liga a expansao, com a prioridade de cada ligacao. */
export interface LigacaoDaExpansao {
  /** O ponto de extensao em que `do_shortcode` entra. */
  readonly ponto: string;
  /** A prioridade, que decide a ordem contra os vizinhos. */
  readonly prioridade: number;
  /** O arquivo e a linha do `add_filter()`. */
  readonly legado: string;
  /** O comentario que o legado escreveu na propria linha, quando ha. */
  readonly nota: string;
}

/**
 * Os quatro pontos em que o legado liga a expansao, como **dado** — a evidencia
 * de **CA-8.3**.
 *
 * Nenhum deles e ligado por este modulo: ligar ponto de extensao e trabalho do
 * barramento (`plataforma/barramento/`), que nao existe nesta arvore. A tabela
 * esta aqui para que a prioridade nao se perca — e a prioridade 11 contra a 10
 * de `wpautop` e a 12 de `wp_filter_content_tags` que faz a marca ser expandida
 * **depois** de o paragrafo ser montado e **antes** de a imagem receber
 * `loading` e `srcset`.
 */
export const LIGACAO_NA_RENDERIZACAO: readonly LigacaoDaExpansao[] =
  Object.freeze([
    Object.freeze({
      ponto: 'the_content',
      prioridade: 11,
      legado: 'wp-includes/default-filters.php:209',
      nota: 'AFTER wpautop().',
    }),
    Object.freeze({
      ponto: 'widget_text_content',
      prioridade: 11,
      legado: 'wp-includes/default-filters.php:245',
      nota: 'Runs after wpautop(); note that $post global will be null when shortcodes run.',
    }),
    Object.freeze({
      ponto: 'widget_block_content',
      prioridade: 11,
      legado: 'wp-includes/default-filters.php:249',
      nota: '',
    }),
    Object.freeze({
      // `WP_Embed::run_shortcode()` roda a expansao com o registro reduzido a
      // `embed`, antes de `the_content` (`class-wp-embed.php:69-80`).
      ponto: 'WP_Embed::run_shortcode',
      prioridade: 8,
      legado: 'wp-includes/class-wp-embed.php:41',
      nota: 'Attempts to embed all URLs in a post before anything else.',
    }),
  ]);

/** Por qual das quatro saidas de `do_shortcode()` o corpo saiu. */
export type SaidaDaExpansao =
  /** `! str_contains( $content, '[' )` (`:246`). */
  | 'sem-colchete'
  /** `empty( $shortcode_tags )` (`:250`). */
  | 'sem-marca-registrada'
  /** `empty( $tagnames )` (`:258`) — nenhuma registrada aparece no corpo. */
  | 'nenhuma-marca-no-corpo'
  /** O caminho completo: `:270` a `:276`. */
  | 'expandiu';

/** O que {@link expandirMacros} recebe alem do corpo. */
export interface OpcoesDaExpansao {
  readonly contexto?: ContextoDaMacro;
  readonly pontosDeExtensao?: PontosDaMacro;
  /**
   * `$ignore_html` (`:243`), default **falso**.
   *
   * ⚠️ Verdadeiro, **nenhum** atributo e expandido: todo colchete dentro de
   * elemento e escondido e devolvido literal. O docblock do legado o resume como
   * *"When true, shortcodes inside HTML elements will be skipped"* (`:239-240`),
   * e nenhum dos quatro pontos de {@link LIGACAO_NA_RENDERIZACAO} o liga — quem
   * o liga e `strip_shortcodes()` (`:728`).
   */
  readonly ignorarHtml?: boolean;
  readonly contextoDeImagem?: EstadoDoContextoDeImagem;
}

/** O corpo expandido, com o registro de como se chegou nele. */
export interface ExpansaoDeMacros {
  /** O corpo com as marcas registradas expandidas — **CA-8.1**. */
  readonly texto: string;
  readonly saida: SaidaDaExpansao;
  /**
   * As marcas registradas que apareceram no corpo, na **ordem de registro** —
   * o `$tagnames` de `:256`, que e a ordem da alternancia da expressao.
   */
  readonly marcas: readonly string[];
  /** O registro do caminho de **CA-8.4**, um passo por elemento HTML. */
  readonly passosNoHtml: readonly PassoNoHtml[];
  /**
   * O `$filter_added` de `:265` — se **esta** chamada registrou o filtro de
   * contexto de imagem, e portanto se e ela que o remove no fim.
   *
   * Falso na expansao aninhada, que e o ponto do teste de `:263`.
   */
  readonly registrouContextoDeImagem: boolean;
}

/** A expansao que saiu por uma das tres portas antecipadas. */
function saidaAntecipada(
  corpo: string,
  saida: SaidaDaExpansao,
  marcas: readonly string[] = [],
): ExpansaoDeMacros {
  return Object.freeze({
    texto: corpo,
    saida,
    marcas: Object.freeze([...marcas]),
    passosNoHtml: Object.freeze([]),
    registrouContextoDeImagem: false,
  });
}

/**
 * `do_shortcode( $content, $ignore_html )` (`wp-includes/shortcodes.php:243`).
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). E a mesma
 * declaracao das outras operacoes desta feature, e aqui ela e mais forte do que
 * um default aberto: `shortcodes.php` nao tem **uma** chamada de
 * `current_user_can()` em 764 linhas, e UC-01 registra que a leitura publica nao
 * verifica capacidade nenhuma. A unica fronteira de autorizacao que o arquivo
 * toca e `wp_kses_one_attr()`, e ela chega por ligacao tardia — ver
 * `./contexto-da-macro.ts`.
 *
 * A ordem das cinco etapas e a do legado, e nenhuma delas e trocavel:
 *
 * 1. as tres saidas antecipadas (`:246`, `:250`, `:258`);
 * 2. o registro condicional do filtro de contexto de imagem (`:263-268`);
 * 3. a expansao **dentro** de elemento HTML (`:270`), que roda **antes**;
 * 4. a expansao no corpo (`:273`);
 * 5. o desfazer do esconderijo (`:276`), sempre.
 *
 * ⚠️ A etapa 3 antes da 4 e o que faz a marca dentro de atributo ser tratada
 * pelo caminho proprio: depois dela, todo colchete que sobrou dentro de elemento
 * esta escondido, e a etapa 4 nao o confunde com marca.
 */
export function expandirMacros(
  corpo: string,
  opcoes: OpcoesDaExpansao = {},
): ExpansaoDeMacros {
  const contexto = contextoDaMacroResolvido(opcoes.contexto);
  const pontos = opcoes.pontosDeExtensao ?? {};

  // Saida 1 (`:246`) — `str_contains`, e nao a expressao: o corpo sem `[` nao
  // pode ter marca, e nem a normalizacao de entidade roda.
  if (!corpo.includes('[')) {
    return saidaAntecipada(corpo, 'sem-colchete');
  }

  // Saida 2 (`:250`) — `empty( $shortcode_tags ) || ! is_array( ... )`. A
  // segunda metade nao e alcancavel aqui: o tipo do registro e `Map`.
  if (contexto.registro.size === 0) {
    return saidaAntecipada(corpo, 'sem-marca-registrada');
  }

  // Saida 3 (`:258`) — nenhuma marca REGISTRADA aparece no corpo. E **CA-8.2**
  // pelo caminho mais comum: a marca escrita nao existe, e o corpo sai igual.
  const marcas = marcasDoCorpoParaExpandir(contexto.registro, corpo);
  if (marcas.length === 0) {
    return saidaAntecipada(corpo, 'nenhuma-marca-no-corpo');
  }

  // `// Ensure this context is only added once if shortcodes are nested.`
  // (`:262-268`). `add_filter()` devolve sempre verdadeiro, logo `$filter_added`
  // e exatamente a negacao de `$has_filter`.
  const registrouContextoDeImagem =
    opcoes.contextoDeImagem?.jaRegistrado !== true;

  const expressao = expressaoDeMacro(marcas);
  const expandirUmaMarca = (achado: AchadoDoPhp): string =>
    expandirUmaMacro(achado, contexto, pontos);

  // Etapa 3 (`:270`) — dentro de elemento, antes do corpo.
  const noHtml = expandirMacrosNoHtml(
    corpo,
    opcoes.ignorarHtml ?? false,
    expressao,
    contexto,
    expandirUmaMarca,
  );

  // Etapa 4 (`:273`) — o corpo.
  const noCorpo = substituirComCallback(
    expressao,
    noHtml.texto,
    expandirUmaMarca,
  );

  // Etapa 5 (`:275-276`) — sempre, inclusive quando nada expandiu.
  return Object.freeze({
    texto: desfazerEsconderijoDeColchete(noCorpo.texto),
    saida: 'expandiu',
    marcas,
    passosNoHtml: noHtml.passos,
    registrouContextoDeImagem,
  });
}

/**
 * `apply_shortcodes( $content, $ignore_html )`
 * (`wp-includes/shortcodes.php:223`).
 *
 * **Apelido, e nada alem disso** — o corpo do legado e uma linha, `return
 * do_shortcode( $content, $ignore_html );` (`:224`), e o docblock diz *"This
 * function is an alias for do_shortcode()"*. Esta aqui porque e funcao publicada
 * desde 5.4.0, e P8 nao admite que uma superficie publicada deixe de existir —
 * nem quando ela nao faz nada por conta propria.
 */
export function aplicarMacros(
  corpo: string,
  opcoes: OpcoesDaExpansao = {},
): ExpansaoDeMacros {
  return expandirMacros(corpo, opcoes);
}

/**
 * `do_shortcode_tag( $m )` (`wp-includes/shortcodes.php:392`).
 *
 * O tratador de uma ocorrencia. Recebe o achado na forma do arranjo do
 * interpretador, e le os grupos **por numero** — e e por isso que o aviso em
 * maiusculas de `get_shortcode_regex()` vale para esta funcao.
 *
 * As decisoes, na ordem:
 *
 * 1. **o escape `[[marca]]`** (`:395-398`): com `$m[1]` igual a `[` **e** `$m[6]`
 *    igual a `]`, devolve `substr( $m[0], 1, -1 )` — a ocorrencia inteira sem o
 *    primeiro e o ultimo caractere. O tratador nao e chamado e nenhum dos dois
 *    filtros dispara. ⚠️ O teste exige **os dois** colchetes: `[[marca]` tem
 *    `$m[1]` igual a `[` e `$m[6]` vazio, logo **expande**, e o `[` da frente
 *    sobrevive por `:434`;
 * 2. **o tratador que nao e chamavel** (`:403-410`): avisa e devolve a ocorrencia
 *    **inteira e literal**. E **CA-8.2** pelo segundo caminho — a marca
 *    registrada com tratador quebrado tambem fica no texto como foi escrita;
 * 3. **`pre_do_shortcode_tag`** (`:427-430`): qualquer retorno diferente de
 *    `false` curto-circuita, inclusive texto vazio;
 * 4. **o tratador** (`:434`), com a saida entre `$m[1]` e `$m[6]`;
 * 5. **`do_shortcode_tag`** (`:447`).
 *
 * ⚠️ A etapa 4 concatena `$m[1]` e `$m[6]` em torno da saida, e isso **nao** e o
 * escape: e o caso do escape pela metade. Num `[marca]` comum os dois sao texto
 * vazio e a concatenacao e invisivel.
 */
export function expandirUmaMacro(
  achado: AchadoDoPhp,
  contexto: ContextoDaMacroResolvido,
  pontos: PontosDaMacro = {},
): string {
  const inteiro = achado[0] as string;
  const colcheteDaFrente = achado[1] ?? '';
  const colcheteDoFim = achado[6] ?? '';

  // `// Allow [[foo]] syntax for escaping a tag.` (`:395-398`)
  if (colcheteDaFrente === '[' && colcheteDoFim === ']') {
    return inteiro.slice(1, -1);
  }

  const marca = achado[2] as string;
  const atributos = atributosDaMacro(achado[3] ?? '');
  const tratador = contexto.registro.get(marca);

  if (!chamavelComoNoPhp(tratador)) {
    contexto.avisar({
      funcao: 'do_shortcode_tag',
      // `sprintf` de `:406-407`.
      mensagem: `Attempting to parse a shortcode without a valid callback: ${marca}`,
      versao: '4.3.0',
    });
    return inteiro;
  }

  // `pre_do_shortcode_tag` (`:427`) — default `false`, e o teste e
  // `false !== $return`.
  let curto: string | false = false;
  for (const intercepcao of pontos.antesDaMarca ?? []) {
    curto = intercepcao(curto, marca, atributos, achado);
  }
  if (curto !== false) {
    return curto;
  }

  // `$content = $m[5] ?? null` (`:432`). Ver `achadoComoNoPhp`: na forma do
  // arranjo do interpretador o grupo 6 sempre participa, logo isto e texto vazio
  // e nao nulo quando a marca nao envolve conteudo.
  const conteudo = achado[5] ?? null;

  let saida =
    colcheteDaFrente + tratador(atributos, conteudo, marca) + colcheteDoFim;

  // `do_shortcode_tag` (`:447`).
  for (const intercepcao of pontos.sobreAMarcaExpandida ?? []) {
    saida = intercepcao(saida, marca, atributos, achado);
  }
  return saida;
}

/** O que {@link removerMacrosDoCorpo} recebe alem do corpo. */
export interface OpcoesDaRemocao {
  readonly contexto?: ContextoDaMacro;
  readonly pontosDeExtensao?: PontosDaMacro;
}

/**
 * `strip_shortcodes( $content )` (`wp-includes/shortcodes.php:706`).
 *
 * A outra metade da renderizacao do corpo: onde `the_content` expande, o resumo
 * **remove**. Nao e criterio de aceite de US-8, e esta aqui por tres razoes:
 * e funcao publicada desde 2.5.0 e P8 nao admite que ela deixe de existir; usa a
 * **mesma** maquinaria desta tarefa, sem uma decisao nova; e e o unico chamador
 * do `$ignore_html` verdadeiro (`:728`), que sem ela ficaria sem nenhum.
 *
 * Tres diferencas em relacao a {@link expandirMacros}, e todas as tres sao
 * observaveis:
 *
 * 1. a lista de marcas passa pelo filtro `strip_shortcodes_tagnames`
 *    (`:726`) **antes** do recorte contra o corpo, logo um interceptador pode
 *    acrescentar marca que nao esta registrada;
 * 2. `$ignore_html` e **verdadeiro** (`:728`): nenhum atributo e expandido;
 * 3. **nao** registra o filtro de contexto de imagem — nenhum tratador e chamado,
 *    logo nenhuma imagem de anexo e montada.
 */
export function removerMacrosDoCorpo(
  corpo: string,
  opcoes: OpcoesDaRemocao = {},
): ExpansaoDeMacros {
  const contexto = contextoDaMacroResolvido(opcoes.contexto);
  const pontos = opcoes.pontosDeExtensao ?? {};

  if (!corpo.includes('[')) {
    return saidaAntecipada(corpo, 'sem-colchete');
  }
  if (contexto.registro.size === 0) {
    return saidaAntecipada(corpo, 'sem-marca-registrada');
  }

  // `$tags_to_remove = array_keys( $shortcode_tags )` (`:718`) e o filtro de
  // `:726`, **antes** do `array_intersect` de `:728`.
  let aRemover = marcasRegistradas(contexto.registro);
  for (const intercepcao of pontos.sobreAsMarcasRemovidas ?? []) {
    aRemover = intercepcao(aRemover, corpo);
  }

  const marcas = marcasDoCorpoEntre(aRemover, corpo);
  if (marcas.length === 0) {
    return saidaAntecipada(corpo, 'nenhuma-marca-no-corpo', marcas);
  }

  const expressao = expressaoDeMacro(marcas);
  const noHtml = expandirMacrosNoHtml(
    corpo,
    // `do_shortcodes_in_html_tags( $content, true, $tagnames )` (`:728`).
    true,
    expressao,
    contexto,
    removerUmaMacro,
  );
  const noCorpo = substituirComCallback(
    expressao,
    noHtml.texto,
    removerUmaMacro,
  );

  return Object.freeze({
    texto: desfazerEsconderijoDeColchete(noCorpo.texto),
    saida: 'expandiu',
    marcas,
    passosNoHtml: noHtml.passos,
    registrouContextoDeImagem: false,
  });
}

/**
 * `strip_shortcode_tag( $m )` (`wp-includes/shortcodes.php:757`).
 *
 * Devolve `$m[1] . $m[6]`, isto e, **os colchetes extras do escape e nada
 * mais** — a marca, os atributos e o conteudo que ela envolve desaparecem
 * juntos. E o escape `[[marca]]` sobrevive pela mesma linha que em
 * `do_shortcode_tag()` (`:759-761`), com o mesmo comentario.
 *
 * ⚠️ O conteudo envolvido **vai embora**: `[marca]texto[/marca]` nao deixa
 * `texto`, deixa nada. E o que faz o resumo automatico perder o que estava
 * dentro de uma marca.
 */
export function removerUmaMacro(achado: AchadoDoPhp): string {
  const inteiro = achado[0] as string;
  const colcheteDaFrente = achado[1] ?? '';
  const colcheteDoFim = achado[6] ?? '';

  // `// Allow [[foo]] syntax for escaping a tag.` (`:758-761`)
  if (colcheteDaFrente === '[' && colcheteDoFim === ']') {
    return inteiro.slice(1, -1);
  }
  return colcheteDaFrente + colcheteDoFim;
}
