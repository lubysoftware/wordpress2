/**
 * O metadado versionado — os **tres ouvintes de fabrica** que o nucleo registra
 * nos pontos desta pasta, e a lista de chaves que eles percorrem
 * (`wp-includes/revision.php:572`-`:618`, `:395`-`:410`, `:518`-`:540`).
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10).
 *
 * ---
 *
 * # Por que isto esta aqui, e nao declarado e deixado para outro
 *
 * Desde a 6.4.0 a versao nao guarda so tres colunas: ela guarda tambem o
 * **metadado declarado com `revisions_enabled`**. Sao tres ouvintes, cada um
 * pendurado em um ponto que esta pasta emite, e cada um muda o que CA-10.1 e
 * CA-10.4 produzem:
 *
 * | prioridade | ouvinte | ponto | o que faz |
 * |---|---|---|---|
 * | 10 | `wp_save_revisioned_meta_fields` | `_wp_put_post_revision` | copia o metadado do conteudo para a versao |
 * | 10 | `wp_restore_post_revision_meta` | `wp_restore_post_revision` | **apaga** o do conteudo e recopia o da versao |
 * | 10 | `wp_check_revisioned_meta_fields_have_changed` | `wp_save_post_revision_post_has_changed` | faz metadado mudado **gravar versao nova** |
 *
 * **E nao e ramo vazio numa instalacao de fabrica.** O nucleo registra uma chave
 * com `revisions_enabled => true`: `footnotes`, para todo tipo de conteudo que
 * declare suporte a `editor`, a `custom-fields` e a `revisions`
 * (`wp-includes/blocks/footnotes.php:90`-`:104`) — o que inclui `post` e `page`.
 * Declarar os tres ouvintes e nao os implementar deixaria o alvo divergindo do
 * legado **na instalacao de fabrica**, no caso mais comum que existe: editar um
 * post.
 *
 * O que **nao** esta aqui, porque nao existe nesta arvore, e o **registro** de
 * metadado: `get_registered_meta_keys()` e `register_meta()` sao de
 * `plataforma/`, e nem o registro de blocos (que declara `footnotes`) nem o de
 * tipos de conteudo (que decide quem tem os tres suportes) foram portados —
 * REQ-032, o formato do corpo em blocos, esta **fora do pacote**
 * (`do-not-rewrite.md`). Logo a lista de chaves chega por
 * {@link ContextoDeVersao.metadadosVersionados}, de ligacao tardia, e **omitida
 * ela e vazia** — que e exatamente o comportamento do legado para um tipo sem
 * metadado versionado declarado, porque o default de `register_meta()` e
 * `'revisions_enabled' => false` (`wp-includes/meta.php:1452`).
 *
 * ---
 *
 * # As tres armadilhas deste arquivo
 *
 * 1. **Guardar confere se existe; restaurar NAO.** `wp_save_revisioned_meta_fields()`
 *    so copia a chave que `metadata_exists()` encontra no conteudo (`:607`), e
 *    `wp_restore_post_revision_meta()` **apaga a chave do conteudo sem conferir
 *    nada** e so depois tenta copiar da versao (`:534`-`:538`). O efeito e
 *    observavel e assimetrico: restaurar uma versao que **nao** tem a chave
 *    **apaga** a chave do conteudo. Um porte que pusesse a mesma guarda nos dois
 *    lados preservaria um metadado que o legado descarta.
 * 2. **A comparacao de mudanca so sabe dizer "sim".**
 *    `wp_check_revisioned_meta_fields_have_changed()` recebe o resultado da
 *    comparacao dos tres campos e **nunca** o volta para falso: ela acrescenta
 *    uma razao, nao substitui a resposta (`:613`-`:618`). Escrever
 *    `$post_has_changed = ( ... )` em vez de `if ( ... ) { ... = true; }`
 *    desfaria a deteccao de mudanca de texto quando o metadado nao mudou.
 * 3. **A copia nao e "mover": e `add_metadata` por valor, sem `unique`.**
 *    `_wp_copy_post_meta()` percorre **todos** os valores da chave e acrescenta
 *    um a um (`:555`-`:563`), com o comentario do legado explicando por que nao
 *    usa `add_post_meta` — *"to allow for a revision post target OR regular
 *    post"*. Chave repetida continua repetida na versao, e na mesma ordem de
 *    `meta_id`, que e a ordem que {@link RepositorioDeMetadadosDeConteudo.listar}
 *    garante.
 *
 * ---
 *
 * # A divergencia de comparacao, declarada
 *
 * O legado compara `get_post_meta( $post->ID, $key ) !== get_post_meta(
 * $revision->ID, $key )` — dois arranjos de valores **ja desserializados**, com
 * `!==`, que em PHP compara contagem, ordem, chave, tipo e valor. Aqui a
 * comparacao e feita sobre o valor **reserializado** pelo codec de
 * `plataforma/serializacao/`, que e canonico e conformado byte a byte
 * (`conformidade.test.ts`): dois valores sao identicos no legado se, e somente
 * se, a serializacao deles coincide.
 *
 * A diferenca cabe em uma linha e e de borda: dois valores gravados que
 * **parecam** serializados e nao se leiam produzem, no legado, `false` dos dois
 * lados — logo *"iguais"* —, e aqui produzem `b:0;` dos dois lados, tambem
 * iguais. Os dois caminhos coincidem porque a reserializacao e aplicada **depois**
 * de `talvezDesserializar()`, que e a funcao que devolve esse `false`
 * (`talvez-serializar.ts`). Comparar os **bytes crus** da coluna, em vez disto,
 * e o que divergiria. Fica registrado porque e a escolha que um porte faria por
 * economia.
 */

