/**
 * `locate_template()` (`wp-includes/template.php:784-819`) e
 * `_wp_is_template_path_allowed()` (`:713-760`) — a parte da escolha de
 * apresentacao que pergunta ao tema **qual dos candidatos existe**.
 *
 * Entrega de **T005** (US-2, CA-2.1 e CA-2.4).
 *
 * ---
 *
 * ## A regra em uma frase, e a frase e do legado
 *
 * *"Searches in the stylesheet directory before the template directory and
 * wp-includes/theme-compat so that themes which inherit from a parent theme can
 * just overload one file"* (`:765-767`). Sao tres diretorios, nesta ordem, para
 * **cada** candidato — e o primeiro candidato que exista em qualquer um deles
 * vence.
 *
 * ⚠️ **O laco e por candidato, nao por diretorio.** Isso decide quem ganha
 * quando um tema filho tem `single.php` e o pai tem `single-post.php`: o
 * candidato mais especifico, `single-post.php`, e consultado primeiro e e
 * encontrado **no pai**, logo o pai vence o filho. Trocar a ordem dos dois lacos
 * — procurar tudo no filho antes de olhar o pai — e o erro de porte obvio aqui,
 * e inverte a hierarquia inteira.
 *
 * ## Duas saidas que parecem iguais e nao sao
 *
 * | caso | legado | o que acontece |
 * |---|---|---|
 * | o candidato nao existe em diretorio nenhum | `else { continue; }` (`:804-806`) | passa ao candidato **seguinte** |
 * | o candidato existe e o caminho nao e permitido | `if ( _wp_is_template_path_allowed(...) )` sem `else` (`:808-811`) | passa ao candidato **seguinte**, e **nao** tenta o mesmo nome no diretorio seguinte |
 *
 * A segunda e a que um porte "limpo" quebra, porque a leitura natural seria
 * tentar o proximo diretorio. O legado ja escolheu o diretorio quando chega no
 * teste de permissao: a recusa descarta o candidato inteiro.
 *
 * ## ⚠️ Candidato falso e saltado, e `'0'` e falso
 *
 * `if ( ! $template_name ) { continue; }` (`:795-797`): texto vazio **e** o
 * texto `'0'` sao saltados, porque os dois sao falsos no interpretador. Um
 * modelo chamado `0` — que o ponto de extensao `{$type}_template_hierarchy` pode
 * acrescentar — nunca e localizado.
 */

import { vazioComoNoPhp } from '../consulta/semantica-de-php.js';
import { comBarraNoFim, normalizarCaminho } from './caminho-de-modelo.js';
import { temaFilho, type TemaAtivo } from './tema-ativo.js';

/** O segmento `..` de um caminho, como `:717` o procura. */
const SEGMENTO_ACIMA = /(?:^|\/)\.\.[. ]*(?:\/|$)/;

/**
 * `_wp_is_template_path_allowed( $caminho )` (`wp-includes/template.php:713-760`).
 *
 * Nova na versao 7.1.2 do legado — *"A template name containing `..` is only
 * located if it resolves inside the theme"* (`:771`) —, e tem dois caminhos:
 *
 * 1. **o rapido**, e e o de todo candidato que a hierarquia do nucleo monta: o
 *    caminho normalizado nao tem segmento `..`, e esta permitido (`:717-719`);
 * 2. **o lento**, para caminho com `..`: resolve o caminho verdadeiro e exige
 *    que ele caia dentro de um dos diretorios permitidos.
 *
 * Os diretorios permitidos sao tres, mais dois condicionais:
 * folha de estilo, modelo e compatibilidade (`:730-734`), mais o **pai** de cada
 * um dos dois primeiros quando o nome do tema correspondente contem `/`, isto e
 * quando o tema esta num subdiretorio (`:736-744`).
 *
 * ⚠️ Sem `realpath`, o legado recusa (`:724-726`), e a ausencia do colaborador
 * aqui faz o mesmo. Fechar para o lado permissivo abriria o caminho que esta
 * funcao existe para fechar.
 */
export function caminhoDeModeloPermitido(
  caminho: string,
  tema: TemaAtivo,
): boolean {
  if (!SEGMENTO_ACIMA.test(normalizarCaminho(caminho))) {
    return true;
  }

  const resolver = tema.caminhoReal;
  if (resolver === undefined) {
    return false;
  }

  const real = resolver(caminho);
  if (real === undefined) {
    return false;
  }
  const caminhoReal = comBarraNoFim(normalizarCaminho(real));

  const diretorios = [
    tema.diretorioDaFolhaDeEstilo,
    tema.diretorioDoModelo,
    tema.diretorioDeCompatibilidade,
  ];
  if (tema.folhaDeEstilo.includes('/')) {
    diretorios.push(diretorioPai(tema.diretorioDaFolhaDeEstilo));
  }
  if (tema.modelo.includes('/')) {
    diretorios.push(diretorioPai(tema.diretorioDoModelo));
  }

  for (const diretorio of diretorios) {
    const diretorioReal = resolver(diretorio);
    if (diretorioReal === undefined) {
      continue;
    }
    if (caminhoReal.startsWith(comBarraNoFim(normalizarCaminho(diretorioReal)))) {
      return true;
    }
  }

  return false;
}

/**
 * `dirname( $caminho )` restrito ao que `:738` e `:743` pedem.
 *
 * O legado chama a funcao do interpretador sobre um caminho de diretorio ja
 * normalizado. Caminho sem barra devolve `.`, que e o que `dirname` faz, e esse
 * `.` depois nao resolve para dentro de nada.
 */
function diretorioPai(caminho: string): string {
  const normalizado = normalizarCaminho(caminho);
  const corte = normalizado.replace(/\/+$/, '').lastIndexOf('/');
  if (corte < 0) {
    return '.';
  }
  if (corte === 0) {
    return '/';
  }
  return normalizado.slice(0, corte);
}

/**
 * `locate_template( $candidatos )` (`wp-includes/template.php:784-819`).
 *
 * Devolve o caminho do primeiro candidato localizado, ou **texto vazio** quando
 * nenhum deles existe — o `$located = ''` de `:793`, que e o valor que o laco de
 * `template-loader.php` trata como falso e com o qual segue para a regra
 * seguinte.
 *
 * O parametro `$load` do legado nao esta aqui: carregar o modelo e a etapa
 * seguinte, e as duas chamadas desta feature passam `false` (`:64`). O
 * `load_template()` que ele dispararia (`:848`) e da feature 009 — ver
 * `./escolher-apresentacao.ts`.
 */
export function localizarModelo(
  candidatos: readonly string[],
  tema: TemaAtivo,
): string {
  const ehTemaFilho = temaFilho(tema);

  for (const candidato of candidatos) {
    if (vazioComoNoPhp(candidato)) {
      continue;
    }

    let escolhido: string | undefined;
    const naFolhaDeEstilo = `${tema.diretorioDaFolhaDeEstilo}/${candidato}`;
    const noModelo = `${tema.diretorioDoModelo}/${candidato}`;
    const naCompatibilidade = `${tema.diretorioDeCompatibilidade}/${candidato}`;

    if (tema.arquivoExiste(naFolhaDeEstilo)) {
      escolhido = naFolhaDeEstilo;
    } else if (ehTemaFilho && tema.arquivoExiste(noModelo)) {
      escolhido = noModelo;
    } else if (tema.arquivoExiste(naCompatibilidade)) {
      escolhido = naCompatibilidade;
    } else {
      continue;
    }

    if (caminhoDeModeloPermitido(escolhido, tema)) {
      return escolhido;
    }
  }

  return '';
}
