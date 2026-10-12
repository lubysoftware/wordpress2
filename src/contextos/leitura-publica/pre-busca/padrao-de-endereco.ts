/**
 * `WP_URL_Pattern_Prefixer` inteiro — a classe que prefixa um padrao de caminho
 * com o caminho base do contexto de instalacao
 * (`wp-includes/class-wp-url-pattern-prefixer.php:18-135`).
 *
 * Entrega de **T015** (US-7). E a peca de que CA-7.2 depende: os sete padroes
 * que ficam **fora** da declaracao sao todos construidos aqui, e sem o prefixo
 * eles nao casariam nada num site instalado em subdiretorio — o docblock do
 * legado diz isso em uma linha, *"This ensures that these path patterns work
 * correctly on WordPress subdirectory sites"* (`:53-54`).
 *
 * ---
 *
 * ## Os sete contextos sao nome publico, e por isso nao foram traduzidos
 *
 * `prefix_path_pattern( $padrao, $contexto )` e chamada com o contexto por
 * **texto literal** (`'site'`, `'uploads'`, ...), e quem chama de fora do
 * nucleo passa o mesmo texto. Traduzi-los seria renomear contrato publico, que
 * a tabela *Nao negociavel* da constituicao tira das maos do agente (P2, P8).
 * As chaves de {@link CaminhosDaInstalacao} sao, portanto, as do legado.
 *
 * ## 🔴 `template` e `stylesheet` estao TROCADOS no legado, e esta reproduzido
 *
 * `get_default_contexts()` mapeia `'template'` para
 * `get_stylesheet_directory_uri()` e `'stylesheet'` para
 * `get_template_directory_uri()` (`:118-119`) — isto e, ao contrario do que o
 * nome de cada um diz. Num tema sem filho os dois caminhos sao iguais e a troca
 * e invisivel; num tema filho ela e observavel, porque o padrao que o chamador
 * pediu para o tema ativo descreve o tema pai e vice-versa.
 *
 * Nao e defeito a corrigir aqui: o **P1** manda reproduzir *"inclusive quando
 * ele parecer defeito"*, e os dois nomes sao argumento de uma funcao publicada.
 * Como as duas entradas sao usadas lado a lado em `speculative-loading.php:212`
 * e `:213`, a lista final de exclusao e a **mesma** nos dois casos — a troca so
 * aparece para quem chame `prefixar()` com um dos dois nomes.
 *
 * ## Por que o caminho chega como caminho, e nao como endereco completo
 *
 * O legado guarda em cada contexto o resultado de
 * `(string) wp_parse_url( <endereco>, PHP_URL_PATH )` (`:113-119`): o endereco
 * e lido para fora o **caminho**, e o resto e descartado antes de qualquer
 * outra coisa. `wp_parse_url()` e funcao da plataforma
 * (`wp-includes/http.php`), e o endereco de cada contexto e das opcoes do site
 * e do tema — nem uma nem outra e deste contexto. Aqui entra o caminho, que e
 * o unico dado que a classe usa.
 *
 * ⚠️ **Caminho ausente e texto vazio, e nao erro.** `wp_parse_url` devolve
 * `null` quando o endereco nao tem caminho, e o `(string)` do legado o converte
 * em texto vazio; `trailingslashit( '' )` e `'/'`. E por isso que o default de
 * {@link CAMINHOS_SEM_PATH} e o site na raiz do dominio.
 */

import { comBarraNoFim } from '../apresentacao/caminho-de-modelo.js';

/**
 * Os sete contextos de {@link contextosPadraoDoPrefixador}, na ordem em que
 * `get_default_contexts()` os declara
 * (`class-wp-url-pattern-prefixer.php:112-120`).
 *
 * A ordem **nao** decide nada: o acesso e por chave. Esta aqui porque a lista
 * dos nomes aceitos e o que um chamador precisa saber, e porque e ela que
 * distingue contexto invalido de contexto valido em {@link prefixarPadrao}.
 */
export const CONTEXTOS_DO_PREFIXADOR = Object.freeze([
  'home',
  'site',
  'uploads',
  'content',
  'plugins',
  'template',
  'stylesheet',
] as const);

/** Um dos sete contextos de {@link CONTEXTOS_DO_PREFIXADOR}. */
export type ContextoDePadrao = (typeof CONTEXTOS_DO_PREFIXADOR)[number];

/** O contexto que `prefix_path_pattern()` usa quando ninguem informa outro (`:64`). */
export const CONTEXTO_PADRAO: ContextoDePadrao = 'home';

