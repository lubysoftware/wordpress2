/**
 * `empty()` e a verdade de PHP, isoladas em duas funcoes nomeadas.
 *
 * Entrega de **T005** da feature `002-autoria-e-publicacao`, e e o arquivo que
 * decide CA-2.1 e CA-2.2 junto com `estado-na-gravacao.ts`. Existe por uma razao
 * de uma linha: **o caminho de gravacao do legado pergunta `empty()` doze vezes,
 * e `empty()` nao e `!valor` deste runtime.**
 *
 * ── O QUE E VAZIO LA, E NAO E AQUI ─────────────────────────────────────────
 *
 * | valor | `empty()` do PHP | `!valor` do JavaScript |
 * |---|---|---|
 * | `''` | vazio | falso — igual |
 * | `0` | vazio | falso — igual |
 * | `null` / ausente | vazio | falso — igual |
 * | `'0'` | **vazio** | **verdadeiro** — DIVERGE |
 * | `'0.0'` | nao vazio | verdadeiro — igual |
 * | `[]` | vazio | verdadeiro — DIVERGE (nao alcancavel neste caminho) |
 *
 * A linha do `'0'` e a que importa aqui, e ela e alcancavel por qualquer cliente
 * da API: gravar `post_status = '0'` cai no default `draft` no legado
 * (`:4703`), e um porte que escrevesse `pedido.estado ?? 'draft'` gravaria a
 * cadeia `'0'` na coluna. Isso e **efeito no banco** (area 3 da Decisao 2), e e
 * o tipo de divergencia que nenhuma tela mostra.
 *
 * A mesma assimetria vale para o outro lado: `if ( apply_filters( ... ) )`
 * aceita como verdadeiro qualquer valor que o PHP considere verdadeiro, e o
 * interceptador de um filtro pode devolver `1`, `'sim'` ou um objeto. Os dois
 * pontos de filtro que **decidem se a gravacao acontece** —
 * `wp_insert_post_empty_content` (`:4695`) e `wp_checkdate`
 * (`functions.php:7541`) — sao lidos por esta verdade, e nao por `Boolean()`.
 *
 * ── POR QUE NAO REUSAR O GEMEO DE BC-05 ────────────────────────────────────
 *
 * `contextos/identidade-e-acesso/senha-de-aplicacao/emitir-credencial.ts` ja
 * declara `vazioComoNoLegado( texto: string )`, com a mesma regra do `'0'` e a
 * mesma justificativa (P1). **A regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * "sempre, sem excecao"**, logo o reuso teria de descer para `plataforma/` — e
 * `plataforma/` nesta arvore tem dois modulos, autorizacao e serializacao,
 * nenhum deles dono da semantica da linguagem de origem. Quando
 * `plataforma/utilitarios/` existir (regra de dependencia 5: *"funcao pura mora
 * em `utilitarios/`"*), as duas descem juntas e nenhuma chamada muda de
 * resultado. Fica registrado para quem fizer essa pasta.
 *
 * O gemeo de BC-05 aceita **so** texto; este aceita o que o pedido de gravacao
 * pode trazer, porque aqui a mesma pergunta e feita sobre numero
 * (`menu_order`), sobre identificador (`ID`) e sobre texto.
 */

/** O que um campo do pedido de gravacao pode ser, do ponto de vista do vazio. */
export type ValorDoPedido = string | number | undefined;

/**
 * `empty( $valor )` para os valores deste caminho.
 *
 * Ausencia, cadeia vazia, zero e **a cadeia `'0'`** sao vazios. Todo o resto nao
 * e — inclusive `'0.0'`, `' '` e `'false'`, que o PHP tambem considera cheios.
 *
 * O retorno e guarda de tipo para que o ramo "nao vazio" dispense conversao: sem
 * ela, cada um dos doze `empty()` deste caminho precisaria de um `as` para
 * convencer o compilador de que o valor existe — e `as` e exatamente onde um
 * porte esconde a diferenca entre ausencia e vazio.
 */
export function vazioComoNoPhp(
  valor: ValorDoPedido,
): valor is '' | '0' | 0 | undefined {
  return valor === undefined || valor === '' || valor === 0 || valor === '0';
}

/**
 * A verdade de PHP do que um ponto de extensao devolveu.
 *
 * Usada **somente** nos dois filtros que curto-circuitam a gravacao, porque e
 * neles que o legado le o retorno com `if ( ... )` em vez de comparar com
 * `true`. A tabela de divergencia esta no cabecalho deste arquivo; o caso
 * invertido (`'0'` **falso** la, verdadeiro aqui) e o que esta funcao resolve.
 *
 * ⚠️ `0.0`, `'0'` e `[]` sao falsos no PHP. Objeto, por outro lado, e **sempre**
 * verdadeiro la, inclusive um objeto vazio — e e por isso que o `WP_Error` que
 * uma extensao devolva por engano neste ponto conta como *"sim, o corpo esta
 * vazio"*.
 */
export function verdadeiroComoNoPhp(valor: unknown): boolean {
  if (valor === undefined || valor === null || valor === false) {
    return false;
  }
  if (typeof valor === 'number') {
    return valor !== 0;
  }
  if (typeof valor === 'string') {
    return valor !== '' && valor !== '0';
  }
  if (Array.isArray(valor)) {
    return valor.length > 0;
  }
  return valor !== false;
}
