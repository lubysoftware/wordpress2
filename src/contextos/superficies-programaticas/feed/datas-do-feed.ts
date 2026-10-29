/**
 * As datas que o feed escreve: a de cada item, a de construcao do canal e a do
 * cabecalho `Last-Modified`.
 *
 * Tarefa **T017** da feature `013-superficies-programaticas` (US-8). Tres
 * caminhos do legado, e os tres escrevem **o relogio da coluna, sem converter**:
 *
 * | onde | chamada | ancora |
 * |---|---|---|
 * | data de cada item | `mysql2date( $formato, $coluna_gmt, false )` | `wp-includes/feed-rss2.php:96`, `feed-rdf.php:79`, `feed-atom-comments.php:106` |
 * | data de construcao | `date_create_immutable_from_format( 'Y-m-d H:i:s', max( ... ), UTC )->format()` | `wp-includes/feed.php:715`-`:756` |
 * | `Last-Modified` | `mysql2date( 'D, d M Y H:i:s', get_lastpostmodified( 'GMT' ), false )` | `wp-includes/class-wp.php:491`-`:502` |
 *
 * `mysql2date()` com `$translate` falso (`wp-includes/functions.php:35`) cria a
 * data **no fuso do site** e a formata sem traduzir — logo o relogio da coluna
 * sai como esta, e os formatos do feed nao tem letra de fuso (o `+0000` e o `Z`
 * sao literais). Por isso nao ha fuso neste arquivo: com `America/Sao_Paulo` o
 * feed continua escrevendo a coluna `_gmt` com `+0000`, que e o que o legado faz.
 *
 * So as letras que os modelos usam estao aqui — `D`, `d`, `M`, `m`, `Y`, `H`,
 * `i`, `s`, `r` e a barra de escape —, sempre em ingles (`$translate` falso). Letra
 * fora disso e erro de quem chamou, e nao formato a adivinhar.
 */

const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MESES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** `D, d M Y H:i:s +0000` — `pubDate` e `lastBuildDate` do RSS (`feed-rss2.php:96`). */
export const FORMATO_DE_DATA_RSS = 'D, d M Y H:i:s +0000';

/** `Y-m-d\TH:i:s\Z` — Atom e RDF (`feed-atom.php:37`, `feed-rdf.php:36`). */
export const FORMATO_DE_DATA_ATOM = 'Y-m-d\\TH:i:s\\Z';

/** `D, d M Y H:i:s` — o `$date_format` de `send_headers()` (`class-wp.php:441`). */
export const FORMATO_DE_DATA_DO_CABECALHO = 'D, d M Y H:i:s';

/** A coluna de data vazia do armazenamento. */
export const DATA_ZERADA = '0000-00-00 00:00:00';

function doisDigitos(numero: number): string {
  return String(numero).padStart(2, '0');
}

/** A letra `Y`: quatro digitos no minimo, e o sinal antes deles (`-0001`). */
function anoComoNoPhp(ano: number): string {
  const digitos = String(Math.abs(ano)).padStart(4, '0');
  return ano < 0 ? `-${digitos}` : digitos;
}

/**
 * Le `Y-m-d H:i:s` como relogio UTC, ou `null` quando o texto nao tem essa
 * forma. `date_create_immutable_from_format()` falha nesse caso (`feed.php:740`).
 */
export function lerDataDaColuna(coluna: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(coluna);
  if (partes === null) {
    return null;
  }
  const [, ano, mes, dia, hora, minuto, segundo] = partes.map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  // `setUTCFullYear` aceita ano abaixo de 100 sem o desvio de `Date.UTC`, e
  // normaliza como o PHP: a coluna zerada vira `-0001-11-30 00:00:00`.
  const data = new Date(0);
  data.setUTCFullYear(ano, mes - 1, dia);
  data.setUTCHours(hora, minuto, segundo, 0);
  return data;
}

/** `DateTime::format()` com as letras que o feed usa, sobre um relogio UTC. */
export function formatarRelogio(data: Date, formato: string): string {
  let saida = '';
  for (let i = 0; i < formato.length; i++) {
    const letra = formato[i] as string;
    switch (letra) {
      case '\\':
        i++;
        saida += formato[i] ?? '';
        break;
      case 'D':
        saida += DIAS[data.getUTCDay()];
        break;
      case 'd':
        saida += doisDigitos(data.getUTCDate());
        break;
      case 'M':
        saida += MESES[data.getUTCMonth()];
        break;
      case 'm':
        saida += doisDigitos(data.getUTCMonth() + 1);
        break;
      case 'Y':
        saida += anoComoNoPhp(data.getUTCFullYear());
        break;
      case 'H':
        saida += doisDigitos(data.getUTCHours());
        break;
      case 'i':
        saida += doisDigitos(data.getUTCMinutes());
        break;
      case 's':
        saida += doisDigitos(data.getUTCSeconds());
        break;
      case 'r':
        saida += formatarRelogio(data, 'D, d M Y H:i:s +0000');
        break;
      default:
        if (/[a-zA-Z]/.test(letra)) {
          throw new Error(`letra de formato de data nao portada: ${letra}`);
        }
        saida += letra;
    }
  }
  return saida;
}

/**
 * `mysql2date( $formato, $coluna, false )` sobre uma coluna de data: o texto,
 * ou `''` quando a coluna e vazia ou ilegivel (`false` ecoado e texto vazio).
 */
export function formatarDataDaColuna(coluna: string, formato: string): string {
  const data = lerDataDaColuna(coluna);
  return data === null ? '' : formatarRelogio(data, formato);
}

/**
 * `get_post_time( $formato, true )` / `get_post_modified_time()` — como
 * {@link formatarDataDaColuna}, mas a coluna zerada e `false`
 * (`get_post_datetime()`, `wp-includes/general-template.php`), e o modelo ecoa
 * texto vazio.
 */
export function formatarDataDoConteudo(coluna: string, formato: string): string {
  return coluna === DATA_ZERADA ? '' : formatarDataDaColuna(coluna, formato);
}