import {
  serializarComoTexto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  valorDeMetadado,
  type Conteudo,
  type RepositorioDeMetadadosDeConteudo,
} from '../armazenamento/index.js';
import type { ValorDeColuna } from '../portas/index.js';
import type { ContextoDeVersao } from './contexto-de-versao.js';

/**
 * `wp_post_revision_meta_keys( $post_type )` — as chaves de metadado que se
 * versionam, naquele tipo (`wp-includes/revision.php:572`-`:598`).
 *
 * Os dois passos sao a consulta ao registro e o ponto de extensao
 * `wp_post_revision_meta_keys` (`:598`). A deduplicacao do legado — o
 * `$chaves[$nome] = true` seguido de `array_keys()` (`:583`-`:586`) — existe
 * porque o `array_merge` junta o registro **global** de `post` com o registro do
 * **subtipo**, e a mesma chave pode estar nos dois; esta funcao a reproduz
 * porque quem implementar {@link ContextoDeVersao.metadadosVersionados} vai
 * fazer o mesmo `merge`.
 */
export function chavesDeMetadadoVersionado(
  contexto: ContextoDeVersao,
  tipo: string,
): readonly string[] {
  const doRegistro = contexto.metadadosVersionados?.(tipo) ?? [];
  const unicas = [...new Set(doRegistro)];
  return contexto.ganchos?.filtrarChavesDeMetadadoVersionado?.(unicas, tipo) ?? unicas;
}

/**
 * `_wp_copy_post_meta( $origem, $destino, $chave )`
 * (`wp-includes/revision.php:555`-`:563`).
 *
 * Um `add_metadata` por valor, **sem `unique`** — logo sempre insere, inclusive
 * quando o destino ja tem a chave. Devolve quantos valores foram copiados, para
 * que o efeito seja afirmavel por teste; **o legado ignora o retorno de cada
 * `add_metadata()`**, e nenhum ramo deste arquivo o consulta (P7).
 *
 * O `wp_slash( $meta_value )` do legado nao viaja: escapar e da camada de dados,
 * e a porta parametrizada deste modulo nao concatena cadeia nenhuma (REQ-164).
 * O par `maybe_unserialize` na leitura e `maybe_serialize` na escrita, sim,
 * viaja — e e ele que carrega a dupla serializacao de BR-MIGRAR-082, afirmada em
 * `../armazenamento/metadado.ts`.
 */
export function copiarMetadado(
  metadados: RepositorioDeMetadadosDeConteudo,
  origemId: number,
  destinoId: number,
  chave: string,
): number {
  const valores = metadados.valoresDe(origemId, chave);
  for (const valor of valores) {
    metadados.acrescentar(destinoId, chave, valorDeMetadado(valor));
  }
  return valores.length;
}

/**
 * `metadata_exists( 'post', $id, $chave )` — se a chave tem alguma linha
 * (`wp-includes/meta.php:1060`).
 *
 * No legado e a mesma leitura de `get_metadata_raw()`: carrega **todas** as
 * linhas do objeto e pergunta pela presenca da chave em memoria. T002 reproduz
 * essa cadeia em {@link RepositorioDeMetadadosDeConteudo.valoresDe}, com a
 * divergencia de cache declarada no cabecalho de `../armazenamento/metadado.ts`.
 */
function metadadoExiste(
  metadados: RepositorioDeMetadadosDeConteudo,
  conteudoId: number,
  chave: string,
): boolean {
  return metadados.valoresDe(conteudoId, chave).length > 0;
}

/**
 * **Ouvinte de fabrica**, prioridade 10 no ponto `_wp_put_post_revision`
 * (`default-filters.php:803`): `wp_save_revisioned_meta_fields( $revision_id,
 * $post_id )` (`wp-includes/revision.php:395`-`:410`).
 *
 * O `get_post_type( $post_id )` que abre a funcao (`:396`) e uma leitura do
 * conteudo, e o `return` quando ele nao existe (`:398`) e silencio puro: a
 * versao fica gravada **sem** o metadado e ninguem e avisado (P7).
 *
 * Devolve as chaves copiadas, na ordem, para que CA-10.1 seja afirmavel por
 * teste. Nenhum ramo do fluxo o consulta.
 */
