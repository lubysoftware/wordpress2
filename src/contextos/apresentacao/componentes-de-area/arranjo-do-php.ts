/**
 * O arranjo do PHP como as operacoes de componentes o mexem: atribuir, anexar,
 * tirar, `array_diff()` e `array_splice()` — com as chaves que cada uma deixa.
 *
 * Entrega de **T015** da feature `009-apresentacao-e-personalizacao` (US-7). E
 * suporte das operacoes, nao criterio: nenhum CA e satisfeito aqui.
 *
 * ## Por que isto existe, e nao basta `atribuirChave` de T002
 *
 * O mapa de areas (`sidebars_widgets`) e um arranjo de LISTAS, e as listas nao
 * sao reindexadas pelo legado depois de tirar um componente: `unset()` e
 * `array_diff()` deixam **buraco** na chave inteira, e o buraco vai para o byte
 * gravado (`a:2:{i:0;s:6:"text-2";i:2;s:6:"text-4";}`). Tres operacoes do
 * legado tem regra propria de chave, e as tres aparecem no valor gravado:
 *
 * | operacao | regra | onde o legado a usa nesta tarefa |
 * |---|---|---|
 * | `$a[] = $v` | chave = a **proxima livre**, que `unset()` nao devolve: tirar o ultimo e anexar nao reaproveita a chave | `wp_assign_widget_to_sidebar()` (`wp-includes/widgets.php:1974`), `WP_REST_Sidebars_Controller::update_item()` (`class-wp-rest-sidebars-controller.php:234`) |
 * | `array_diff()` | arranjo **novo**, chaves preservadas, comparacao por `(string)` | `wp-admin/widgets-form.php:152`, `:192` |
 * | `array_splice()` | **renumera** toda chave inteira a partir de 0; chave de texto fica | `wp-admin/widgets-form.php:196` |
 *
 * A proxima chave livre de um arranjo lido do banco e a maior chave inteira
 * mais um (ou `0`); depois disso so cresce. E a regra do PHP 8.3, que e a
 * versao que o produto recomenda e a do oraculo executavel
 * (`scripts/oraculo/README.md`).
 *
 * A gemea mais proxima e `atribuirChave` de `armazenamento/configuracao-do-tema.ts`,
 * que serve chave de texto; esta e a que serve lista.
 */

