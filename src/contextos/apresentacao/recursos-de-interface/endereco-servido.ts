/**
 * O endereco servido de cada recurso — a parte de `WP_Scripts::do_item()`
 * (`wp-includes/class-wp-scripts.php:284`) e de `WP_Styles::do_item()`
 * (`wp-includes/class-wp-styles.php:137`) que decide **se** o recurso e
 * entregue e **com que endereco**, inclusive `WP_Styles::_css_href()`
 * (`class-wp-styles.php:405`).
 *
 * Entrega de **T023** (US-11). E aqui que mora **CA-11.3** — *"a versao
 * declarada entra no endereco servido, de modo que trocar a versao invalide o
 * cache do navegador"* — e a forma e a do legado: `ver=` na cadeia de consulta,
 * codificada por `rawurlencode()`, antes do argumento de enfileiramento e antes
 * do fragmento (`class-wp-scripts.php:420`-`:445`, `class-wp-styles.php:410`-`:441`).
 *
 * ## A marcacao nao e montada aqui
 *
 * `do_item()` termina imprimindo `<script src=... id="{handle}-js">` ou
 * `<link rel='stylesheet' id='{handle}-css' ... />`. A arvore nao monta HTML:
 * a montagem e da borda, como `identidade-e-acesso` e `leitura-publica` ja
 * registraram. O que sai daqui e {@link RecursoEntregue} — o identificador e o
 * endereco ja saneado, na ordem em que o legado os imprimiria —, que e o
 * contrato servidor→cliente que BR-MIGRAR-117 (`ESC-CLIENTE`) nomeia: *"o
 * registro de scripts e estilos com suas dependencias"*.
 *
 * ## O saneamento do endereco chega por ligacao tardia, e as duas especies usam funcoes diferentes
 *
 * O script passa por `esc_url_raw()` (`class-wp-scripts.php:448`) e o estilo
 * por `esc_url()` (`class-wp-styles.php:446`) — a segunda e a de **exibicao**,
 * e troca `&` por `&#038;`. Logo o mesmo endereco com `ver=` e argumento sai
 * com byte diferente nas duas especies, e e o legado. As duas funcoes sao de
 * `plataforma/formatacao` (feature `015`), que nao existe nesta arvore: entram
 * em {@link ContextoDoRegistro}.
 */

import type { RecursoRegistrado } from './registro-de-dependencias.js';

/** As duas especies de recurso: `WP_Scripts` e `WP_Styles`. */
export type EspecieDeRecurso = 'script' | 'estilo';

/**
 * As tres propriedades de `WP_Scripts`/`WP_Styles` que o endereco usa,
 * preenchidas no legado por `wp_default_scripts()`
 * (`wp-includes/script-loader.php:749`-`:751`) e `wp_default_styles()`
 * (`:1583`-`:1585`).
 */
export interface ConfiguracaoDoRegistro {
  /** `$base_url` — `site_url()`, prefixado a endereco relativo. */
  readonly enderecoBase: string;
  /** `$content_url` — `WP_CONTENT_URL`, ou `''` sem a constante. */
  readonly enderecoDoConteudo: string;
  /**
   * `$default_version` — `get_bloginfo( 'version' )`. `null` e o registro
   * antes de `wp_default_scripts`: o `is_string()` de
   * `class-wp-scripts.php:421` falha e a versao `false` nao vira versao nenhuma.
   */
  readonly versaoPadrao: string | null;
}

/**
 * Um aviso de uso indevido — o `_doing_it_wrong()` do legado
 * (`wp-includes/functions.php:6112`).
 *
 * **Gemeo declarado de `AvisoDeUsoIndevido` de `leitura-publica` e de
 * `plataforma/autorizacao`**, e a repeticao e a regra de dependencia 3: o lugar
 * dele e `plataforma/barramento/`, que nao existe nesta arvore.
 */
export interface AvisoDeUsoIndevido {
  readonly funcao: string;
  readonly mensagem: string;
  readonly versao: string;
}

/** Quem recebe o aviso. Nao devolve nada, e e de proposito (P7). */
export type RelatorDeUsoIndevido = (aviso: AvisoDeUsoIndevido) => void;