/**
 * Os sete caminhos de instalacao que `get_default_contexts()` le, cada um ja
 * reduzido ao caminho pelo `wp_parse_url( ..., PHP_URL_PATH )` do legado.
 *
 * | chave | legado | de quem e |
 * |---|---|---|
 * | `home` | `home_url( '/' )` (`:113`) | `plataforma/opcoes` |
 * | `site` | `site_url( '/' )` (`:114`) | idem |
 * | `uploads` | `wp_upload_dir( null, false )['baseurl']` (`:115`) | BC-04, midia |
 * | `content` | `content_url()` (`:116`) | `plataforma/opcoes` |
 * | `plugins` | `plugins_url()` (`:117`) | idem |
 * | `template` | 🔴 `get_stylesheet_directory_uri()` (`:118`) | `plataforma/tema`, feature 009 |
 * | `stylesheet` | 🔴 `get_template_directory_uri()` (`:119`) | idem |
 *
 * Os dois ultimos estao trocados no legado — ver o cabecalho deste arquivo.
 */
export type CaminhosDaInstalacao = Readonly<Record<ContextoDePadrao, string>>;

/**
 * Os sete caminhos de uma instalacao cujos enderecos nao tem caminho nenhum.
 *
 * ⚠️ **Nao e "o valor de fabrica", e a diferenca importa.** E o valor que o
 * proprio legado produz quando `wp_parse_url( ..., PHP_URL_PATH )` devolve
 * `null` nos sete enderecos: o `(string)` da texto vazio e
 * `trailingslashit( '' )` da `'/'`, logo os sete contextos valem `'/'` e todo
 * padrao prefixado por qualquer um deles e o padrao sem prefixo. E o estado
 * total do codigo, como `TEMA_SEM_MODELOS` e para o tema, e nao um esboco.
 *
 * O valor de fabrica de uma instalacao nova de site unico **nunca chega aqui**,
 * e isso esta registrado em `./configuracao-da-pre-busca.ts`: com
 * `permalink_structure` em texto vazio (`wp-admin/includes/schema.php:443`) a
 * configuracao e ausente, e o prefixador nao e construido.
 */
export const CAMINHOS_SEM_PATH: CaminhosDaInstalacao = Object.freeze({
  home: '',
  site: '',
  uploads: '',
  content: '',
  plugins: '',
  template: '',
  stylesheet: '',
});

/**
 * `WP_URL_Pattern_Prefixer::escape_pattern_string( $str )`
 * (`class-wp-url-pattern-prefixer.php:132-134`) —
 * `addcslashes( $str, '+*?:{}()\\' )`.
 *
 * Nove caracteres recebem uma barra invertida na frente, porque nove
 * caracteres tem significado no analisador de padrao de endereco do navegador
 * (`https://urlpattern.spec.whatwg.org/#escape-a-pattern-string`, citada em
 * `:127`). A barra invertida e um deles, e e por isso que ela se duplica.
 */
export function escaparPadrao(texto: string): string {
  return texto.replace(/[+*?:{}()\\]/g, (caractere) => `\\${caractere}`);
}

/**
 * O prefixador: um mapa de `contexto => caminho base`, com cada caminho ja
 * passado por `trailingslashit()` e por {@link escaparPadrao}.
 *
 * E o estado que o construtor da classe monta (`:37-48`), e **so** ele: a
 * classe nao guarda mais nada. Por isso o porte e um mapa congelado e nao um
 * objeto com metodo — nada aqui muda depois de montado, e o modulo nao guarda
 * estado (BR-MIGRAR-105).
 */
export type ContextosDoPrefixador = Readonly<Record<string, string>>;

/**
 * `new WP_URL_Pattern_Prefixer( $contextos )` com contextos informados
 * (`class-wp-url-pattern-prefixer.php:38-44`).
 *
 * ⚠️ **Informar contextos SUBSTITUI os sete, nao acrescenta a eles.** O
 * construtor testa `count( $contexts ) > 0` e, quando ha algum, mapeia **so** o
 * que recebeu: um chamador que informe `array( 'home' => '/x/' )` fica sem os
 * outros seis, e `prefix_path_pattern( '/*', 'site' )` passa a cair no ramo de
 * contexto invalido. Nenhum chamador do nucleo usa este ramo —
 * `wp_get_speculation_rules()` constroi sem argumento (`:204`) —, e ele esta
 * portado porque a classe e superficie publicada (P8).
 */
