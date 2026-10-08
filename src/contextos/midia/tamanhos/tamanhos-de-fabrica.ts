/**
 * Os tamanhos de fabrica do legado, como dado.
 *
 * Segunda metade da entrega de **T001**: *"os tamanhos de fabrica do legado
 * registrados como dado"*. A regra e `M2` (BR-MIGRAR-058), e ela e literal:
 * *"quatro tamanhos nascem com o site: `thumbnail` 150x150, `medium` 300,
 * `medium_large` 768, `large` 1024 — mais `1536x1536` e `2048x2048` registrados
 * em codigo para telas de alta densidade"*. CA-3.2 cobra os seis: *"os tamanhos
 * de fabrica sao quatro, com as medidas declaradas, mais os dois de tela de alta
 * densidade"*.
 *
 * **Metade vem de opcao semeada e metade vem de codigo, e as duas fontes sao a
 * regra** — e a propria justificativa de migracao de BR-MIGRAR-058 diz isso.
 * Quem portar so a tabela de opcoes perde dois tamanhos; quem portar so o codigo
 * perde a configurabilidade dos outros quatro. Por isso cada entrada abaixo
 * declara de onde vem.
 *
 * **A ordem desta lista e significativa, e nao e a ordem em que as derivadas sao
 * geradas.** Esta aqui e a de `get_intermediate_image_sizes()`
 * (`wp-includes/media.php:895`): os quatro nomes fixos, e depois os adicionais
 * na ordem em que foram registrados, por `array_merge`. Ela sobrevive em
 * `wp_get_registered_image_subsizes()`, que itera sobre ela, e e por ela que
 * uma extensao ve a lista de tamanhos. Reordenar aqui muda saida observavel.
 *
 * ⚠️ **A ordem da GERACAO e outra, e quem portar T007 precisa dela:**
 * `_wp_make_subsizes()` reordena com uma lista de prioridade — `medium`,
 * `large`, `thumbnail`, `medium_large`, e depois o resto — antes do laco
 * (`wp-admin/includes/image.php:462-469`), e o comentario do codigo diz por que:
 * para que haja um tamanho utilizavel *"immediately even when there was an error
 * and not all sub-sizes were created"*. Como cada derivada e gravada no metadado
 * assim que nasce, essa e a ordem das chaves em `sizes` — e **a ordem das chaves
 * e byte a byte observavel**, porque o metadado e serializado no formato do PHP
 * (borda 2 de `target_architecture.md`, `DB-SER`). Nao e trabalho deste arquivo;
 * e trabalho de T007, e perder isso e perder paridade de bytes sem perder
 * nenhum teste de comportamento.
 *
 * **O que esta aqui e o valor de FABRICA, e o ponto de configuracao que o
 * altera em execucao** — nos dois casos como o P6 da constituicao exige: *"cada
 * numero vive num ponto de configuracao nomeado, com o valor de fabrica do
 * legado"*. Para os quatro primeiros o ponto de configuracao e uma opcao, e o
 * nome da opcao e contrato: `target_screens.md` registra, para a tela de
 * configuracao de midia, que *"o nome do campo e contrato: nao renomear"*. Ler
 * a opcao e da porta de dados, logo e de outra tarefa; o nome dela e dado, e
 * esta aqui.
 *
 * **O que NAO esta aqui, e e de proposito:**
 *
 * - **O registro mutavel onde uma extensao acrescenta tamanho.** No legado e o
 *   global `$_wp_additional_image_sizes`, preenchido a cada requisicao por
 *   `add_image_size()` (`wp-includes/media.php:312`). Ele e estado de
 *   REQUISICAO, nao de modulo (`EXT-CONTEXTO`, BR-MIGRAR-105), e quem o compor
 *   tem de compo-lo por requisicao. Nada aqui e mutavel: a lista e congelada,
 *   justamente para que duas composicoes nao consigam se enxergar por ela.
 * - **Os dois limites desta feature.** O teto de 2560 px da reducao na ingestao
 *   (`M1`, BR-MIGRAR-057) e o teto de 2048 px da lista de origens responsivas
 *   (`M3`, BR-MIGRAR-059) **nao sao tamanhos registrados**: sao limites
 *   aplicados por quem reduz (T009) e por quem monta a marcacao (T013), cada um
 *   com o seu ponto de configuracao e com o teste de borda que o P6 cobra. Pelo
 *   mesmo motivo o `thumbnail_crop` esta aqui e o `image_default_size` nao:
 *   este nao e medida de derivada.
 * - **A regra que salta tamanho nao definido** (`wp-includes/media.php:955`) e a
 *   que le a opcao em execucao. Sao de T007.
 *
 * ⚠️ **Coincidencia que engana:** o tamanho chamado `2048x2048` e o teto de
 * 2048 px da lista de origens responsivas sao coisas diferentes, e o legado
 * **nao** exclui a derivada de 2048 px da lista: o corte e `>` e nao `>=`
 * (`wp-includes/media.php:1584`). Quem ler os dois como o mesmo numero produz
 * uma lista de origens menor que a do legado. Aplicar isso e de T013.
 */

