/**
 * Leitura de coluna, com a tolerancia que a borda exige e nenhuma a mais.
 *
 * Entrega de **T002** da feature `008-privacidade-e-dados-pessoais`.
 *
 * O driver pode devolver a mesma coluna como texto, como numero ou como bytes,
 * conforme o tipo e o tamanho. Normalizar isso **na leitura** e diferente de
 * normalizar o dado: o byte gravado continua sendo o que foi gravado, e e sobre
 * ele que o criterio de paridade *"efeito no banco"* (area 3 da Decisao 2 de
 * `parity_specs.md`) se aplica.
 *
 * O que estas funcoes **nao** fazem: validar. `DB-DEG` (BR-MIGRAR-083) manda
 * reproduzir a degradacao do legado — *"escrita invalida nao falha, ela se
 * degrada"* —, logo nenhuma leitura daqui recusa linha por tamanho, formato ou
 * dominio. Uma linha com `post_status = 'publish'` e `post_type =
 * 'user_request'`, que nenhum caminho do legado produz, e lida como qualquer
 * outra: a maquina de estado e validada na aplicacao (`DB-ENUM`), nao na
 * leitura.
 *
 * **Este arquivo repete `armazenamento/leitura-de-linha.ts` de BC-01, BC-03,
 * BC-04 e BC-05, e a repeticao e obrigatoria, nao descuido.** A regra de
 * dependencia 3 de `target_architecture.md` proibe `contextos/<a>/` importar
 * `contextos/<b>/` *"sempre, sem excecao"*, e o tipo de coluna vem da porta de
 * cada contexto. E o mesmo preco que `../portas/porta-de-dados.ts` declara ao
 * redeclarar a porta.
 *
 * A **unica** funcao daqui que nao esta nos contextos irmaos e
 * {@link instanteDaColunaDeData}, e ela existe porque nesta feature o prazo de
 * 24 horas sai de uma coluna `datetime` lida como numero — ver o cabecalho dela.
 */

import type { LinhaDeResultado, ValorDeColuna } from '../portas/index.js';

const DECODIFICADOR = new TextDecoder();

/** Texto de uma coluna. Coluna ausente ou nula vira texto vazio, como no legado. */
export function comoTexto(valor: ValorDeColuna | undefined): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (typeof valor === 'string') {
    return valor;
  }
  if (typeof valor === 'number') {
    return String(valor);
  }
  return DECODIFICADOR.decode(valor);
}

/** Inteiro de uma coluna. Coluna ausente, nula ou ilegivel vira `0`. */
export function comoInteiro(valor: ValorDeColuna | undefined): number {
  if (typeof valor === 'number') {
    return valor;
  }
  const texto = comoTexto(valor);
  if (texto === '') {
    return 0;
  }
  const numero = Number.parseInt(texto, 10);
  return Number.isNaN(numero) ? 0 : numero;
}

/** O valor da coluna como esta, sem interpretacao: o que o codec vai ler. */
export function comoBruto(valor: ValorDeColuna | undefined): ValorDeColuna {
  return valor === undefined ? null : valor;
}

export function primeiraLinha(
  linhas: readonly LinhaDeResultado[],
): LinhaDeResultado | null {
  return linhas.length === 0 ? null : (linhas[0] as LinhaDeResultado);
}

/**
 * O primeiro valor da primeira linha, **pela posicao e nao pelo nome** — o
 * `get_var()` do legado (`wp-includes/class-wpdb.php`).
 *
 * E por posicao porque a consulta que mais o usa nesta familia nao da nome a
 * coluna: `SELECT COUNT(*) FROM $table ...` (`wp-includes/meta.php:97`).
 * Depender do nome obrigaria a trocar a cadeia por `COUNT(*) AS algo`, e a
 * cadeia enviada e o que o slot `persistencia` do plano manda poder ser *"a
 * MESMA string que o legado envia"*.
 */
