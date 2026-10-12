/**
 * A porta do driver: a **unica** fala com o protocolo do banco em toda a arvore.
 *
 * Tarefa **T002** da feature `015-plataforma-transversal` — *"as portas
 * declaradas e nenhuma regra implementada"*. `satisfaz: — (infraestrutura)`.
 *
 * Esta e a primeira das cinco bordas de AD-08 (*"cinco portas — dados, HTTP,
 * sistema de arquivos, cache de objeto e e-mail"*), e a razao de ela existir
 * aqui e nao no contexto que consulta esta na regra de dependencia 4 de
 * `target_architecture.md`: *"`contextos/` ou `plataforma/` para adaptador
 * concreto: proibido. So pela porta"*. O adaptador que a implementa e
 * `adaptadores/driver-mysql`, que o desenho descreve como *"porta de dados.
 * **Reproduz a ausencia de transacao**: zero `START TRANSACTION`, zero
 * `COMMIT`"* — e que esta arvore ainda nao tem.
 *
 * ---
 *
 * ## A diferenca entre esta porta e as `PortaDeDados` dos contextos
 *
 * Os sete contextos ja mesclados declaram, cada um, uma `PortaDeDados` com
 * `selecionar` e `escrever`. **Aquilo nao e esta porta.** Aquilo e o que o
 * contexto precisa; isto e o que a borda oferece. A diferenca aparece em tres
 * pontos:
 *
 * 1. **O retorno nao e separado por leitura e escrita.** No legado `query()`
 *    devolve *"boolean true for CREATE, ALTER, TRUNCATE and DROP queries. Number
 *    of rows affected/selected for all other queries. Boolean false on error"*
 *    (`wp-includes/class-wpdb.php:2214`, docblock em `:2211`). Quem separa
 *    leitura de escrita e a camada acima, com a conveniencia que ela quiser —
 *    aqui estao os tres observaveis juntos, porque e assim que a borda os
 *    entrega.
 * 2. **Os dois prefixos estao aqui.** O legado tem `prefix` e `base_prefix`:
 *    `set_prefix()` (`:998`) define os dois e `set_blog_id()` (`:1043`) troca o
 *    primeiro ao mudar de site da rede, mantendo o segundo — e e por isso que
 *    `users` e `usermeta` sao globais numa rede. Varios contextos declararam
 *    **nao** ter `prefixoBaseDeTabela` porque nenhuma tabela deles e global
 *    (`contextos/classificacao/portas/porta-de-dados.ts:88`); a borda tem de ter
 *    os dois, porque e ela que serve os dois casos.
 * 3. **Nao ha transacao, e isso e contrato.** `EXT-EXCLUSAO` (BR-MIGRAR-104)
 *    mede **zero** `START TRANSACTION` e **zero** `COMMIT` em 1.467 arquivos, e
 *    o P5 da constituicao poe a cascata de apagamento no observavel: envolver
 *    uma sequencia numa transacao mudaria o que fica orfao. Declarar
 *    `iniciar`/`confirmar` nesta porta seria oferecer o que nao existe.
 *
 * ---
 *
 * ## O que esta porta deliberadamente nao tem
 *
 * - **Nao tem contador de consultas.** CA-3.5 pede perfil de consultas por
 *   requisicao, e no legado ele nao mora no driver: mora na camada, em
 *   `num_queries` (`wp-includes/class-wpdb.php:93`) e na lista `queries`, que so
 *   e povoada *"when `SAVEQUERIES` is defined and truthy"* (`:719`, com os dois
 *   portoes em `:2348` e `:2358`). O contador e **por requisicao**
 *   (`EXT-CONTEXTO`, BR-MIGRAR-105): quem o guardar como estado de modulo soma
 *   requisicoes alheias. T007 o constroi; a porta nao.
 * - **Nao tem `esc_like` nem escape de valor.** Escapar e trabalho de quem fala
 *   o protocolo, do lado do adaptador. A camada manda texto e valores
 *   separados, e e exatamente essa separacao que CA-3.1 cobra.
 * - **Nao e assincrona.** AD-04 fixa a fronteira de `await` em `adaptadores/`:
 *   *"`contextos/` e `plataforma/` sao **sincronos**"*. A razao nao e gosto — e
 *   que `await` no meio dos 1.463 `echo`/`print` muda a ordem de emissao do
 *   HTML, que e saida observavel. O adaptador resolve a I/O antes, ou expoe
 *   fachada sincrona sobre dado ja carregado, como `FonteDeAutorizacao` de
 *   `plataforma/autorizacao/` ja faz nesta arvore.
 *
 * ---
 *
 * ## 🔴 Duas coisas que esta porta nao decide, e nao pode
 *
 * - **Qual banco.** `BR-HUMANA-002` esta **PENDENTE**: o banco alvo nao foi
 *   declarado, e a restricao e estrutural — nove classes montam SQL por
 *   fragmento com um ponto de filtro entre cada fragmento, e esses filtros sao
 *   contrato de extensao. A tabela *Nao negociavel* da constituicao poe
 *   *"escolher a tecnologia de qualquer slot do plano"* fora do alcance do
 *   agente. Esta porta e uma interface, e e compativel com a recomendacao do
 *   slot `persistencia` (driver MySQL em protocolo nativo) sem exigi-la.
 * - **Se a camada de dados continua substituivel por presenca de arquivo.** No
 *   legado ela e: `require_wp_db()` carrega `wp-content/db.php` se o arquivo
 *   existir (`wp-includes/load.php:711`, `:712`), e isso e um dos quatro
 *   *drop-ins* de `EXT-SUBST` (BR-MIGRAR-103). REQ-170 **quer descartar** esse
 *   mecanismo, P8 e P2 o preservam, e `spec.md` registra o conflito como **nao
 *   resolvido**. Trocar o adaptador por esta porta e substituicao por declaracao
 *   explicita; o caminho de arquivo e questao aberta, e T002 nao a toca.
 */

import type { Consulta, LinhaDeResultado } from '../consulta.js';

/**
 * O que a borda devolve de uma consulta.
 *
 * Os tres campos sao os tres observaveis que `query()` do legado entrega,
 * desempacotados em vez de multiplexados num `bool|int`
 * (`wp-includes/class-wpdb.php:2214`). Leitura povoa `linhas`; escrita povoa
 * `linhasAfetadas` e, quando houve chave gerada, `idGerado`.
 *
 * Nenhum campo de erro, pelo mesmo motivo de `ResultadoDeEscrita`: `DB-DEG`
 * (BR-MIGRAR-083) manda a escrita invalida **degradar**, nao falhar.
 */
export interface ResultadoDoDriver {
  readonly linhas: readonly LinhaDeResultado[];
  readonly linhasAfetadas: number;
  readonly idGerado: number | null;
}

export interface PortaDeDriver {
  /**
   * Prefixo das tabelas do site corrente (o `prefix` do legado, `:998`).
   */
  readonly prefixoDeTabela: string;

  /**
   * Prefixo das tabelas globais da rede (o `base_prefix` do legado, que
   * `set_blog_id()` **nao** troca, `:1043`).
   *
   * Fora de rede os dois valores coincidem, e coincidir e o caso de fabrica —
   * nao e motivo para declarar um so.
   */
  readonly prefixoBaseDeTabela: string;

  /** Executa a consulta parametrizada e devolve os tres observaveis. */
  executar(consulta: Consulta): ResultadoDoDriver;
}
