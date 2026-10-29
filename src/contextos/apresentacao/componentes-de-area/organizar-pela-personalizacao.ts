/**
 * Organizar os componentes pela personalizacao — as configuracoes de
 * componente que o Customizer cria e o que elas gravam.
 *
 * Entrega de **T015** da feature `009-apresentacao-e-personalizacao` —
 * **CA-7.1** e **CA-7.3** (a terceira das tres superficies). UC-31,
 * *"Organizar pelo Customizer"*: *"a mesma estrutura e editada dentro do
 * conjunto de alteracoes"*.
 *
 * ## As duas configuracoes, e por que elas chegam ao mesmo lugar
 *
 * `WP_Customize_Widgets` cria, sob demanda, uma configuracao do tipo `option`
 * para cada pedaco do que a tela e a superficie programatica gravam
 * (`wp-includes/class-wp-customize-widgets.php:88`-`:91`, `:994`-`:1029`):
 *
 * | configuracao | casa com | grava em |
 * |---|---|---|
 * | `sidebars_widgets[{area}]` | `/^sidebars_widgets\[(?P<sidebar_id>.+?)\]$/` | a chave `{area}` da opcao `sidebars_widgets` — o mesmo mapa de `mapa-de-areas.ts` |
 * | `widget_{id_base}[{numero}]` | `/^widget_(?P<id_base>.+?)(?:\[(?P<widget_number>\d+)\])?$/` | a chave `{numero}` da opcao `widget_{id_base}` — a mesma de `configuracao-do-componente.ts` |
 *
 * Toda configuracao `option` com colchete no identificador e
 * **multidimensional agregada**: a gravacao le a opcao inteira, troca a chave
 * e grava a opcao inteira (`class-wp-customize-setting.php:686`-`:697`,
 * `:657`-`:676`, `:916`-`:930`). E por isso que o mapa e a configuracao saem
 * daqui com a mesma forma das outras duas superficies.
 *
 * ## O que e desta tarefa e o que e da personalizacao
 *
 * Aqui estao o reconhecimento do identificador, os argumentos da configuracao,
 * as duas sanitizacoes e a **gravacao** de uma configuracao de componente — o
 * `WP_Customize_Setting::save()` dela. **Quando** a gravacao acontece e da
 * personalizacao: e aplicar o conjunto de alteracoes, que e **T005**, com a
 * permissao de aplicar separada da de salvar. O que esta tarefa garante e que,
 * aplicado o conjunto, o valor chega ao mesmo mapa e a mesma opcao de tipo.
 *
 * ⚠️ **"O mesmo resultado" e a mesma estrutura, nao o mesmo byte.** A
 * personalizacao troca a chave **no lugar**; `update_callback()` tira
 * `_multiwidget` e o poe de volta no fim. Uma instancia **nova** gravada pela
 * tela fica antes de `_multiwidget`, e pela personalizacao fica depois. E o
 * legado; `us-7-organizar-componentes.test.ts` afirma as duas formas.
 */

