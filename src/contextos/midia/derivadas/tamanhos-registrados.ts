/**
 * **CA-3.2**: os tamanhos de fabrica sao quatro, com as medidas declaradas,
 * mais os dois de tela de alta densidade — resolvidos **em execucao**, porque
 * metade deles vem de opcao e opcao e dado mutavel.
 *
 * Entrega de **T007** da feature `006-biblioteca-de-midia` (US-3). Sao duas
 * funcoes do legado, e a segunda itera sobre a primeira:
 * `get_intermediate_image_sizes()` (`wp-includes/media.php:895`) e
 * `wp_get_registered_image_subsizes()` (`:930`).
 *
 * ── A DIFERENCA ENTRE ESTE ARQUIVO E `../tamanhos/` ────────────────────────
 *
 * `../tamanhos/tamanhos-de-fabrica.ts` e **dado**: os seis nomes, as medidas de
 * fabrica e o nome da opcao que altera cada uma, congelados, como T001 os
 * entregou. Este arquivo e **a resolucao**: ele pergunta a opcao o valor
 * corrente, junta os tamanhos que uma extensao registrou nesta requisicao, e
 * aplica as duas regras do legado que o dado nao pode aplicar sozinho —
 * a que **salta** tamanho sem medida e a que normaliza o recorte.
 *
 * O cabecalho de `tamanhos-de-fabrica.ts` ja apontava as duas para ca: *"A
 * regra que salta tamanho nao definido (`wp-includes/media.php:955`) e a que le
 * a opcao em execucao. Sao de T007"*.
 *
 * ── A ORDEM, QUE E DUAS ORDENS DIFERENTES ──────────────────────────────────
 *
 * A ordem **desta** lista e a de `get_intermediate_image_sizes()`: os quatro
 * nomes fixos, e depois os adicionais na ordem em que foram registrados
 * (`array_merge`, `:900`). E por ela que uma extensao enxerga a lista de
 * tamanhos, e reordenar aqui muda saida observavel.
 *
 * ⚠️ **A ordem da GERACAO e outra**, e esta em `gerar-derivadas.ts`:
 * `_wp_make_subsizes()` reordena com uma lista de prioridade antes do laco
 * (`wp-admin/includes/image.php:458` a `:469`). As duas conviver e do legado.
 *
 * ── O QUE NAO ESTA AQUI ────────────────────────────────────────────────────
 *
 * - **O registro mutavel onde uma extensao acrescenta tamanho.** No legado e o
 *   global `$_wp_additional_image_sizes`, preenchido a cada requisicao por
 *   `add_image_size()` (`wp-includes/media.php:312`) e lido por
 *   `wp_get_additional_image_sizes()` (`:31`). Ele e estado de **REQUISICAO**,
 *   nao de modulo (`EXT-CONTEXTO`, BR-MIGRAR-105), e por isso chega como dado da
 *   chamada, em {@link ContextoDeDerivadas.tamanhosAdicionais}. Nada aqui e
 *   mutavel.
 * - **Os dois pontos de extensao**, `intermediate_image_sizes`
 *   (`media.php:911`) e `intermediate_image_sizes_advanced`
 *   (`wp-admin/includes/image.php:410`, que e o de
 *   `criar-derivadas-na-ingestao.ts`). Contrato publico (P2), nao emitidos: o
 *   barramento e `REQ-162`, em `do-not-rewrite.md`.
 */

import type { Recorte, TamanhoDeImagem } from '../tamanhos/index.js';
import { TAMANHOS_DE_IMAGEM_DE_FABRICA } from '../tamanhos/index.js';

/**
 * Os quatro nomes que `get_intermediate_image_sizes()` traz antes de qualquer
 * adicional (`wp-includes/media.php:896`).
 *
 * ⚠️ **Nao e a mesma lista que `NOMES_DE_TAMANHO_DE_FABRICA`** de
 * `../tamanhos/tamanhos-de-fabrica.ts`, e a
 * diferenca e o ponto de `M2`: aquela tem **seis** nomes porque inclui os dois
 * de alta densidade, que o legado registra por `add_image_size()` no arranque
 * (`_wp_add_additional_image_sizes()`, `media.php:5862`) e que portanto chegam
 * por `$_wp_additional_image_sizes`, nao por esta lista. Quem juntar as duas
 * listas conta `1536x1536` duas vezes.
 */
export const NOMES_DE_TAMANHO_FIXOS = [
  'thumbnail',
  'medium',
  'medium_large',
  'large',
] as const;