export function prefixadorDeContextos(
  caminhos: Readonly<Record<string, string>>,
): ContextosDoPrefixador {
  const contextos: Record<string, string> = {};
  for (const [nome, caminho] of Object.entries(caminhos)) {
    contextos[nome] = escaparPadrao(comBarraNoFim(caminho));
  }
  return Object.freeze(contextos);
}

/**
 * `WP_URL_Pattern_Prefixer::get_default_contexts()`
 * (`class-wp-url-pattern-prefixer.php:111-121`), que e o que o construtor usa
 * quando ninguem informa contexto (`:46`).
 *
 * O corpo e o mesmo de {@link prefixadorDeContextos} — `escape_pattern_string(
 * trailingslashit( ... ) )` nas duas pontas —, e as duas funcoes existem
 * separadas porque o legado tem as duas: uma recebe os caminhos de fora, a
 * outra os busca nas opcoes e no tema.
 */
export function contextosPadraoDoPrefixador(
  caminhos: CaminhosDaInstalacao,
): ContextosDoPrefixador {
  return prefixadorDeContextos(caminhos);
}

/**
 * `WP_URL_Pattern_Prefixer::prefix_path_pattern( $padrao, $contexto )`
 * (`class-wp-url-pattern-prefixer.php:64-102`).
 *
 * Os quatro passos, na ordem do legado:
 *
 * | # | passo | legado |
 * |---|---|---|
 * | 1 | contexto que nao existe: aviso de uso indevido e **o padrao volta como veio** | `:66-79` |
 * | 2 | caminho de contexto com `:`, `?` ou `#` entra entre chaves, **sem** a barra final | `:87-91` |
 * | 3 | padrao que ja comeca pelo caminho do contexto perde esse prefixo antes de recebe-lo de volta | `:97-99` |
 * | 4 | o resultado e o caminho do contexto mais o padrao sem barra inicial | `:101` |
 *
 * ⚠️ **O passo 1 nao lanca e nao devolve erro: devolve o padrao intacto.** Um
 * contexto escrito errado produz um padrao **sem prefixo**, que num site em
 * subdiretorio casa o caminho errado. O aviso de `_doing_it_wrong()` e da
 * plataforma — o barramento que o dispara nao existe nesta arvore —, e o que e
 * observavel aqui e o retorno. Mesma divisao de
 * `contextos/classificacao/registro/registro-de-contextos.ts`.
 *
 * ⚠️ **O passo 3 compara contra o caminho JA escapado.** `$context_path` e o
 * valor guardado pelo construtor, isto e depois de `addcslashes`: um padrao que
 * comece pelo caminho **cru** (com `(` sem barra invertida, por exemplo) nao
 * casa o `str_starts_with` e recebe o prefixo duas vezes. Esta reproduzido.
 *
 * ⚠️ **O passo 2 e cego ao escape do passo anterior.** `strcspn` corre no
 * caminho ja escapado, e `addcslashes` escapa `:` mas nao `?` nem `#`: um
 * caminho com `:` continua acusando o teste, porque a barra invertida nao tira
 * o caractere da cadeia. Esta reproduzido, e e a razao de o teste ser sobre o
 * texto escapado e nao sobre o cru.
 */
export function prefixarPadrao(
  contextos: ContextosDoPrefixador,
  padrao: string,
  contexto: string = CONTEXTO_PADRAO,
): string {
  // Passo 1 — `! isset( $this->contexts[ $context ] )` (`:66`).
  const caminhoDoContexto = contextos[contexto];
  if (caminhoDoContexto === undefined) {
    return padrao;
  }

  // Passo 2 — `strcspn( $context_path, ':?#' ) !== strlen( $context_path )`
  // (`:89`), que e "contem um dos tres".
  let caminhoEscapado = caminhoDoContexto;
  if (/[:?#]/.test(caminhoDoContexto)) {
    caminhoEscapado = `{${caminhoDoContexto.slice(0, -1)}}/`;
  }

  // Passo 3 — `str_starts_with( $path_pattern, $context_path )` (`:97`).
  let restante = padrao;
  if (restante.startsWith(caminhoDoContexto)) {
    restante = restante.slice(caminhoDoContexto.length);
  }

  // Passo 4 — `$escaped_context_path . ltrim( $path_pattern, '/' )` (`:101`).
  return caminhoEscapado + restante.replace(/^\/+/, '');
}