export function primeiroValor(
  linhas: readonly LinhaDeResultado[],
): ValorDeColuna {
  const linha = primeiraLinha(linhas);
  if (linha === null) {
    return null;
  }
  const valores = Object.values(linha);
  return valores.length === 0 ? null : (valores[0] ?? null);
}

/**
 * Uma coluna `datetime` como instante em **segundos inteiros UTC**, ou `null`
 * quando a cadeia nao e uma data que o legado consiga resolver.
 *
 * E o `strtotime()` que `WP_User_Request` aplica a duas colunas no construtor
 * (`wp-includes/class-wp-user-request.php:115` e `:116`), e e **UTC** porque
 * `wp-settings.php:73` faz `date_default_timezone_set( 'UTC' )` no arranque:
 * a expressao sem fuso e resolvida em UTC, e por isso as duas colunas lidas
 * assim sao as **GMT**, nao as locais.
 *
 * ⚠️ **Esta funcao e metade de uma armadilha, e a outra metade nao e desta
 * tarefa.** O mesmo prazo de 24 horas e medido de duas maneiras diferentes no
 * legado:
 *
 * - **a conferencia da chave (US-2, T005) passa por aqui**: compara `time()`
 *   com `$request->modified_timestamp + 24 h` (`wp-includes/user.php:5113` e
 *   `:5119`), e `modified_timestamp` e esta leitura de `post_modified_gmt`;
 * - **a expiracao agendada (US-4, T009) nao passa por aqui**: monta consulta de
 *   data sobre a coluna **local** `post_modified`, com `'before' => $expires . '
 *   seconds ago'` resolvido no fuso do site, e o comentario do proprio legado
 *   explica por que a coluna local e obrigatoria ali
 *   (`wp-admin/includes/privacy-tools.php:207` a `:214`).
 *
 * As duas medidas coincidem so em instalacao com deslocamento zero. Usar esta
 * funcao na expiracao mudaria o conjunto de solicitacoes que expiram em toda
 * instalacao cujo fuso nao e UTC. A nota completa esta em
 * `../portas/porta-de-relogio.ts`.
 *
 * ⚠️ **`null` aqui e o `false` do PHP, e o legado trata `0` do mesmo jeito.**
 * `strtotime( '0000-00-00 00:00:00' )` devolve `false`, e `wp_validate_user_request_key`
 * decide com `! $key_request_time` (`user.php:5093`) — logo **tanto `false`
 * quanto o instante `0`** (a epoca Unix) caem no mesmo ramo, que devolve
 * `invalid_request`. Esta funcao preserva a distincao entre os dois porque
 * devolver booleano apagaria o instante legitimo; **aplicar a verdade de PHP ao
 * resultado e de T005**, que e quem tem o ramo.
 */
export function instanteDaColunaDeData(
  valor: ValorDeColuna | undefined,
): number | null {
  const texto = comoTexto(valor).trim();
  const partes =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(texto);
  if (partes === null) {
    return null;
  }

  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const hora = Number(partes[4]);
  const minuto = Number(partes[5]);
  const segundo = Number(partes[6]);

  // A sentinela de data, e qualquer cadeia com componente zerado, e o que
  // `strtotime()` recusa: mes `00` e dia `00` nao existem no calendario.
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return null;
  }

  // `setUTCFullYear` em vez de `Date.UTC`: aquele mapeia ano de 0 a 99 para
  // 1900+ano, e a coluna `datetime` aceita ano de dois digitos.
  const data = new Date(0);
  data.setUTCFullYear(ano, mes - 1, dia);
  data.setUTCHours(hora, minuto, segundo, 0);

  const instante = data.getTime();
  if (Number.isNaN(instante)) {
    return null;
  }

  // O calendario normaliza o que ele nao tem (31 de fevereiro vira 2 ou 3 de
  // marco), e `strtotime()` faz a mesma normalizacao: a coincidencia e da
  // origem, nao conveniencia.
  return Math.floor(instante / 1000);
}