/**
 * Um tamanho como `add_image_size()` o grava
 * (`wp-includes/media.php:312`-`:316`).
 *
 * As tres medidas sao **opcionais aqui e obrigatorias la**:
 * `add_image_size()` sempre grava as tres, mas
 * `wp_get_registered_image_subsizes()` pergunta `isset()` por cada uma e cai na
 * opcao quando ela falta (`:946`, `:952`, `:963`). A ausencia e representavel
 * porque o `isset` e do legado, e um tamanho adicional montado a mao — pelo
 * global, que e publico — pode nao ter as tres.
 */
export interface TamanhoAdicional {
  /** A chave do global, que e o nome do tamanho e vai para o metadado. */
  readonly nome: string;
  readonly largura?: number;
  readonly altura?: number;
  readonly recorte?: Recorte;
}

/**
 * Os dois tamanhos que o legado registra **em codigo**, derivados do dado de
 * T001.
 *
 * Nao sao uma segunda copia das medidas: saem de
 * {@link TAMANHOS_DE_IMAGEM_DE_FABRICA} filtrando `origem === 'codigo'`, que e
 * exatamente o que `tamanhos-de-fabrica.ts` declara sobre cada um.
 *
 * ⚠️ **A prioridade `0` do registro deles e contrato publico, e nao e deste
 * arquivo.** O legado os pendura em `plugins_loaded` com prioridade `0`
 * (`wp-includes/default-filters.php:693`), e *"mudar a ordem de carregamento do
 * arranque"* esta na tabela **Nao negociavel** da constituicao: quem registrar
 * estes dois mais tarde deixa extensao que os le em `plugins_loaded` sem
 * encontra-los. Aqui eles sao so o valor que o arranque produziria.
 */
export const TAMANHOS_ADICIONAIS_DE_FABRICA: readonly TamanhoAdicional[] =
  Object.freeze(
    TAMANHOS_DE_IMAGEM_DE_FABRICA.filter(
      (tamanho) => tamanho.origem === 'codigo',
    ).map((tamanho) =>
      Object.freeze({
        nome: tamanho.nome,
        largura: tamanho.largura,
        altura: tamanho.altura,
        recorte: tamanho.recorte,
      }),
    ),
  );

/**
 * O valor cru de `get_option( "{tamanho}_crop" )`.
 *
 * Os cinco casos existem porque os cinco sao alcancaveis: `thumbnail_crop` e
 * semeada em `1` (**numero**), uma tela pode gravar `'1'` ou `''` (**texto**),
 * `medium_crop`, `medium_large_crop` e `large_crop` **nao sao semeadas** e
 * `get_option()` devolve `false` para elas, e uma extensao pode gravar o par de
 * posicoes (**arranjo**). Ver {@link normalizarRecorte}.
 */
export type ValorDeRecorteGravado =
  | Recorte
  | string
  | number
  | null
  | undefined;

/**
 * Os dois pontos de configuracao que este calculo consulta — `get_option()`
 * (`wp-includes/option.php`), que e BC-10 e chega por ligacao tardia.
 *
 * Nao e porta: ler opcao nao e uma das cinco bordas de AD-08, e a porta de
 * dados deste modulo so conhece as tabelas de metadado de T002. A regra de
 * dependencia 3 proibe importar o contexto que declara a tabela de opcoes, logo
 * a leitura chega por argumento, como `organizarPorAnoEMes` chegou em T003.
 */
export interface OpcoesDeTamanhoDeImagem {
  /**
   * `(int) get_option( $nome )` (`wp-includes/media.php:946` e `:952`).
   *
   * **Opcao ausente vale `0`**, porque `(int) false` e `0` no PHP — e e esse
   * `0` que faz `medium_large` nascer com altura `0` e que faz um tamanho sem
   * nenhuma das duas opcoes ser **saltado** por {@link tamanhosRegistrados}.
   */
  medida(nome: string): number;
  /**
   * `get_option( $nome )` **cru**, sem cast (`wp-includes/media.php:963`).
   *
   * Sem cast porque o legado precisa distinguir arranjo de escalar logo em
   * seguida: o par de posicoes sobrevive, e todo o resto e reduzido a booleano.
   */
  recorte(nome: string): ValorDeRecorteGravado;
}

/**
 * `get_intermediate_image_sizes()` (`wp-includes/media.php:895`).
 *
 * Os quatro fixos, e depois as **chaves** dos adicionais, na ordem em que
 * foram registrados. `array_merge` com chaves de texto preserva a ordem e nao
 * deduplica nome que ja esteja nos quatro fixos — um `add_image_size(
 * 'thumbnail', ... )` produz `thumbnail` **duas vezes** nesta lista, e
 * `wp_get_registered_image_subsizes()` sobrescreve a entrada ao chegar na
 * segunda. O resultado observavel e o do legado; a duplicata e dele.
 */