/** As ligacoes tardias do registro. */
export interface ContextoDoRegistro {
  /** `esc_url_raw()` — o saneamento do endereco do **script**. */
  escaparEnderecoBruto(endereco: string): string;
  /** `esc_url()` — o saneamento do endereco do **estilo**, para exibicao. */
  escaparEnderecoParaExibir(endereco: string): string;
  /**
   * Quem recebe o `_doing_it_wrong()` da dependencia ausente.
   *
   * ⚠️ **Ausente, ninguem recebe o aviso, e nenhuma decisao muda** (P7): o
   * recurso ja foi derrubado antes de avisar (`class-wp-dependencies.php:231`).
   */
  readonly avisar?: RelatorDeUsoIndevido;
}

/** Um recurso entregue — o que `do_item()` imprimiria. */
export interface RecursoEntregue {
  readonly identificador: string;
  /** O endereco servido, com a versao, ja saneado. */
  readonly endereco: string;
}

/**
 * Os pontos de extensao que este caminho dispararia, com a ancora.
 *
 * O barramento (REQ-162) esta em `do-not-rewrite.md`: os nomes ficam
 * declarados aqui, no arquivo que os emitiria, e **nenhum e disparado**. Sem
 * interceptador, todos devolvem o valor que receberam — que e o que o codigo
 * abaixo usa.
 */
export const PONTOS_DE_EXTENSAO_DOS_RECURSOS = {
  /** `class-wp-scripts.php:170` — monta os scripts de fabrica. */
  scriptsDeFabrica: 'wp_default_scripts',
  /** `class-wp-styles.php:121` — monta os estilos de fabrica. */
  estilosDeFabrica: 'wp_default_styles',
  /** `class-wp-scripts.php:803` — filtra `to_do` no nivel de cima. */
  ordemDosScripts: 'print_scripts_array',
  /** `class-wp-styles.php:390` — idem, para estilo. */
  ordemDosEstilos: 'print_styles_array',
  /** `class-wp-scripts.php:448` — filtra o endereco antes de `esc_url_raw()`. */
  enderecoDoScript: 'script_loader_src',
  /** `class-wp-styles.php:445` — filtra o endereco antes de `esc_url()`. */
  enderecoDoEstilo: 'style_loader_src',
  /** `class-wp-scripts.php:496` — filtra a marcacao do script. */
  marcacaoDoScript: 'script_loader_tag',
  /** `class-wp-styles.php:225` — filtra a marcacao do estilo. */
  marcacaoDoEstilo: 'style_loader_tag',
} as const;

/** Texto falso no PHP: `''` e `'0'`. */
function falsoNoPhp(valor: string | false): boolean {
  return valor === false || valor === '' || valor === '0';
}

/**
 * `rawurlencode()`: tudo fora de `A-Za-z0-9-_.~` vira `%XX` maiusculo. A
 * codificacao do runtime deixa `!`, `'`, `(`, `)` e `*` passarem. Gemea de
 * `codificarParaUrlCrua` de `identidade-e-acesso`, repetida pela regra de
 * dependencia 3.
 */