import type { TamanhoDeImagem } from './tamanho-de-imagem.js';

/** De onde a medida do tamanho vem no legado. */
export type OrigemDoTamanho =
  /** Opcao semeada pelo instalador, alteravel pela tela de configuracao. */
  | 'opcao-semeada'
  /** Registrado em codigo no arranque, sem tela que o altere. */
  | 'codigo';

/**
 * Os nomes dos seis tamanhos de fabrica, na ordem do legado.
 *
 * O nome e chave: ele vai para o metadado da derivada, e `_wp_make_subsizes()`
 * compara **por nome** para nao sobrescrever derivada existente. Renomear
 * qualquer um destes e mudanca de contrato publico (P8).
 */
export const NOMES_DE_TAMANHO_DE_FABRICA = [
  'thumbnail',
  'medium',
  'medium_large',
  'large',
  '1536x1536',
  '2048x2048',
] as const;

export type NomeDeTamanhoDeFabrica =
  (typeof NOMES_DE_TAMANHO_DE_FABRICA)[number];

/**
 * Os nomes das opcoes que `wp_get_registered_image_subsizes()` consulta para um
 * tamanho (`wp-includes/media.php:946`, `:952` e `:963`).
 *
 * Os tres nomes sao consultados para os quatro tamanhos de opcao, mas **so tres
 * deles sao semeados** — ver {@link OPCOES_SEMEADAS_DE_TAMANHO}.
 */
export interface OpcoesDoTamanho {
  readonly largura: string;
  readonly altura: string;
  readonly recorte: string;
}

/** Um tamanho de fabrica: a medida efetiva, mais de onde ela vem. */
export interface TamanhoDeImagemDeFabrica extends TamanhoDeImagem {
  readonly nome: NomeDeTamanhoDeFabrica;
  readonly origem: OrigemDoTamanho;
  /** Os pontos de configuracao, ou `null` quando o tamanho vem de codigo. */
  readonly opcoes: OpcoesDoTamanho | null;
}

