/**
 * `plataforma/traducao/` — a traducao.
 *
 * Entregas da feature `015-plataforma-transversal`:
 *
 * - **T002** — *"registro de operacao, traducao, sanitizacao e camada de dados
 *   carregam como modulos proprios, com as portas declaradas e nenhuma regra
 *   implementada"*: a porta de catalogo e a forma do pedido.
 * - **T009** — US-4, *"traduzir a interface a partir de catalogo declarado e
 *   atualizavel"*, CA-4.1 a CA-4.5: o idioma (`./idioma.ts`), o leitor de `.mo`
 *   (`./catalogo-mo.ts`), a expressao de plural (`./expressao-de-plural.ts`), o
 *   tradutor por requisicao (`./tradutor.ts`) e o portao da instalacao de
 *   catalogo (`./instalacao-de-catalogo.ts`). Os seis testes do catalogo
 *   (UT-166-1 a UT-166-6) sao **T010**.
 *
 * Leitura obrigatoria de quem mexer aqui: `./README.md`.
 *
 * **O nome da pasta nao foi escolhido aqui**: `target_architecture.md` nomeia
 * `plataforma/traducao/` na tabela de componentes, origem *"fundido —
 * `l10n-e-traducoes`"*.
 *
 * **Este e o modulo mais pesado da arvore medida, e isso e o risco 1 do
 * `plan.md`.** A aresta de entrada da traducao tem 13.335 pontos vindos de **68
 * dos 71 modulos**, e a contagem direta do `plan.md` da 13.705 chamadas de
 * funcao de traducao em 1.467 arquivos. A `spec.md` diz o que esse numero
 * significa num porte: *"o sinal de que nao existe separacao entre dominio e
 * apresentacao"*. O card que faria a separacao, REQ-161, ficou **bloqueado** e
 * nao entrou neste pacote. T009 constroi o tradutor e **nao** decide onde ele e
 * chamado: nenhum contexto passou a chama-lo por causa desta tarefa.
 *
 * Duas coisas que este arquivo faz de proposito:
 *
 * - **Nao guarda estado de modulo.** `EXT-CONTEXTO` (BR-MIGRAR-105). No legado o
 *   catalogo carregado mora no global `$l10n`
 *   (`wp-includes/l10n.php:1482`) e sobrevive porque o processo morre com a
 *   resposta. Num processo longo-vivo, com idioma **por conta**
 *   (`get_user_locale()`, `:94`), aquele mesmo desenho entrega a uma pessoa o
 *   idioma da outra. O cache de catalogo vive dentro de cada {@link Tradutor}, e
 *   ha um tradutor por requisicao.
 * - **Nao resolve nada no carregamento.** Compor o modulo nao le catalogo, e
 *   criar o tradutor tambem nao: a leitura acontece no primeiro pedido de cada
 *   dominio, como a carga tardia do legado (`_load_textdomain_just_in_time()`,
 *   `:1423`, disparada por `get_translations_for_domain()`, `:1483`).
 */

import type { PortaDeCatalogo } from './portas/index.js';
import {
  criarTradutor,
  type ContextoDoTradutor,
  type Tradutor,
} from './tradutor.js';

