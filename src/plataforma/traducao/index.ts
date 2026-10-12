/**
 * `plataforma/traducao/` — a traducao, carregada vazia.
 *
 * Entrega de **T002** da feature `015-plataforma-transversal`: *"registro de
 * operacao, traducao, sanitizacao e camada de dados carregam como modulos
 * proprios, com as portas declaradas e nenhuma regra implementada"*.
 * `satisfaz: — (infraestrutura)`. **Nenhum criterio de aceite esta satisfeito
 * aqui**: US-4 e **T009**, e os seis testes do catalogo (UT-166-1 a UT-166-6)
 * sao **T010**. Leitura obrigatoria de quem pegar T009: `./README.md`.
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
 * nao entrou neste pacote — e e por isso que o primeiro aviso de `./README.md` e
 * uma pergunta em aberto e nao uma instrucao.
 *
 * Duas coisas que este arquivo faz de proposito:
 *
 * - **Nao guarda estado de modulo.** `EXT-CONTEXTO` (BR-MIGRAR-105). No legado o
 *   catalogo carregado mora no global `$l10n`
 *   (`wp-includes/l10n.php:1482`) e sobrevive porque o processo morre com a
 *   resposta. Num processo longo-vivo, com idioma **por conta**
 *   (`get_user_locale()`, `:94`), aquele mesmo desenho entrega a uma pessoa o
 *   idioma da outra. `./modulo.test.ts` afirma que duas composicoes nao se
 *   enxergam.
 * - **Nao resolve nada no carregamento.** Compor o modulo nao le catalogo. No
 *   legado o carregamento tem hora marcada e e contrato publico (`EXT-ORDEM`,
 *   BR-MIGRAR-106): `load_textdomain()` (`:726`) e, desde a 4.6, a carga
 *   tardia `_load_textdomain_just_in_time()` que `get_translations_for_domain()`
 *   dispara (`:1483`). `./modulo.test.ts` afirma que nenhuma leitura acontece ao
 *   compor.
 */

import type { PortaDeCatalogo } from './portas/index.js';

export * from './portas/index.js';
export {
  criarCatalogoQueRegistra,
  type CatalogoQueRegistra,
  type LeituraDeCatalogo,
} from './catalogo-que-registra.js';

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
 * Nenhuma operacao: traduzir e T009. A tabela abaixo e a pauta dela, com o que
 * cada criterio de US-4 exige e a ancora do legado que o decide:
 *
 * | criterio | o que ele exige | ancora no legado |
 * |---|---|---|
 * | CA-4.1 | idioma configuravel **por instalacao e por conta** | `get_locale()` (`l10n.php:30`, com `WPLANG` em `:43`), `get_user_locale()` (`:94`, que cai em `get_locale()` quando nao ha conta, `:106`) e `determine_locale()` (`:124`) |
 * | CA-4.2 | textos de catalogo externo ao codigo, atualizavel sem alterar o sistema | `load_textdomain()` (`:726`); formato `.mo`/`.po` em `wp-includes/pomo/` e a segunda geracao em `wp-includes/l10n/` |
 * | CA-4.3 | texto sem traducao cai no idioma de origem, sem erro e sem vazio | `NOOP_Translations` (`:1486` a `:1494`), cujo `translate()` e `return $singular;` (`pomo/translations.php:495`) e cujo plural e `1 === count ? singular : plural` (`:533`) |
 * | CA-4.4 | instalar catalogo exige capacidade declarada, e ela consta da matriz | ⚠️ **ja esta nesta arvore** — ver abaixo |
 * | CA-4.5 | numero e ordem de palavras por forma declarada, nao por concatenacao | `_n()` (`:483`), `_nx()` (`:542`), `_x()` (`:409`) e a expressao de plural em `pomo/plural-forms.php:243` |
 *
 * ⚠️ **CA-4.4 nao e trabalho deste modulo, e a parte dele que ja existe esta em
 * `plataforma/autorizacao/`.** A capacidade `install_languages` **nao esta em
 * papel algum** no legado: entra por ponto de extensao, com
 * `wp_maybe_grant_install_languages_cap()`
 * (`wp-includes/capabilities.php:1309`) registrado em prioridade `1`
 * (`wp-includes/default-filters.php:771`), e com um `case` proprio no mapeamento
 * (`wp-includes/capabilities.php:644`, `:651`). Isso e `PERM-7`
 * (BR-MIGRAR-093), fechado por T019 da feature `001` em
 * `plataforma/autorizacao/concessao-por-extensao.ts`, que ja exporta
 * `CAPACIDADES_QUE_HABILITAM_O_IDIOMA` e
 * `PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO`. O que **falta** para CA-4.4 e o
 * mecanismo de instalacao de catalogo (UC-33), que nenhuma tarefa desta feature
 * constroi — e isso esta registrado em `./README.md`, nao resolvido aqui.
 */
export interface ModuloDeTraducao {
  readonly nome: 'traducao';
  readonly portas: PortasDeTraducao;
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
  };
}