const TAMANHOS: TamanhoDeImagemDeFabrica[] = [
  /*
    O UNICO tamanho de fabrica recortado, e e a opcao `thumbnail_crop` semeada
    em `1` que o torna assim (`wp-admin/includes/schema.php:487`). O cenario de
    paridade cobra os dois lados disso: *"o tamanho de miniatura e recortado
    quadrado nas duas"* e *"os outros tres sao proporcionais nas duas"*.
  */
  {
    nome: 'thumbnail',
    largura: 150,
    altura: 150,
    recorte: true,
    origem: 'opcao-semeada',
    opcoes: {
      largura: 'thumbnail_size_w',
      altura: 'thumbnail_size_h',
      recorte: 'thumbnail_crop',
    },
  },
  {
    nome: 'medium',
    largura: 300,
    altura: 300,
    recorte: false,
    origem: 'opcao-semeada',
    opcoes: {
      largura: 'medium_size_w',
      altura: 'medium_size_h',
      /*
        Consultada e NUNCA semeada: `get_option( 'medium_crop' )` devolve
        `false` numa instalacao de fabrica, e e dai que sai o `recorte: false`
        acima. O nome fica declarado porque a opcao existir passa a mudar o
        comportamento, e e assim que uma extensao recorta este tamanho.
      */
      recorte: 'medium_crop',
    },
  },
  /*
    `medium_large` e o tamanho que um porte perde. Ele nasce com `768x0` — o
    zero e a altura (`wp-admin/includes/schema.php:532-533`) — e **nao tem campo
    na tela de configuracao de midia**: os 10 campos que `target_screens.md`
    lista para `wp-admin/options-media.php` cobrem `thumbnail`, `medium` e
    `large`, e nenhum cobre este. Existe, e gerado, e invisivel.
  */
  {
    nome: 'medium_large',
    largura: 768,
    altura: 0,
    recorte: false,
    origem: 'opcao-semeada',
    opcoes: {
      largura: 'medium_large_size_w',
      altura: 'medium_large_size_h',
      /* Consultada e nunca semeada, como `medium_crop`. */
      recorte: 'medium_large_crop',
    },
  },
  {
    nome: 'large',
    largura: 1024,
    altura: 1024,
    recorte: false,
    origem: 'opcao-semeada',
    opcoes: {
      largura: 'large_size_w',
      altura: 'large_size_h',
      /* Consultada e nunca semeada, como `medium_crop`. */
      recorte: 'large_crop',
    },
  },
  /*
    Os dois de alta densidade, registrados em codigo por
    `_wp_add_additional_image_sizes()` (`wp-includes/media.php:5862`), que o
    legado pendura em `plugins_loaded` com prioridade `0`
    (`wp-includes/default-filters.php:693`). O comentario do codigo diz o que
    cada um dobra: `1536x1536` e *"2x medium_large size"* e `2048x2048` e *"2x
    large size"*.

    A prioridade `0` nao e detalhe: a ordem de carregamento do arranque e
    contrato publico (decisao fundadora D1, e a linha *"mudar a ordem de
    carregamento do arranque"* da tabela de nao negociaveis da constituicao).
    Quem registrar estes dois mais tarde deixa extensao que os le em
    `plugins_loaded` sem encontra-los.

    `add_image_size()` nao recebe `crop` nestas duas chamadas, e o default do
    parametro e `false` (`wp-includes/media.php:312`).
  */
  {
    nome: '1536x1536',
    largura: 1536,
    altura: 1536,
    recorte: false,
    origem: 'codigo',
    opcoes: null,
  },
  {
    nome: '2048x2048',
    largura: 2048,
    altura: 2048,
    recorte: false,
    origem: 'codigo',
    opcoes: null,
  },
];

/**
 * Os seis tamanhos de fabrica, na ordem do legado.
 *
 * **Congelada, e por regra de arquitetura e nao por estilo:** este e o unico
 * dado que duas composicoes do modulo compartilham, e `EXT-CONTEXTO`
 * (BR-MIGRAR-105) poe identidade e estado corrente no escopo da requisicao. Dado
 * imutavel pode ser compartilhado; dado mutavel faria duas requisicoes de sites
 * diferentes enxergarem o tamanho registrado uma da outra. `modulo.test.ts`
 * afirma o congelamento.
 */
export const TAMANHOS_DE_IMAGEM_DE_FABRICA: readonly TamanhoDeImagemDeFabrica[] =
  Object.freeze(
    TAMANHOS.map((tamanho) =>
      Object.freeze({
        ...tamanho,
        opcoes: tamanho.opcoes === null ? null : Object.freeze(tamanho.opcoes),
      }),
    ),
  );

/**
 * As linhas de opcao que o instalador semeia para tamanho de imagem, com o
 * valor de fabrica (`populate_options()`, `wp-admin/includes/schema.php`).
 *
 * Sao **nove**, e as tres opcoes de recorte que faltam sao o ponto: de
 * `thumbnail_crop`, `medium_crop`, `medium_large_crop` e `large_crop`, o
 * instalador semeia **so a primeira**. As outras tres sao consultadas e nao
 * existem, e `get_option()` devolve `false` — que e exatamente o recorte
 * desligado dos outros tres tamanhos. Semear as quatro produziria o mesmo
 * comportamento hoje e um sistema diferente do legado na tabela de opcoes, que
 * `parity_specs.md` poe na area *"efeito no banco"*.
 *
 * Quem semeia a instalacao nao e esta feature (e `010-operacao-do-software`);
 * o dado esta aqui porque e aqui que ele e conferivel contra `M2`.
 */
export const OPCOES_SEMEADAS_DE_TAMANHO: Readonly<Record<string, number>> =
  Object.freeze({
    /* schema.php:485 */ thumbnail_size_w: 150,
    /* schema.php:486 */ thumbnail_size_h: 150,
    /* schema.php:487 */ thumbnail_crop: 1,
    /* schema.php:488 */ medium_size_w: 300,
    /* schema.php:489 */ medium_size_h: 300,
    /* schema.php:532 */ medium_large_size_w: 768,
    /* schema.php:533 */ medium_large_size_h: 0,
    /* schema.php:495 */ large_size_w: 1024,
    /* schema.php:496 */ large_size_h: 1024,
  });
