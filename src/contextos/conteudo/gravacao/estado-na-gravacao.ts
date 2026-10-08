/**
 * **US-2**: o estado editorial resolvido na gravacao — `draft` quando ninguem
 * informa.
 *
 * Entrega de **T005** da feature `002-autoria-e-publicacao`, e e o arquivo que a
 * feature inteira existe para proteger. A regra e **BR-MIGRAR-001** (`P1`,
 * confianca 🟢), e o catalogo a escreve assim:
 *
 * > **Publicar e ato explicito.** `wp_insert_post()` grava `draft` quando o
 * > status nao e informado, enquanto o default do DDL e `publish`: duas regras
 * > para a mesma coluna, dependendo de quem escreve.
 * > — `target_business_rules.md`, BR-MIGRAR-001
 *
 * E a nota de compatibilidade da mesma regra fecha a porta para a "limpeza" que
 * um porte faria sem perceber: *"A divergencia entre o default do codigo e o
 * default do DDL e **efeito no banco**, que a Decisao 2 poe no contrato. O alvo
 * nao pode unificar os dois defaults."*
 *
 * ---
 *
 * # Os tres criterios de US-2, e onde cada um se cumpre
 *
 * | criterio | o que o cumpre | ancora |
 * |---|---|---|
 * | **CA-2.1** *gravar sem informar o estado resulta em rascunho, nunca em publicado* | {@link resolverEstadoNaGravacao}, o `empty()` de `:4703` | `wp-includes/post.php:4703` |
 * | **CA-2.2** *o default do armazenamento nao contradiz: nao existe caminho em que a omissao publique* | as **duas** barreiras desta funcao, mais a lista de 21 colunas que o repositorio de T002 sempre escreve | `:4612` e `:4703`; `../armazenamento/conteudo.ts` |
 * | **CA-2.3** *conteudo em rascunho nao aparece em consulta publica alguma* | o valor gravado e `draft`, e `draft` e um dos estados cujo registro declara `public => false` e `publicly_queryable => false` | `:689`, e `../estado-editorial.ts` |
 *
 * **CA-2.3 nao se cumpre com codigo novo aqui, e nem poderia.** Quem filtra
 * `post_status` na consulta publica e `WP_Query` — *"o portao de `post_status`"*,
 * que e **T009 da feature 004** (`contextos/leitura-publica/`) — e esta tarefa
 * nao tem consulta publica para alterar. O que ela entrega e a **condicao** do
 * criterio: a linha gravada carrega um estado que o registro declara nao
 * publico, nao consultavel pelo publico e excluido da busca somente quando
 * `internal` (que `draft` nao e). E a mesma forma pela qual T003 afirmou CA-1.3,
 * registrada no teste `CA-1.3 o estado gravado e o unico publico e consultavel
 * pelo publico`.
 *
 * ---
 *
 * # As DUAS barreiras do legado, e por que as duas ficam
 *
 * O `draft` aparece **duas vezes** nesta funcao do legado, e nao e redundancia:
 *
 * 1. **No arranjo de defaults** (`:4612`): `'post_status' => 'draft'`, aplicado
 *    por `wp_parse_args()` — que preenche **so as chaves ausentes**. Esta
 *    barreira pega quem **nao manda** a chave.
 * 2. **No ternario** (`:4703`):
 *    `$post_status = empty( $postarr['post_status'] ) ? 'draft' : $postarr['post_status'];`
 *    — esta pega quem **manda a chave vazia**: `''`, `null`, `0` e, por
 *    `empty()`, tambem a cadeia `'0'` (ver `verdade-de-php.ts`).
 *
 * Com as duas, **nao existe valor de entrada que produza `publish` sem alguem
 * pedir `publish`** — que e literalmente o texto de CA-2.2. Portar so a
 * primeira deixaria `post_status: ''` ir para a coluna e um `SELECT ... WHERE
 * post_status = 'publish'` nao o encontraria, mas tambem nao o encontraria a
 * consulta de rascunho: o conteudo ficaria invisivel nas duas. Portar so a
 * segunda daria no mesmo resultado **neste** caminho e divergiria no filtro
 * `wp_insert_post_parent`, que recebe o pedido **com os defaults aplicados**
 * (`:4851`-`:4856`) e veria `post_status` ausente em vez de `draft`.
 *
 * ## O terceiro default, que e de outra metade e nao se toca
 *
 * `post_status varchar(20) NOT NULL default 'publish'`
 * (`wp-admin/includes/schema.php:167`) continua valendo para quem **insere linha
 * direto na tabela**, e esse caminho nao e metodo de repositorio nenhum: e o DDL
 * que T002 declarou em `../armazenamento/esquema.ts`. O primeiro cenario de
 * `02-publicacao-e-agendamento-de-conteudo.feature` afirma os dois lados na
 * mesma corrida — *"as duas gravam o status `draft`"*, *"uma linha inserida
 * diretamente na tabela, sem informar o status, recebe `publish`"*, *"e a
 * divergencia entre os dois defaults e identica nas duas metades"*.
 *
 * As duas constantes vivem no vocabulario (`../estado-editorial.ts`,
 * `ESTADO_PADRAO_DA_APLICACAO` e `ESTADO_PADRAO_DO_ARMAZENAMENTO`), declaradas
 * por T001 e **nao resolvidas** por ela. Esta tarefa resolve a primeira; a
 * segunda ja foi resolvida por T002, no DDL. Nenhuma das duas e redeclarada
 * aqui: um valor literal neste arquivo tornaria possivel mudar um dos dois sem
 * o outro, que e exatamente o que BR-MIGRAR-001 proibe.
 *
 * ---
 *
 * # A terceira regra desta funcao, que e de outra feature e esta aqui
 *
 * Logo depois do ternario, duas linhas reescrevem o estado quando o tipo e
 * anexo (`:4705`-`:4707`). E **BR-MIGRAR-002** (`P2`): *"Anexo nunca e
 * 'publicado'. Status fora de `inherit`, `private`, `trash`, `auto-draft` e
 * reescrito para `inherit`: a visibilidade do arquivo e a do post pai"*.
 *
 * **Ela esta implementada aqui, e nao na feature de midia, pelo mesmo
 * precedente que T003 usou para a guarda de republicacao nula:** e a linha
 * seguinte da funcao que esta sendo portada, e sem ela a resposta de CA-2.1
 * ficaria **errada para um dos 16 tipos do nucleo** — gravar anexo sem informar
 * estado produz `inherit`, nao `draft`. Quem verifica os critérios de anexo e a
 * feature 006; quem tem de ter a linha e quem porta esta funcao. A nota de
 * migracao da propria regra diz onde ela mora no alvo: *"Reescrita de valor em
 * transito. No alvo e funcao pura aplicada na borda de escrita"* — e e o que
 * {@link resolverEstadoNaGravacao} e.
 *
 * ---
 *
 * # O que este arquivo NAO faz
 *
 * - **Nao valida o estado.** Estado fora dos 12 de fabrica passa e e gravado:
 *   `post_status` e `varchar(20)` sem `ENUM` e sem `CHECK` (`DB-ENUM`),
 *   `register_post_status()` e ponto de extensao publico (P2) e o legado
 *   **tolera** estado nao registrado, degradando o mapeamento de capacidade com
 *   aviso de uso indevido (UC-03, *Excecoes*). As tres razoes estao por extenso
 *   no cabecalho de `../estado-editorial.ts`, e por isso o retorno e `string`.
 * - **Nao recusa `auto-draft` pedido pela API.** CA-11.3 (*"o estado de rascunho
 *   automatico nao pode ser pedido por quem chama a API"*) e **T023**, e no
 *   legado a recusa nao esta aqui: esta na superficie REST, que remove
 *   `auto-draft` da enumeracao do parametro
 *   (`class-wp-rest-posts-controller.php`). Recusa-lo nesta funcao fecharia o
 *   `wp_insert_post()` que o proprio nucleo chama para criar o rascunho
 *   automatico (`:8373`).
 * - **Nao compara data.** Publicado com data a frente virando agendado, e
 *   agendado com data no passado virando publicado, sao `:4797`-`:4809` —
 *   **T013** (US-6). A ausencia e visivel em `gravar.ts`, na posicao exata.
 */