import {
  normalizarChaveDeTexto,
  type ChaveDeArranjo,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';

/** Um arranjo em edicao: as entradas na ordem, e a proxima chave livre. */
export interface ArranjoDoPhp {
  readonly entradas: EntradaDeArranjo[];
  proxima: number;
}

/** A proxima chave livre de um arranjo recem-lido: maior chave inteira + 1. */
function proximaChaveDe(entradas: readonly EntradaDeArranjo[]): number {
  let maior: number | null = null;
  for (const entrada of entradas) {
    if (
      entrada.chave.tipo === 'inteiro' &&
      (maior === null || entrada.chave.valor > maior)
    ) {
      maior = entrada.chave.valor;
    }
  }
  return maior === null ? 0 : maior + 1;
}

/**
 * Copia um valor para edicao. Valor que nao e arranjo vira arranjo vazio, que e
 * o que o legado faz em todo ponto desta tarefa em que o valor e usado como
 * lista (`(array)`, `?? array()`).
 */
export function arranjoParaEditar(valor: ValorPhp | undefined): ArranjoDoPhp {
  const entradas = valor?.tipo === 'arranjo' ? [...valor.entradas] : [];
  return { entradas, proxima: proximaChaveDe(entradas) };
}

/** O valor de volta, pronto para gravar. */
export function valorDoArranjo(arranjo: ArranjoDoPhp): ValorPhp {
  return { tipo: 'arranjo', entradas: [...arranjo.entradas] };
}

/** As duas chaves sao a mesma chave do PHP. */
export function mesmaChave(a: ChaveDeArranjo, b: ChaveDeArranjo): boolean {
  if (a.tipo !== b.tipo) {
    return false;
  }
  if (typeof a.valor === 'number' || typeof b.valor === 'number') {
    return a.valor === b.valor;
  }
  return textoDaChave(a.valor) === textoDaChave(b.valor);
}

function textoDaChave(valor: string | Uint8Array): string {
  return typeof valor === 'string' ? valor : new TextDecoder().decode(valor);
}

/**
 * `$chave === $nome`, com a chave lida de um `foreach`: chave inteira **nunca**
 * e identica a um texto. E por isso que `$sidebar_id !== $request['id']` do
 * legado e verdadeiro para a area cujo identificador e `"5"`, guardada com
 * chave `i:5`.
 */
export function chaveIdenticaAoTexto(chave: ChaveDeArranjo, nome: string): boolean {
  return chave.tipo === 'texto' && textoDaChave(chave.valor) === nome;
}

/** `(string) $chave` — o que `wp_find_widgets_sidebar()` devolve (`widgets.php:1958`). */
export function chaveComoTexto(chave: ChaveDeArranjo): string {
  return chave.tipo === 'inteiro' ? String(chave.valor) : textoDaChave(chave.valor);
}

/** `$a[ $nome ]` — `undefined` quando a chave nao existe. */
export function valorNaChave(
  arranjo: ArranjoDoPhp,
  nome: string,
): ValorPhp | undefined {
  return valorNaChaveExata(arranjo, normalizarChaveDeTexto(nome));
}

/** O mesmo, com a chave ja normalizada — a que veio de um `foreach`. */
export function valorNaChaveExata(
  arranjo: ArranjoDoPhp,
  chave: ChaveDeArranjo,
): ValorPhp | undefined {
  return arranjo.entradas.find((entrada) => mesmaChave(entrada.chave, chave))
    ?.valor;
}

/**
 * `$a[ $nome ] = $valor`: chave que existe e substituida no lugar, chave nova
 * entra no fim, e chave inteira empurra a proxima livre.
 */
export function atribuirNaChave(
  arranjo: ArranjoDoPhp,
  nome: string,
  valor: ValorPhp,
): void {
  atribuirNaChaveExata(arranjo, normalizarChaveDeTexto(nome), valor);
}

/** O mesmo, com a chave ja normalizada — a que veio de um `foreach`. */
export function atribuirNaChaveExata(
  arranjo: ArranjoDoPhp,
  chave: ChaveDeArranjo,
  valor: ValorPhp,
): void {
  const indice = arranjo.entradas.findIndex((entrada) =>
    mesmaChave(entrada.chave, chave),
  );
  if (indice >= 0) {
    arranjo.entradas[indice] = { chave, valor };
    return;
  }
  arranjo.entradas.push({ chave, valor });
  if (chave.tipo === 'inteiro' && chave.valor >= arranjo.proxima) {
    arranjo.proxima = chave.valor + 1;
  }
}

/** `$a[] = $valor`. */
export function anexar(arranjo: ArranjoDoPhp, valor: ValorPhp): void {
  arranjo.entradas.push({
    chave: { tipo: 'inteiro', valor: arranjo.proxima },
    valor,
  });
  arranjo.proxima += 1;
}

/** `unset( $a[ $chave ] )` — sem reindexar, e sem devolver a chave livre. */
export function tirarChave(arranjo: ArranjoDoPhp, chave: ChaveDeArranjo): void {
  const indice = arranjo.entradas.findIndex((entrada) =>
    mesmaChave(entrada.chave, chave),
  );
  if (indice >= 0) {
    arranjo.entradas.splice(indice, 1);
  }
}

/**
 * `(string) $valor`. Decimal sai pela conversao deste runtime, que coincide com
 * a do PHP 8 (`serialize_precision = -1`) salvo em notacao exponencial — nenhum
 * identificador de componente e decimal.
 */
export function textoNoPhp(valor: ValorPhp): string {
  switch (valor.tipo) {
    case 'texto':
      return textoDaChave(valor.valor);
    case 'inteiro':
    case 'decimal':
      return String(valor.valor);
    case 'booleano':
      return valor.valor ? '1' : '';
    case 'nulo':
      return '';
    case 'arranjo':
      return 'Array';
  }
}

/** `$a === $nome` para um valor da lista: so texto e identico a texto. */
export function valorIdenticoAoTexto(valor: ValorPhp, nome: string): boolean {
  return valor.tipo === 'texto' && textoDaChave(valor.valor) === nome;
}

/**
 * `array_diff( $a, array( $nome ) )` — arranjo **novo**, sem os valores cujo
 * `(string)` e `$nome`, com as chaves que sobraram.
 */
export function semOValor(valor: ValorPhp | undefined, nome: string): ValorPhp {
  const entradas =
    valor?.tipo === 'arranjo'
      ? valor.entradas.filter((entrada) => textoNoPhp(entrada.valor) !== nome)
      : [];
  return { tipo: 'arranjo', entradas };
}

/**
 * `array_splice( $a, $posicao, 0, $novo )`: insere na posicao (nao na chave) e
 * renumera toda chave inteira a partir de 0.
 *
 * A posicao segue a regra da funcao: maior que o tamanho vai para o fim;
 * negativa conta do fim, e o que passar do inicio vai para o inicio.
 */
export function inserirNaPosicao(
  valor: ValorPhp | undefined,
  posicao: number,
  novo: ValorPhp,
): ValorPhp {
  const entradas = valor?.tipo === 'arranjo' ? [...valor.entradas] : [];
  let onde = posicao;
  if (onde > entradas.length) {
    onde = entradas.length;
  } else if (onde < 0) {
    onde = Math.max(0, entradas.length + onde);
  }
  entradas.splice(onde, 0, { chave: { tipo: 'inteiro', valor: 0 }, valor: novo });

  let proxima = 0;
  return {
    tipo: 'arranjo',
    entradas: entradas.map((entrada) =>
      entrada.chave.tipo === 'inteiro'
        ? { chave: { tipo: 'inteiro', valor: proxima++ }, valor: entrada.valor }
        : entrada,
    ),
  };
}

/** `isset( $a ) && $a` — o `empty()` do PHP invertido; ausente e falso. */
export function verdadeiroNoPhp(valor: ValorPhp | undefined): boolean {
  if (valor === undefined) {
    return false;
  }
  switch (valor.tipo) {
    case 'nulo':
      return false;
    case 'booleano':
      return valor.valor;
    case 'inteiro':
    case 'decimal':
      return valor.valor !== 0;
    case 'texto': {
      const texto = textoNoPhp(valor);
      return texto !== '' && texto !== '0';
    }
    case 'arranjo':
      return valor.entradas.length > 0;
  }
}

/** `(int) $valor`: o prefixo inteiro do texto, `0` quando nao ha. */
export function inteiroNoPhp(valor: ValorPhp | undefined): number {
  if (valor === undefined) {
    return 0;
  }
  if (valor.tipo === 'inteiro') {
    return valor.valor;
  }
  if (valor.tipo === 'decimal') {
    return Math.trunc(valor.valor);
  }
  if (valor.tipo === 'booleano') {
    return valor.valor ? 1 : 0;
  }
  const achado = /^[ \t\n\r\v\f]*([+-]?[0-9]+)/.exec(textoNoPhp(valor));
  return achado === null ? 0 : Number(achado[1]);
}