export * from './portas/index.js';
export {
  criarCatalogoQueRegistra,
  type CatalogoQueRegistra,
  type LeituraDeCatalogo,
} from './catalogo-que-registra.js';
export {
  IDIOMA_DE_FABRICA,
  PONTOS_DE_EXTENSAO_DO_IDIOMA,
  idiomaDaConta,
  idiomaDaInstalacao,
  idiomaDaRequisicao,
  sanitizarNomeDeIdioma,
  type ContaNoIdioma,
  type EntradaDoIdiomaDaInstalacao,
  type FiltroAntesDeDeterminar,
  type FiltroDeIdioma,
  type FiltroDeNomeSanitizado,
  type FontesDoIdiomaDaRequisicao,
  type OpcoesDoIdioma,
  type RequisicaoNoIdioma,
  type ValorDeOpcao,
} from './idioma.js';
export {
  MARCA_DO_FORMATO_MO,
  lerCatalogoMo,
  type CadeiaDeBytes,
  type CatalogoMo,
} from './catalogo-mo.js';
export {
  EXPRESSAO_DE_PLURAL_DE_RECUO,
  ErroNaAvaliacaoDoPlural,
  ErroNaExpressaoDePlural,
  compilarExpressaoDePlural,
  formaDePlural,
  type ExpressaoDePlural,
} from './expressao-de-plural.js';
export {
  PONTOS_DE_EXTENSAO_DA_TRADUCAO,
  criarTradutor,
  pontoDoDominio,
  type ContextoDoTradutor,
  type FiltroDePlural,
  type FiltroDePluralComContexto,
  type FiltroDeTexto,
  type FiltroDeTextoComContexto,
  type FiltrosDaTraducao,
  type Tradutor,
} from './tradutor.js';
export {
  CAPACIDADE_DE_INSTALAR_CATALOGO,
  instalacaoDeCatalogoAutorizada,
  instalacaoDeCatalogoPossivel,
  type PerguntaDeCapacidade,
  type SistemaDeArquivosAceitaCatalogo,
} from './instalacao-de-catalogo.js';

/**
 * A porta de que este modulo depende, na forma em que ele a recebe.
 *
 * Uma so, e `./portas/index.ts` explica por que esta e a borda de arquivos e nao
 * uma porta de traducao — distincao que AD-08 fez por escrito.
 */
export interface PortasDeTraducao {
  readonly catalogo: PortaDeCatalogo;
}

/**
 * O modulo carregado.
 *
 * | criterio | o que ele exige | onde esta |
 * |---|---|---|
 * | CA-4.1 | idioma configuravel **por instalacao e por conta** | `./idioma.ts`: `get_locale()` (`l10n.php:30`), `get_user_locale()` (`:94`) e `determine_locale()` (`:124`), que so usa o da conta no painel |
 * | CA-4.2 | textos de catalogo externo ao codigo, atualizavel sem alterar o sistema | a porta le o arquivo; `./catalogo-mo.ts` le o formato (`class-wp-translation-file-mo.php:90`) |
 * | CA-4.3 | texto sem traducao cai no idioma de origem, sem erro e sem vazio | `./tradutor.ts`: `NOOP_Translations` (`pomo/translations.php:418`) e o recuo de `WP_Translations` (`l10n/class-wp-translations.php:127`, `:150`) |
 * | CA-4.4 | instalar catalogo exige capacidade declarada, e ela consta da matriz | a matriz ja tinha (`plataforma/autorizacao/concessao-por-extensao.ts`, `PERM-7`); os dois portoes do painel em `./instalacao-de-catalogo.ts` |
 * | CA-4.5 | numero e ordem de palavras por forma declarada, nao por concatenacao | `./expressao-de-plural.ts` (`pomo/plural-forms.php:99`, `:261`) e as quatro formas de `./pedido-de-traducao.ts` |
 */
export interface ModuloDeTraducao {
  readonly nome: 'traducao';
  readonly portas: PortasDeTraducao;
  /**
   * O tradutor de uma requisicao, sobre a porta do modulo. Um por requisicao:
   * e ele que guarda o catalogo carregado (`./tradutor.ts`).
   */
  criarTradutor(contexto: ContextoDoTradutor): Tradutor;
}

/**
 * Compoe o modulo sobre a porta recebida.
 *
 * Trocar a origem do catalogo e passar outra implementacao aqui, sem alterar
 * arquivo deste modulo — o criterio de *"substituivel"* de `EXT-SUBST`
 * (BR-MIGRAR-103).
 */
export function criarModuloDeTraducao(
  portas: PortasDeTraducao,
): ModuloDeTraducao {
  return {
    nome: 'traducao',
    portas,
    criarTradutor: (contexto) => criarTradutor(portas.catalogo, contexto),
  };
}