import { perguntarPermissao } from '../../../plataforma/autorizacao/index.js';
import {
  desserializar,
  lista,
  normalizarChaveDeTexto,
  texto,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type { ValorDeJson } from '../armazenamento/index.js';
import {
  arranjoParaEditar,
  atribuirNaChave,
  valorDoArranjo,
  valorNaChave,
  verdadeiroNoPhp,
} from './arranjo-do-php.js';
import type { ContextoDosComponentes } from './contexto-dos-componentes.js';
import { decomporIdDoComponente } from './mapa-de-areas.js';
import { CAPACIDADE_DOS_COMPONENTES } from './permissao-dos-componentes.js';

/** `$setting_id_patterns` (`class-wp-customize-widgets.php:88`-`:91`), na ordem. */
export const PADROES_DAS_CONFIGURACOES_DE_COMPONENTE = {
  widget_instance: /^widget_(.+?)(?:\[(\d+)\])?$/s,
  sidebar_widgets: /^sidebars_widgets\[(.+?)\]$/s,
} as const;

export type TipoDaConfiguracaoDeComponente =
  keyof typeof PADROES_DAS_CONFIGURACOES_DE_COMPONENTE;

/**
 * `get_setting_type()` (`class-wp-customize-widgets.php:181`): o primeiro
 * padrao que casa, na ordem declarada, ou `null`.
 */
export function tipoDaConfiguracaoDeComponente(
  id: string,
): TipoDaConfiguracaoDeComponente | null {
  if (PADROES_DAS_CONFIGURACOES_DE_COMPONENTE.widget_instance.test(id)) {
    return 'widget_instance';
  }
  if (PADROES_DAS_CONFIGURACOES_DE_COMPONENTE.sidebar_widgets.test(id)) {
    return 'sidebar_widgets';
  }
  return null;
}

/**
 * `get_setting_id()` (`class-wp-customize-widgets.php:573`): `widget_{base}`,
 * mais `[{numero}]` quando o identificador tem numero.
 */
export function idDaConfiguracaoDoComponente(idDoComponente: string): string {
  const { idBase, numero } = decomporIdDoComponente(idDoComponente);
  return numero === undefined
    ? `widget_${idBase}`
    : `widget_${idBase}[${String(numero)}]`;
}

/** Os argumentos que `get_setting_args()` da a uma configuracao de componente. */
export interface ArgumentosDaConfiguracaoDeComponente {
  readonly tipo: 'option';
  readonly capacidade: typeof CAPACIDADE_DOS_COMPONENTES;
  /** `array()`. */
  readonly padrao: ValorPhp;
  readonly sanitizacao: TipoDaConfiguracaoDeComponente;
}

/**
 * `filter_customize_dynamic_setting_args()` com `get_setting_args()`
 * (`class-wp-customize-widgets.php:230`, `:994`): os argumentos, ou `null`
 * quando o identificador nao e de componente.
 *
 * Nao confere capacidade: o filtro existe para toda conta
 * (`permissao-dos-componentes.ts`). O filtro `widget_customizer_setting_args`
 * (`:1028`) e ponto de extensao.
 */
export function argumentosDaConfiguracaoDeComponente(
  id: string,
): ArgumentosDaConfiguracaoDeComponente | null {
  const sanitizacao = tipoDaConfiguracaoDeComponente(id);
  if (sanitizacao === null) {
    return null;
  }
  return {
    tipo: 'option',
    capacidade: CAPACIDADE_DOS_COMPONENTES,
    padrao: { tipo: 'arranjo', entradas: [] },
    sanitizacao,
  };
}

/**
 * O valor JSON do conjunto como `json_decode( ..., true )` o entrega ao PHP:
 * objeto e lista viram arranjo, numero inteiro vira inteiro.
 *
 * ⚠️ A mesma aproximacao que T003 registrou em `identicoNoPhp`: depois do
 * `JSON.parse` deste runtime, `1.0` e `1` sao o mesmo numero, e o PHP os
 * distingue. Nenhum identificador de componente e decimal.
 */
export function valorPhpDoJson(valor: ValorDeJson): ValorPhp {
  if (valor === null) {
    return { tipo: 'nulo' };
  }
  if (typeof valor === 'boolean') {
    return { tipo: 'booleano', valor };
  }
  if (typeof valor === 'number') {
    return Number.isInteger(valor)
      ? { tipo: 'inteiro', valor }
      : { tipo: 'decimal', valor };
  }
  if (typeof valor === 'string') {
    return texto(valor);
  }
  if (Array.isArray(valor)) {
    return lista(valor.map(valorPhpDoJson));
  }
  const entradas: EntradaDeArranjo[] = Object.entries(valor).map(
    ([nome, filho]) => ({
      chave: normalizarChaveDeTexto(nome),
      valor: valorPhpDoJson(filho),
    }),
  );
  return { tipo: 'arranjo', entradas };
}

/** `strval()` de um valor que veio do JSON (`array_map( 'strval', ... )`). */
function comoTextoDoJson(valor: ValorDeJson): string {
  if (valor === null || valor === false) {
    return '';
  }
  if (valor === true) {
    return '1';
  }
  if (typeof valor === 'number' || typeof valor === 'string') {
    return String(valor);
  }
  return 'Array';
}

/**
 * `sanitize_sidebar_widgets()` (`class-wp-customize-widgets.php:1041`): a lista
 * de identificadores, cada um so com `a-z`, `0-9`, `_` e `-`, renumerada a
 * partir de 0. Valor que nao e lista vira lista de um (`(array)`), e `null`
 * vira lista vazia.
 */
export function sanitizarComponentesDaArea(valor: ValorDeJson): ValorPhp {
  let itens: readonly ValorDeJson[];
  if (valor === null) {
    itens = [];
  } else if (Array.isArray(valor)) {
    itens = valor;
  } else if (typeof valor === 'object') {
    itens = Object.values(valor);
  } else {
    itens = [valor];
  }
  return lista(
    itens.map((item) => texto(comoTextoDoJson(item).replace(/[^a-z0-9_-]/g, ''))),
  );
}

const ALFABETO_DE_BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * `base64_decode( $valor, true )`: espaco em branco e pulado; caractere fora do
 * alfabeto, dado depois do preenchimento, sobra de um caractere ou
 * preenchimento errado e falha (`null`).
 */
export function decodificadoDeBase64Estrito(valor: string): Uint8Array | null {
  const bytes: number[] = [];
  let acumulado = 0;
  let bits = 0;
  let lidos = 0;
  let preenchimento = 0;
  for (const caractere of valor) {
    if (caractere === '=') {
      preenchimento++;
      continue;
    }
    if (/[ \t\n\r]/.test(caractere)) {
      continue;
    }
    const indice = ALFABETO_DE_BASE64.indexOf(caractere);
    if (indice < 0 || preenchimento > 0) {
      return null;
    }
    acumulado = (acumulado << 6) | indice;
    bits += 6;
    lidos++;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((acumulado >> bits) & 0xff);
    }
  }
  if (lidos % 4 === 1) {
    return null;
  }
  if (preenchimento > 0 && (preenchimento > 2 || (lidos + preenchimento) % 4 !== 0)) {
    return null;
  }
  return new Uint8Array(bytes);
}

