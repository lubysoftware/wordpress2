/**
 * A comparacao que decide se vale a pena guardar versao — o laco de
 * `wp_save_post_revision()` (`wp-includes/revision.php:189`-`:196`), e a
 * normalizacao que ele aplica antes de comparar.
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10).
 *
 * ```php
 * foreach ( array_keys( _wp_post_revision_fields( $post ) ) as $field ) {
 *     if ( normalize_whitespace( maybe_serialize( $post->$field ) )
 *       !== normalize_whitespace( maybe_serialize( $latest_revision->$field ) ) ) {
 *         $post_has_changed = true;
 *         break;
 *     }
 * }
 * ```
 *
 * ---
 *
 * # Por que a normalizacao e regra de negocio, e nao higiene
 *
 * **Mexer so no espaco em branco de um texto NAO cria versao.** Trocar dois
 * espacos por um, acrescentar linha em branco, mudar a quebra de linha de
 * Windows para Unix, aparar o fim do paragrafo — nada disso produz versao nova,
 * porque `normalize_whitespace()` apaga a diferenca **antes** da comparacao. O
 * texto gravado, esse, muda: a normalizacao decide, e nunca grava.
 *
 * Esse e o comportamento observavel que um porte perde ao comparar as cadeias
 * direto, e ele e observavel das duas pontas: com a comparacao crua, salvar o
 * mesmo texto reformatado criaria versao que o legado nao cria — e a poda de
 * CA-10.2 passaria a descartar versoes de verdade mais cedo.
 *
 * `normalize_whitespace()` sao quatro operacoes, na ordem
 * (`wp-includes/formatting.php:5580`-`:5585`):
 *
 * | # | operacao | detalhe que decide |
 * |---|---|---|
 * | 1 | `trim()` | os seis bytes do default do PHP, e `\f` **nao** esta entre eles |
 * | 2 | `str_replace( "\r", "\n" )` | `\r\n` vira `\n\n`, que o passo 3 colapsa |
 * | 3 | `/\n+/` → `\n` | **antes** do passo 4, e a ordem importa |
 * | 4 | `/[ \t]+/` → ` ` | so espaco e tabulacao; `\n` ja foi colapsado |
 *
 * ⚠️ **O `trim()` do PHP apara `\0` e `\x0B` e NAO apara `\f`.** A lista default
 * e `" \t\n\r\0\x0B"`. Usar o `String.prototype.trim()` do JavaScript aqui — que
 * apara `\f`, o espaco de largura zero, o espaco ininterrupto e mais duas dezenas
 * de caracteres Unicode — mudaria a resposta para todo texto que termine em um
 * deles, e textos colados de editor de texto terminam em um deles com
 * frequencia. {@link aparar} reproduz os seis bytes, e so eles.
 *
 * ---
 *
 * # O `maybe_serialize` no meio, que parece inutil e nao e
 *
 * As tres colunas versionaveis sao texto, logo `maybe_serialize()` deveria ser
 * identidade — e e, **salvo** quando o texto gravado **parece serializado**,
 * caso em que o legado o serializa de novo (a dupla serializacao de
 * `BR-MIGRAR-082`, afirmada em `../armazenamento/metadado.ts`).
 *
 * E ai ele deixa de ser inutil: `s:5:"a  b";` serializado carrega o
 * **comprimento em bytes** do texto, e o comprimento sobrevive a normalizacao de
 * espaco. Dois corpos que diferissem **so** no espaco em branco seriam
 * considerados iguais se fossem texto comum, e **diferentes** se parecessem
 * serializados, porque `s:5:` e `s:4:` nao se colapsam. Nao e um caso teorico
 * para um CMS que guarda corpo de bloco: e o que acontece com qualquer conteudo
 * que comece por `a:`, `s:` ou `O:` seguido de numero e dois-pontos.
 *
 * Aplicar os dois na ordem do legado — serializar e **depois** normalizar — e o
 * que reproduz as duas respostas.
 */

import {
  pareceSerializado,
  serializarComoTexto,
  texto,
} from '../../../plataforma/serializacao/index.js';
import { campoDaColuna, type Conteudo } from '../armazenamento/index.js';
import { camposVersionaveis } from './campos-da-versao.js';
import type { ContextoDeVersao } from './contexto-de-versao.js';

/**
 * Os seis bytes que o `trim()` do PHP apara por default: espaco, tabulacao,
 * nova linha, retorno de carro, byte nulo e tabulacao vertical.
 *
 * `\f` (`0x0C`) **nao** esta na lista, e o `String.prototype.trim()` do
 * JavaScript o apararia. Ver a nota do cabecalho.
 */
const BYTES_APARADOS_PELO_PHP = ' \t\n\r\0\v';