import { TIPO_DE_ANEXO } from '../armazenamento/index.js';
import { ESTADO_PADRAO_DA_APLICACAO } from '../estado-editorial.js';
import { vazioComoNoPhp } from './verdade-de-php.js';

/**
 * `'post'` — o tipo que a gravacao assume quando ninguem informa (`:4660`).
 *
 * `$post_type = empty( $postarr['post_type'] ) ? 'post' : $postarr['post_type'];`
 * — o mesmo `empty()` do estado, e por isso `post_type = '0'` tambem cai no
 * default. Fica aqui, e nao no vocabulario de estado, porque e **tipo** e nao
 * estado; o registro aberto de tipos e de `plataforma/tipos-de-conteudo/`.
 */
export const TIPO_PADRAO_DA_GRAVACAO = 'post';

/**
 * `inherit` — o estado que o anexo recebe quando o pedido traz qualquer outro
 * fora da lista preservada (`:4706`).
 *
 * BR-MIGRAR-002: *"a visibilidade do arquivo e a do post pai"*.
 */
export const ESTADO_HERDADO_DO_ANEXO = 'inherit';

/**
 * Os quatro estados que o anexo **conserva** (`:4705`).
 *
 * A ordem e a do legado. `inherit` esta na lista porque e o proprio default;
 * `private` porque anexo de conteudo privado o acompanha; `trash` porque a
 * lixeira de anexo existe quando `MEDIA_TRASH` esta ligada (BR-MIGRAR-032); e
 * `auto-draft` porque o anexo pode nascer junto do rascunho automatico.
 */