/** Um campo do objeto JSON, como `$value['campo']`. */
function campoDoJson(valor: ValorDeJson, campo: string): ValorDeJson | undefined {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) {
    return undefined;
  }
  const objeto = valor as { readonly [chave: string]: ValorDeJson };
  return Object.prototype.hasOwnProperty.call(objeto, campo) ? objeto[campo] : undefined;
}

/** `empty()` sobre um valor JSON. */
function vazioNoJson(valor: ValorDeJson | undefined): boolean {
  return valor === undefined || !verdadeiroNoPhp(valorPhpDoJson(valor));
}

/**
 * `sanitize_widget_instance()` (`class-wp-customize-widgets.php:1457`): a
 * instancia que a configuracao `widget_{id_base}[{numero}]` vai gravar, ou
 * `null` — que a personalizacao trata como **valor invalido**.
 *
 * | ramo | quando | devolve |
 * |---|---|---|
 * | vazio | `array() === $value` (`[]` ou `{}`) | o arranjo vazio |
 * | cru | `raw_instance` presente, editor de blocos ligado e o tipo permite instancia crua | `raw_instance`, com o `content` do tipo `block` filtrado por `wp_kses_post()` para quem nao tem `unfiltered_html` |
 * | codificado | `is_widget_customizer_js_value`, `instance_hash_key` e `encoded_serialized_instance` nao vazios, base64 estrito, resumo identico | a instancia desserializada |
 * | resto | — | `null` |
 */
export function sanitizarInstanciaDoComponente(
  contexto: Pick<
    ContextoDosComponentes,
    | 'autorizacao'
    | 'tipoDeComponente'
    | 'resumir'
    | 'usaEditorDeBlocos'
    | 'filtrarHtmlPermitido'
  >,
  valor: ValorDeJson,
  idBase: string | null,
): ValorPhp | null {
  if (
    (Array.isArray(valor) && valor.length === 0) ||
    (valor !== null &&
      typeof valor === 'object' &&
      !Array.isArray(valor) &&
      Object.keys(valor).length === 0)
  ) {
    return { tipo: 'arranjo', entradas: [] };
  }

  const crua = campoDoJson(valor, 'raw_instance');
  if (crua !== undefined && crua !== null && idBase !== null && idBase !== '' && contexto.usaEditorDeBlocos) {
    const tipo = contexto.tipoDeComponente(idBase);
    if (tipo !== undefined && tipo.instanciaCruaPermitida) {
      let instancia = valorPhpDoJson(crua);
      if (idBase === 'block' && !perguntarPermissao(contexto.autorizacao, 'unfiltered_html')) {
        const conteudo = campoDoJson(crua, 'content');
        const edicao = arranjoParaEditar(instancia);
        atribuirNaChave(
          edicao,
          'content',
          texto(contexto.filtrarHtmlPermitido(comoTextoDoJson(conteudo ?? null))),
        );
        instancia = valorDoArranjo(edicao);
      }
      return instancia;
    }
  }

  const marca = campoDoJson(valor, 'is_widget_customizer_js_value');
  const resumo = campoDoJson(valor, 'instance_hash_key');
  const codificada = campoDoJson(valor, 'encoded_serialized_instance');
  if (vazioNoJson(marca) || vazioNoJson(resumo) || vazioNoJson(codificada)) {
    return null;
  }

  const serializada = decodificadoDeBase64Estrito(comoTextoDoJson(codificada ?? null));
  if (serializada === null) {
    return null;
  }
  if (contexto.resumir(serializada) !== comoTextoDoJson(resumo ?? null)) {
    return null;
  }
  const lida = desserializar(serializada);
  if (!lida.ok || (lida.valor.tipo === 'booleano' && !lida.valor.valor)) {
    return null;
  }
  return lida.valor;
}