/** O `trim()` do PHP com a lista default — os seis bytes, nas duas pontas. */
export function aparar(valor: string): string {
  let inicio = 0;
  let fim = valor.length;
  while (inicio < fim && BYTES_APARADOS_PELO_PHP.includes(valor[inicio] as string)) {
    inicio += 1;
  }
  while (fim > inicio && BYTES_APARADOS_PELO_PHP.includes(valor[fim - 1] as string)) {
    fim -= 1;
  }
  return valor.slice(inicio, fim);
}

/**
 * `normalize_whitespace( $str )` — as quatro operacoes, na ordem
 * (`wp-includes/formatting.php:5580`-`:5585`).
 *
 * A ordem entre o passo 3 e o 4 e a razao de a funcao nao ser um
 * `replace(/\s+/g, ' ')`: o legado **preserva a quebra de linha unica** e
 * colapsa so o resto. Dois paragrafos continuam dois paragrafos depois desta
 * funcao, e e por isso que trocar paragrafo por espaco **conta** como mudanca.
 */
export function normalizarEspacoEmBranco(valor: string): string {
  return aparar(valor)
    .replace(/\r/g, '\n')
    .replace(/\n+/g, '\n')
    .replace(/[ \t]+/g, ' ');
}

/**
 * `maybe_serialize()` aplicado a um valor de coluna de `posts`
 * (`wp-includes/functions.php:628`).
 *
 * Aceita `string` e `number` porque sao os dois tipos que uma coluna versionavel
 * de `posts` produz: as tres de fabrica sao texto, e a unica coluna numerica que
 * um interceptador consegue acrescentar a lista e `menu_order` — as outras duas
 * (`post_author` e `post_parent`) estao entre os nove nomes protegidos. O numero
 * vira cadeia decimal, que e o que o `trim()` do PHP faria com um inteiro.
 *
 * A pergunta e feita no modo **nao estrito**, como na origem.
 */
export function talvezSerializarValor(valor: string | number): string {
  const comoTexto = typeof valor === 'number' ? String(valor) : valor;
  return pareceSerializado(comoTexto, false)
    ? serializarComoTexto(texto(comoTexto))
    : comoTexto;
}

/** A forma em que os dois lados sao comparados: serializar e depois normalizar. */
export function formaComparavel(valor: string | number): string {
  return normalizarEspacoEmBranco(talvezSerializarValor(valor));
}

/**
 * O laco de comparacao de `wp_save_post_revision()`
 * (`wp-includes/revision.php:189`-`:196`): se algum campo versionavel mudou.
 *
 * ⚠️ **O `break` no primeiro campo diferente e observavel pela sequencia de
 * comandos**, e nao so por desempenho: no legado, o laco chama
 * `_wp_post_revision_fields( $post )` uma vez e depois le propriedades de objeto
 * em memoria, logo o `break` nao economiza consulta nenhuma **neste** laco. Ele
 * fica reproduzido porque a comparacao tem um ponto de extensao de campos que um
 * interceptador pode tornar caro, e porque parar no primeiro e o que o legado
 * faz.
 *
 * ⚠️ **Campo que nao e coluna gravavel compara igual, e nao e erro.** O laco do
 * legado le `$post->$field` direto, **sem** o `array_intersect` que
 * `_wp_post_revision_data()` usa: um interceptador que declare
 * `campo_inventado` faz o PHP 8 avisar de propriedade indefinida e comparar
 * `null` com `null` — iguais. O `continue` aqui produz o mesmo resultado
 * observavel, e e por isso que ele nao marca mudanca.
 *
 * Nao aplica nenhum dos dois pontos de extensao da decisao — eles sao
 * `mudouDesdeAUltimaVersao()`, em `guardar-versao.ts`, porque e la que a ordem
 * entre o ouvinte do nucleo e o interceptador de terceiro e cumprida.
 */
export function conteudoMudou(
  contexto: ContextoDeVersao,
  conteudo: Conteudo,
  ultimaVersao: Conteudo,
): boolean {
  for (const { coluna } of camposVersionaveis(contexto, conteudo)) {
    const campo = campoDaColuna(coluna);
    if (campo === null) {
      continue;
    }
    const aqui = conteudo[campo];
    const la = ultimaVersao[campo];
    if (typeof aqui === 'object' || typeof la === 'object') {
      // `vinculo` e o unico campo de forma composta, e ele e `post_parent` — um
      // dos nove nomes protegidos, logo inalcancavel por este laco. O ramo
      // existe para que a exaustividade seja do compilador e nao de um comentario.
      continue;
    }
    if (formaComparavel(aqui) !== formaComparavel(la)) {
      return true;
    }
  }
  return false;
}