export function nomesDeTamanhosIntermediarios(
  adicionais: readonly TamanhoAdicional[] = TAMANHOS_ADICIONAIS_DE_FABRICA,
): readonly string[] {
  if (adicionais.length === 0) {
    return NOMES_DE_TAMANHO_FIXOS;
  }
  // O ponto de extensao `intermediate_image_sizes` (`:911`) nao e emitido.
  return [...NOMES_DE_TAMANHO_FIXOS, ...adicionais.map((um) => um.nome)];
}

/**
 * `wp_get_registered_image_subsizes()` (`wp-includes/media.php:930`).
 *
 * O mapa que sai daqui e o `$new_sizes` de `wp_create_image_subsizes()` e o
 * universo de `wp_get_missing_image_subsizes()`. A ordem de insercao e a de
 * {@link nomesDeTamanhosIntermediarios}, e ela e observavel: e a ordem em que
 * uma extensao enxerga os tamanhos, e e a base sobre a qual a reordenacao por
 * prioridade da geracao e aplicada.
 *
 * ⚠️ **A regra que salta tamanho e `empty()` nas DUAS medidas, nao em uma**
 * (`:955`, com o *"This size isn't set"* em `:956`). `medium_large`, que nasce
 * `768x0`, **nao**
 * e saltado — so seria se as duas opcoes dele fossem `0`. Quem saltar por uma
 * medida so perde o tamanho que um porte perde.
 */
export function tamanhosRegistrados(
  opcoes: OpcoesDeTamanhoDeImagem,
  adicionais: readonly TamanhoAdicional[] = TAMANHOS_ADICIONAIS_DE_FABRICA,
): ReadonlyMap<string, TamanhoDeImagem> {
  const porNome = new Map<string, TamanhoAdicional>();
  for (const adicional of adicionais) {
    porNome.set(adicional.nome, adicional);
  }

  const todos = new Map<string, TamanhoDeImagem>();

  for (const nome of nomesDeTamanhosIntermediarios(adicionais)) {
    const adicional = porNome.get(nome);

    // "For sizes added by plugins and themes." / "For default sizes set in
    // options." (`:941` e `:946`)
    const largura =
      adicional?.largura !== undefined
        ? Math.trunc(adicional.largura)
        : opcoes.medida(`${nome}_size_w`);

    const altura =
      adicional?.altura !== undefined
        ? Math.trunc(adicional.altura)
        : opcoes.medida(`${nome}_size_h`);

    if (!largura && !altura) {
      // "This size isn't set." (`:956`)
      continue;
    }

    const recorteGravado: ValorDeRecorteGravado =
      adicional?.recorte !== undefined
        ? adicional.recorte
        : opcoes.recorte(`${nome}_crop`);

    todos.set(nome, {
      largura,
      altura,
      recorte: normalizarRecorte(recorteGravado),
    });
  }

  return todos;
}

/**
 * `if ( ! is_array( $size_data['crop'] ) || empty( $size_data['crop'] ) ) { $size_data['crop'] = (bool) $size_data['crop']; }`
 * (`wp-includes/media.php:966`-`:967`).
 *
 * Duas coisas que esta linha faz e que um porte perde:
 *
 * 1. **o par de posicoes sobrevive**, e e por ele que uma extensao recorta fora
 *    do centro (`add_image_size( 'capa', 800, 600, array( 'left', 'top' ) )`);
 * 2. **todo o resto vira booleano pela verdade de PHP**, e ali `'0'` e
 *    **falso**. Uma tela que grave a cadeia `'0'` no campo de recorte desliga o
 *    recorte, e `Boolean('0')` deste runtime diria o contrario — e a mesma
 *    divergencia que `armazenamento/verdade-de-php.ts` registra para o metadado.
 */
export function normalizarRecorte(valor: ValorDeRecorteGravado): Recorte {
  if (typeof valor === 'object' && valor !== null) {
    /*
      `is_array( $crop )` verdadeiro e `empty( $crop )` falso: o par sobrevive
      como esta. Arranjo **vazio** nao e representavel nesta forma, porque
      `Recorte` e um par de duas posicoes — e o legado o reduziria a `false`
      pelo `empty()`, que e o mesmo resultado do ramo final desta funcao.
    */
    return valor;
  }
  if (typeof valor === 'boolean') {
    return valor;
  }
  if (typeof valor === 'number') {
    return valor !== 0;
  }
  if (typeof valor === 'string') {
    return valor !== '' && valor !== '0';
  }
  // `null` e a opcao ausente, que no legado e o `false` de `get_option()`.
  return false;
}