/**
 * `multidimensional_replace()` com `create => true`
 * (`class-wp-customize-setting.php:861`-`:930`): raiz vazia vira arranjo, cada
 * no do caminho e criado quando falta, o ultimo no que nao e arranjo vira
 * arranjo, e a chave final e trocada **no lugar** ou entra no fim.
 */
function substituidoNoCaminho(
  raiz: ValorPhp,
  chaves: readonly string[],
  valor: ValorPhp,
): ValorPhp {
  const [primeira, ...resto] = chaves;
  if (primeira === undefined) {
    return valor;
  }
  const no = arranjoParaEditar(raiz.tipo === 'arranjo' ? raiz : undefined);
  if (resto.length === 0) {
    atribuirNaChave(no, primeira, valor);
    return valorDoArranjo(no);
  }
  const filho = valorNaChave(no, primeira);
  atribuirNaChave(
    no,
    primeira,
    substituidoNoCaminho(
      filho === undefined || filho.tipo === 'nulo' ? { tipo: 'arranjo', entradas: [] } : filho,
      resto,
      valor,
    ),
  );
  return valorDoArranjo(no);
}

/**
 * `WP_Customize_Setting::save()` de uma configuracao de componente
 * (`class-wp-customize-setting.php:525`), com o valor **ja sanitizado**:
 *
 * 1. `check_capabilities()` — `edit_theme_options` (`:839`-`:849`); sem ela, ou
 *    sem valor, nada e gravado e o resultado e `false`;
 * 2. o identificador e partido em base e chaves
 *    (`preg_split( '/\[/', str_replace( ']', '', $id ) )`, `:195`-`:196`);
 * 3. a raiz e `get_option( $base, array() )` (`:633`-`:636`), a chave e trocada,
 *    e a raiz volta por `update_option( $base, $raiz, true )` (`:657`-`:664`).
 *
 * ⚠️ **Nao passa por `wp_set_sidebars_widgets()`**: o mapa gravado por aqui so
 * tem `array_version` se ja tinha. **Nem por `update_callback()`**: a instancia
 * nao passa pelo `update()` do tipo nesta hora — na personalizacao ela passou
 * antes, na pre-visualizacao (`call_widget_update()`, `:1575`).
 */
export function gravarConfiguracaoDeComponente(
  contexto: Pick<ContextoDosComponentes, 'autorizacao' | 'opcoes'>,
  id: string,
  valor: ValorPhp | null,
): boolean {
  if (!perguntarPermissao(contexto.autorizacao, CAPACIDADE_DOS_COMPONENTES)) {
    return false;
  }
  if (valor === null || valor.tipo === 'nulo') {
    return false;
  }
  const [base = '', ...chaves] = id.replaceAll(']', '').split('[');
  // `do_action( "customize_save_{$id_base}", ... )` (`:544`) — ponto de extensao.
  const raiz = contexto.opcoes.ler(base) ?? { tipo: 'arranjo', entradas: [] };
  const raizInicial: ValorPhp = verdadeiroNoPhp(raiz)
    ? raiz
    : { tipo: 'arranjo', entradas: [] };
  return contexto.opcoes.gravar(
    base,
    substituidoNoCaminho(raizInicial, chaves, valor),
    true,
  );
}
