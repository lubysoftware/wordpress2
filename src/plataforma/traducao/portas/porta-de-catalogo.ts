/**
 * A porta do catalogo: **de onde vem o arquivo de traducao**.
 *
 * Tarefa **T002** da feature `015-plataforma-transversal` — *"as portas
 * declaradas e nenhuma regra implementada"*. `satisfaz: — (infraestrutura)`.
 * US-4 e **T009**.
 *
 * ---
 *
 * ## ⚠️ A traducao NAO ganha porta. Esta porta nao e a traducao.
 *
 * AD-08 e literal: *"cinco portas — dados, HTTP, sistema de arquivos, cache de
 * objeto e e-mail. O barramento de hooks NAO ganha porta, e `traducao` e
 * `escape` **tambem nao**"*, e a alternativa descartada esta nomeada ali do
 * lado: *"porta para traducao e escape (13.335 e 3.416 pontos de entrada — o
 * custo de indirecao nao tem contrapartida nenhuma nessa escala)"*. A tabela de
 * componentes repete: `plataforma/traducao/` *"nao ganha porta: 13.335 pontos de
 * entrada de **68 dos 71 modulos**"*.
 *
 * O que esta declarado aqui e outra coisa, e e uma das cinco: **a borda do
 * sistema de arquivos**, porque o catalogo e arquivo. Quem chama traducao chama
 * a funcao, direto, como hoje; quem **le o catalogo** passa por aqui. Confundir
 * as duas produz 13.335 indirecoes que o desenho recusou por escrito — e quem
 * pegar T009 vai ler o nome desta pasta (`portas/`) e precisar desta
 * distincao.
 *
 * ---
 *
 * ## Por que a porta devolve bytes, e nao entradas de catalogo
 *
 * Porque **analisar o formato e regra, nao borda**. O legado tem duas geracoes
 * de leitor ativas na arvore, e `technologies.json` registra as duas:
 * `wp-includes/pomo/` (6 arquivos — `mo.php`, `po.php`, `streams.php`,
 * `entry.php`, `translations.php`, `plural-forms.php`) e `wp-includes/l10n/`
 * (5 arquivos, com `class-wp-translation-file-mo.php` e
 * `class-wp-translation-file-php.php`). E a razao da recomendacao do slot
 * `traducao` do `plan.md` e exatamente esta divisao: *"a metade que importa
 * neste slot nao e ler o arquivo, e avaliar a expressao de plural — e nenhuma
 * biblioteca a entrega junto"*. Ler o arquivo e esta porta; avaliar o plural e
 * T009, e o legado o faz em `wp-includes/pomo/plural-forms.php` (a classe em
 * `:10`, a avaliacao em `:243`).
 *
 * ⚠️ **Os catalogos nao estao na arvore analisada** — e a lacuna L5 de
 * `soul.md`, repetida na secao *Migracao de dados* do `plan.md`: *"os catalogos
 * de traducao nao estao na arvore analisada"*. Logo nenhum vetor de conteudo de
 * catalogo sai de leitura: sai do oraculo de T001, ou de catalogo baixado pelo
 * mecanismo que UC-33 descreve.
 */

import type { Dominio, Idioma } from '../pedido-de-traducao.js';

/**
 * O conteudo bruto de um catalogo, como o disco o entrega.
 *
 * Bytes, nao texto: `.mo` e binario (`wp-includes/pomo/mo.php`), e o formato
 * carrega o proprio cabecalho de codificacao. Decidir o encoding antes de ler o
 * cabecalho e como se perde a primeira entrada de um catalogo.
 */
export type BytesDeCatalogo = Uint8Array;

export interface PortaDeCatalogo {
  /**
   * Le o catalogo daquele dominio naquele idioma, ou devolve `null` quando nao
   * existe.
   *
   * ⚠️ **`null` nao e erro.** CA-4.3: *"texto sem traducao no catalogo cai no
   * idioma de origem, sem erro e sem espaco vazio"* — e o legado faz isso
   * devolvendo um catalogo que nao traduz nada (`NOOP_Translations`,
   * `wp-includes/l10n.php:1486` a `:1494`), cujo `translate()` e
   * `return $singular;` (`wp-includes/pomo/translations.php:495`). Ausencia de
   * catalogo e caso normal, e e o caso de fabrica: uma instalacao nova em
   * `en_US` nao tem catalogo nenhum.
   *
   * O caminho nao aparece na assinatura de proposito: **qual arquivo** responde
   * por um par dominio/idioma e convencao de instalacao (`WP_LANG_DIR`, o
   * `$mofile` de `load_textdomain()`, `wp-includes/l10n.php:726`), e convencao
   * de caminho e do adaptador. Declarar o caminho aqui faria o dominio conhecer
   * o disco.
   */
  ler(dominio: Dominio, idioma: Idioma): BytesDeCatalogo | null;
}