export function guardarMetadadosVersionados(
  contexto: ContextoDeVersao,
  versaoId: number,
  conteudoId: number,
): readonly string[] {
  const conteudo = contexto.armazenamento.conteudo.obterPorId(conteudoId);
  if (conteudo === null) {
    return [];
  }

  const copiadas: string[] = [];
  const metadados = contexto.armazenamento.metadados;
  for (const chave of chavesDeMetadadoVersionado(contexto, conteudo.tipo)) {
    // ⚠️ A guarda existe SO neste lado — ver a armadilha 1 do cabecalho.
    if (metadadoExiste(metadados, conteudoId, chave)) {
      copiarMetadado(metadados, conteudoId, versaoId, chave);
      copiadas.push(chave);
    }
  }
  return copiadas;
}

/**
 * **Ouvinte de fabrica**, prioridade 10 no ponto `wp_restore_post_revision`
 * (`default-filters.php:809`): `wp_restore_post_revision_meta( $post_id,
 * $revision_id )` (`wp-includes/revision.php:518`-`:540`).
 *
 * ⚠️ **Apaga antes de copiar, e sem conferir se havia o que copiar** (`:534`):
 * *"Clear any existing meta"*. Restaurar uma versao gravada antes de a chave
 * existir **apaga** a chave do conteudo — e e esse o sentido de *"substitui"* em
 * CA-10.4 para o metadado versionado.
 *
 * Devolve as chaves percorridas, na ordem — e sao **todas**, nao so as
 * copiadas, porque todas tiveram o `DELETE` emitido.
 */
export function restaurarMetadadosVersionados(
  contexto: ContextoDeVersao,
  conteudoId: number,
  versaoId: number,
): readonly string[] {
  const conteudo = contexto.armazenamento.conteudo.obterPorId(conteudoId);
  if (conteudo === null) {
    return [];
  }

  const percorridas: string[] = [];
  const metadados = contexto.armazenamento.metadados;
  for (const chave of chavesDeMetadadoVersionado(contexto, conteudo.tipo)) {
    metadados.apagar(conteudoId, chave);
    copiarMetadado(metadados, versaoId, conteudoId, chave);
    percorridas.push(chave);
  }
  return percorridas;
}

/**
 * **Ouvinte de fabrica**, prioridade 10 no filtro
 * `wp_save_post_revision_post_has_changed` (`default-filters.php:800`):
 * `wp_check_revisioned_meta_fields_have_changed()`
 * (`wp-includes/revision.php:610`-`:619`).
 *
 * ⚠️ **So sabe dizer "sim"** (armadilha 2 do cabecalho): recebe o resultado da
 * comparacao dos campos de texto e, achando metadado diferente, o troca para
 * `true` e para o laco. Nunca o volta para `false`.
 *
 * A chave e lida no **conteudo** e na **versao**, e a comparacao e a de
 * `get_post_meta()` sem `single`: a lista inteira de valores daquela chave, na
 * ordem de `meta_id`. Ver a divergencia de comparacao declarada no cabecalho.
 */
export function metadadoVersionadoMudou(
  contexto: ContextoDeVersao,
  mudou: boolean,
  ultimaVersao: Conteudo,
  conteudo: Conteudo,
): boolean {
  const metadados = contexto.armazenamento.metadados;
  for (const chave of chavesDeMetadadoVersionado(contexto, conteudo.tipo)) {
    const doConteudo = metadados.valoresDe(conteudo.id, chave);
    const daVersao = metadados.valoresDe(ultimaVersao.id, chave);
    if (!listasIdenticas(doConteudo, daVersao)) {
      return true;
    }
  }
  return mudou;
}

/**
 * O valor na forma canonica que a comparacao usa — ver o cabecalho.
 *
 * `valorDeMetadado()` e o `maybe_unserialize` da leitura (T002), e
 * `serializarComoTexto()` devolve a forma canonica do valor lido: duas colunas
 * sao identicas no sentido do `!==` do PHP quando, e so quando, estas duas
 * cadeias coincidem.
 */
function formaCanonica(valor: ValorDeColuna): string {
  const lido: ValorPhp = valorDeMetadado(valor);
  return serializarComoTexto(lido);
}

/** `!==` de dois arranjos no PHP: contagem, ordem e valor identico. */
function listasIdenticas(
  esquerda: readonly ValorDeColuna[],
  direita: readonly ValorDeColuna[],
): boolean {
  if (esquerda.length !== direita.length) {
    return false;
  }
  for (let indice = 0; indice < esquerda.length; indice += 1) {
    const aqui = esquerda[indice];
    const la = direita[indice];
    if (aqui === undefined || la === undefined) {
      // Inalcancavel: as duas listas tem o mesmo comprimento e o indice esta
      // dentro dele. O ramo existe porque `noUncheckedIndexedAccess` nao sabe
      // disso, e porque converter o tipo a mao esconderia um erro de verdade.
      return aqui === la;
    }
    if (formaCanonica(aqui) !== formaCanonica(la)) {
      return false;
    }
  }
  return true;
}