export const ESTADOS_PRESERVADOS_DO_ANEXO: readonly string[] = Object.freeze([
  'inherit',
  'private',
  'trash',
  'auto-draft',
]);

/**
 * `$post_type = empty( $postarr['post_type'] ) ? 'post' : $postarr['post_type'];`
 * (`:4660`).
 *
 * Resolvido antes do estado porque o estado **depende dele**: e o tipo que
 * decide se a reescrita de anexo acontece.
 */
export function resolverTipoNaGravacao(tipoPedido: string | undefined): string {
  return vazioComoNoPhp(tipoPedido) ? TIPO_PADRAO_DA_GRAVACAO : tipoPedido;
}

/**
 * **A regra de US-2**: o estado que vai para a coluna.
 *
 * Os dois passos, na ordem do legado, sao as duas linhas que este arquivo
 * inteiro documenta:
 *
 * 1. `empty( $postarr['post_status'] ) ? 'draft' : ...` (`:4703`) — CA-2.1;
 * 2. anexo fora da lista preservada vira `inherit` (`:4705`-`:4707`) —
 *    BR-MIGRAR-002.
 *
 * **A ordem dos dois importa e e observavel:** o anexo que chega sem estado
 * recebe `draft` no passo 1 e `inherit` no passo 2, porque `draft` nao esta na
 * lista preservada. Invertendo os passos, o anexo sem estado ficaria `draft` —
 * e um anexo em `draft` nao herda a visibilidade do pai em consulta nenhuma.
 *
 * `tipoResolvido` ja vem de {@link resolverTipoNaGravacao}: quem chamar esta
 * funcao com o tipo **cru** faria `post_type = ''` escapar da reescrita de
 * anexo, que no legado nao escapa (porque la o tipo foi resolvido 43 linhas
 * antes).
 */
export function resolverEstadoNaGravacao(
  tipoResolvido: string,
  estadoPedido: string | undefined,
): string {
  // Passo 1 (`:4703`). `vazioComoNoPhp` e o `empty()` do legado, inclusive para
  // a cadeia `'0'` — ver `verdade-de-php.ts`.
  const estado = vazioComoNoPhp(estadoPedido)
    ? ESTADO_PADRAO_DA_APLICACAO
    : estadoPedido;

  // Passo 2 (`:4705`). BR-MIGRAR-002, e a comparacao do legado e estrita
  // (`in_array( ..., true )`): nenhuma coercao de tipo entra aqui.
  if (
    tipoResolvido === TIPO_DE_ANEXO &&
    !ESTADOS_PRESERVADOS_DO_ANEXO.includes(estado)
  ) {
    return ESTADO_HERDADO_DO_ANEXO;
  }

  return estado;
}
