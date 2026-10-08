/**
 * `strtotime()` sobre o texto de uma coluna `datetime`, como as **quatro**
 * comparacoes de data do agendamento do legado o usam.
 *
 * Entrega de **T013** da feature `002-autoria-e-publicacao` (US-6). E a peca
 * mais chata desta tarefa, e e ela que decide o resultado de CA-6.1 a CA-6.4,
 * porque as quatro comparacoes sao **aritmetica sobre o retorno desta funcao**:
 *
 * | onde | chamada do legado | linha |
 * |---|---|---|
 * | a conversao para agendado | `strtotime( $post_date_gmt ) - strtotime( $now )` | `wp-includes/post.php:4801` |
 * | a conversao de volta para publicado | a mesma expressao, com `<` | `:4805` |
 * | a verificacao dupla | `strtotime( $post->post_date_gmt . ' GMT' )` | `:5493` |
 * | o agendamento do evento | `strtotime( get_gmt_from_date( $post->post_date ) . ' GMT' )` | `:8207` |
 *
 * ── POR QUE AS DUAS FORMAS SAO A MESMA LEITURA ─────────────────────────────
 *
 * Duas das quatro passam a cadeia **crua** e duas acrescentam `' GMT'`, e isso
 * parece ser diferenca de fuso. **Nao e, nesta arvore:** `wp-settings.php:73`
 * executa `date_default_timezone_set( 'UTC' )` antes de qualquer coisa, logo o
 * `strtotime()` de uma cadeia sem fuso ja interpreta em UTC e o sufixo `' GMT'`
 * nao muda o resultado. As duas formas colapsam numa so leitura, e e por isso
 * que esta funcao tem um parametro so.
 *
 * ⚠️ **Isso vale porque o legado fixa o fuso do processo, e nao porque "data e
 * UTC".** Quem portar o caminho de gravacao (`current_time( 'mysql' )`, que e
 * hora **local** do site) nao pode usar esta funcao para aquela coluna: ali a
 * conversao e `get_gmt_from_date()`, que le a opcao de fuso e chega ao
 * agendamento como `DataGmtDeDataLocal`, em
 * `../publicacao/contexto-de-publicacao.ts`.
 *
 * ── O `false` DO PHP, QUE E UM ZERO DISFARCADO ─────────────────────────────
 *
 * `strtotime()` devolve `false` quando nao consegue ler a cadeia, e os
 * consumidores do legado **nao testam isso**. O que cada um faz com o `false` e
 * comportamento observavel, e o caminho e diferente nos dois:
 *
 * - em `:4801` o `false` entra numa **subtracao**: `false - $agora` e
 *   `0 - $agora`, isto e, um numero muito negativo. Logo `publish` continua
 *   `publish` e `future` **vira `publish`**;
 * - em `:5493` o `false` entra numa **comparacao com inteiro**: `false > time()`
 *   converte o inteiro para booleano (`true`), e `false > true` e falso. Logo o
 *   ramo de reagendamento nao e tomado e a verificacao dupla **publica**.
 *
 * Os dois chegam ao mesmo lugar — publicar — e e por isso que `null` neste
 * modulo e tratado como `0` nos dois pontos, com a nota em cada um. A
 * consequencia e real e esta testada: um conteudo em `future` cuja data e a
 * sentinela `'0000-00-00 00:00:00'` e publicado pela fila no primeiro disparo,
 * porque `strtotime()` recusa mes e dia zero.
 *
 * ── O QUE ESTA FUNCAO NAO E ────────────────────────────────────────────────
 *
 * Nao e um porte de `strtotime()`: aquela funcao le dezenas de formatos
 * relativos (`+1 day`, `next monday`) e nada do agendamento depende disso. O
 * que chega aqui e sempre o conteudo de uma coluna `datetime`, no formato
 * `Y-m-d H:i:s` que `wp_resolve_post_date()` garante (`:5520`), ou a sentinela.
 * Formato fora disso devolve `null`, que e o `false` do legado — e e o mesmo
 * desfecho que o legado da a qualquer cadeia que ele nao leia.
 *
 * E **nao mora em `utilitarios/`**, que e onde a regra de dependencia 5 poria
 * uma funcao pura: aquela camada nao existe nesta arvore e nenhuma tarefa deste
 * pacote a cria (`target_architecture.md` a descreve com 6 modulos puros, e
 * nenhum deles e data). Fica aqui, ao lado do unico consumidor, com a nota para
 * quem levantar a camada.
 */

/**
 * A forma que o formato `Y-m-d H:i:s` tem na coluna.
 *
 * Ancorada nas duas pontas de proposito: `strtotime()` recusa cadeia com sobra,
 * e o que o legado grava nas quatro colunas `datetime` de `posts` tem
 * exatamente este tamanho.
 */
const FORMA_DA_DATA_DO_BANCO =
  /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

/**
 * O instante de uma data do banco, em segundos inteiros UTC — a unidade da
 * porta de relogio.
 *
 * `null` e o `false` do `strtotime()` do legado. Ver o cabecalho deste arquivo
 * para o que cada consumidor faz com ele, que **nao** e tratar como erro.
 */
export function instanteDaDataDoBanco(texto: string): number | null {
  const partes = FORMA_DA_DATA_DO_BANCO.exec(texto);
  if (partes === null) {
    return null;
  }

  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const hora = Number(partes[4]);
  const minuto = Number(partes[5]);
  const segundo = Number(partes[6]);

  // `strtotime()` recusa mes ou dia zero, e e por isso que a sentinela
  // `'0000-00-00 00:00:00'` devolve `false` no legado. O resto da faixa ele
  // **acomoda**, rolando para o mes seguinte (dia 30 de fevereiro vira 2 de
  // marco), que e o mesmo que `Date` faz — e por isso nao ha validacao de
  // calendario aqui: inventa-la recusaria data que o legado aceita.
  if (mes < 1 || mes > 12 || dia < 1) {
    return null;
  }

  // `setUTCFullYear` e nao `Date.UTC`: aquele mapeia ano de dois digitos para o
  // seculo XX (`Date.UTC( 99, 0, 1 )` e 1999), e a coluna tem quatro digitos
  // que valem ao pe da letra.
  const data = new Date(0);
  data.setUTCFullYear(ano, mes - 1, dia);
  data.setUTCHours(hora, minuto, segundo, 0);

  return Math.floor(data.getTime() / 1000);
}

/**
 * O mesmo instante com o `false` do PHP ja coagido para `0`, que e como as
 * aritmeticas do legado o veem.
 *
 * Existe como funcao nomeada, e nao como `?? 0` espalhado, para que a coercao
 * seja um lugar so e para que o teste possa afirma-la: ela e a razao de um
 * conteudo agendado com data sentinela ser publicado em vez de reagendado.
 */
export function instanteDaDataDoBancoOuZero(texto: string): number {
  return instanteDaDataDoBanco(texto) ?? 0;
}