export function codificarComoRawurlencode(texto: string): string {
  return encodeURIComponent(texto).replace(
    /[!'()*]/g,
    (caractere) => `%${caractere.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * A versao que vai para o endereco (`class-wp-scripts.php:420`-`:425`,
 * `class-wp-styles.php:410`-`:415`).
 *
 * `empty( $ver ) && null !== $ver` pega `false`, `''`, `'0'` e `0`, e so ai a
 * versao do produto entra — **`'0'` declarado vira a versao do produto**. Fora
 * disso, `(string)` sobre escalar: `true` e `'1'`.
 *
 * Aproximacao registrada: numero fracionario que o PHP escreve em notacao
 * cientifica (`1.0E+25`) sai aqui como o runtime o escreve. Nenhuma versao do
 * nucleo e numero.
 */
export function versaoParaOEndereco(
  versao: string | number | boolean | null,
  versaoPadrao: string | null,
): string {
  const vazia = versao === false || versao === '' || versao === '0' || versao === 0;
  if (vazia && versaoPadrao !== null) {
    return versaoPadrao;
  }
  if (versao === null) {
    return '';
  }
  if (typeof versao === 'boolean') {
    return versao ? '1' : '';
  }
  return String(versao);
}

/**
 * O endereco com a versao e o argumento de enfileiramento, antes do saneamento
 * (`class-wp-scripts.php:416`-`:445`; `class-wp-styles.php:406`-`:441`).
 *
 * 1. Endereco que nao e absoluto (`|^(https?:)?//|`) e nao comeca pelo endereco
 *    do conteudo ganha o endereco base na frente.
 * 2. O fragmento sai, `ver=` entra (com `?` ou `&`), o argumento entra depois,
 *    e o fragmento volta no fim.
 */
export function enderecoComVersao(
  endereco: string,
  versao: string | number | boolean | null,
  argumentoDaFila: string | undefined,
  configuracao: ConfiguracaoDoRegistro,
): string {
  let servido = endereco;
  if (
    !/^(https?:)?\/\//.test(servido) &&
    !(
      !falsoNoPhp(configuracao.enderecoDoConteudo) &&
      servido.startsWith(configuracao.enderecoDoConteudo)
    )
  ) {
    servido = configuracao.enderecoBase + servido;
  }

  const versaoAcrescida = versaoParaOEndereco(versao, configuracao.versaoPadrao);
  const argumento = argumentoDaFila ?? '';

  if (versaoAcrescida !== '' || argumento !== '') {
    const inicioDoFragmento = servido.indexOf('#');
    let fragmento: string | null = null;
    if (inicioDoFragmento !== -1) {
      fragmento = servido.slice(inicioDoFragmento);
      servido = servido.slice(0, inicioDoFragmento);
    }
    if (versaoAcrescida !== '') {
      servido += `${servido.includes('?') ? '&' : '?'}ver=${codificarComoRawurlencode(versaoAcrescida)}`;
    }
    if (argumento !== '') {
      servido += `${servido.includes('?') ? '&' : '?'}${argumento}`;
    }
    if (fragmento !== null) {
      servido += fragmento;
    }
  }

  return servido;
}

/** O estado do registro que `do_item()` le e escreve. */
export interface EstadoDoItem {
  readonly registrados: ReadonlyMap<string, RecursoRegistrado>;
  readonly argumentosDaFila: ReadonlyMap<string, string>;
  readonly configuracao: ConfiguracaoDoRegistro;
  readonly contexto: ContextoDoRegistro;
  readonly entregues: RecursoEntregue[];
}

/**
 * `do_item( $handle )` da especie: `true` conta o recurso como feito.
 *
 * Os tres desfechos que o legado tem com o grupo `false` e sem dado extra:
 *
 * | caso | legado | resultado |
 * |---|---|---|
 * | fora do registro | `class-wp-dependencies.php:173` | `false`, nao conta |
 * | apelido — endereco falso | `class-wp-scripts.php:404`, `class-wp-styles.php:184` | `true`, **nada impresso** |
 * | endereco saneado vazio | `class-wp-scripts.php:450`, `class-wp-styles.php:197` | `true`, nada impresso |
 * | o resto | `class-wp-scripts.php:454`, `class-wp-styles.php:204` | `true`, impresso |
 */
export function processarItem(
  especie: EspecieDeRecurso,
  identificador: string,
  estado: EstadoDoItem,
): boolean {
  const recurso = estado.registrados.get(identificador);
  if (recurso === undefined) {
    return false;
  }

  if (falsoNoPhp(recurso.endereco)) {
    return true;
  }

  const comVersao = enderecoComVersao(
    recurso.endereco as string,
    recurso.versao,
    estado.argumentosDaFila.get(identificador),
    estado.configuracao,
  );
  const saneado =
    especie === 'script'
      ? estado.contexto.escaparEnderecoBruto(comVersao)
      : estado.contexto.escaparEnderecoParaExibir(comVersao);

  if (falsoNoPhp(saneado)) {
    return true;
  }

  estado.entregues.push({ identificador, endereco: saneado });
  return true;
}
