/**
 * Os marcadores de lixeira, com nome: o estado anterior e o instante do
 * descarte, gravados e lidos como metadado do registro.
 *
 * Entrega de **T002**. O que esta aqui e a **forma** dos tres marcadores de
 * `chaves-e-tabelas.ts` sobre a familia de metadado de `metadado.ts`, para as
 * duas familias que a lixeira toca — conteudo e comentario. Nenhuma regra de
 * negocio desta feature esta neste arquivo.
 *
 * ── A ORDEM DOS COMANDOS E DA HISTORIA, NAO DAQUI ──────────────────────────
 *
 * Este arquivo oferece **primitivas**, uma por marcador e por operacao, e nao
 * uma chamada que "registra o descarte". E deliberado: as duas sequencias do
 * legado sao **diferentes**, e quem as ordena e a tarefa de cada historia.
 *
 * | fluxo | sequencia no legado | de quem e |
 * |---|---|---|
 * | conteudo para a lixeira | acrescenta estado, acrescenta instante — **dois** comandos, sem apagar antes (`wp-includes/post.php:4128` e `:4129`) | T003 (US-1) |
 * | comentario para a lixeira | apaga estado, apaga instante, acrescenta estado, acrescenta instante — **quatro**, nessa ordem (`wp-includes/comment.php:1689` a `:1692`) | T005 (US-2) e a moderacao de BC-03 |
 * | conteudo restaurado | apaga estado, apaga instante, **antes** de gravar o novo estado (`wp-includes/post.php:4228` e `:4229`) | T007 (US-3) |
 * | comentario restaurado | apaga **instante primeiro**, depois estado — a ordem inversa da do descarte (`wp-includes/comment.php:1761` e `:1762`) | T007 (US-3) |
 * | coleta tolerando inconsistencia | apaga estado e instante, e **nao** apaga o registro (`wp-includes/functions.php:6990` e `:6991`; no comentario a ordem se inverte de novo, `:7008` e `:7009`) | T015 (US-7) |
 *
 * O comentario apaga antes de acrescentar porque ele **pode** ja ter marcador:
 * o caminho de spam grava os mesmos dois (`wp-includes/comment.php:1807` a
 * `:1810`), e um comentario vai de spam para a lixeira sem passar por lugar
 * nenhum que os limpe. O conteudo nao apaga porque `wp_trash_post()` recusa o
 * que ja esta em `trash` na terceira linha (`wp-includes/post.php:4095`). Trocar
 * qualquer uma dessas ordens muda a sequencia de comandos que a area 3 da
 * Decisao 2 compara.
 *
 * ── O QUE NAO ESTA AQUI, E POR QUE ─────────────────────────────────────────
 *
 * 🔴 **A varredura do que venceu nao e desta tarefa.** A unica comparacao de
 * prazo do legado e
 * `SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_wp_trash_meta_time'
 * AND meta_value < %d` (`wp-includes/functions.php:6979`, e a gemea sobre
 * `commentmeta` em `:6997`): ela atravessa **todos** os registros, nao le o
 * marcador "do registro" que `tasks.md` pede aqui, e o `%d` dela vem de
 * `instanteLimiteDeRetencao()`, que e o prazo de T001. Ela entra em **T011**
 * (US-5), com a borda de UT-052-2 — o operador e **estritamente menor**, e o
 * registro descartado exatamente no instante limite ainda **nao** vence.
 *
 * Tambem nao esta aqui a decisao de **o que** gravar: o estado anterior vem de
 * `$post->post_status` ou de `$comment->comment_approved` (dado de BC-01 e de
 * BC-03, alcancado por ligacao tardia, AD-10), e o instante vem de `time()`, que
 * neste modulo e a `PortaDeRelogio`. Quem le as duas coisas e a operacao de
 * descarte, T003.
 */

import {
  arranjo,
  nomeDaChave,
  normalizarChaveDeTexto,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type { PortaDeDados } from '../portas/index.js';
import {
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  METADADO_DE_COMENTARIO,
  METADADO_DE_CONTEUDO,
  type TipoDeMetadado,
} from './chaves-e-tabelas.js';
import { comoInteiro } from './leitura-de-linha.js';
import {
  criarRepositorioDeMetadados,
  type RepositorioDeMetadados,
} from './metadado.js';

/**
 * O estado anterior de um comentario, como a cascata o guarda: um par
 * identificador/estado.
 *
 * O estado e a cadeia de `comments.comment_approved`, que
 * `target_data_model.md` descreve como `varchar(20)` sem `ENUM` e sem `CHECK`,
 * aceitando `'0'`, `'1'`, `'spam'` e `'trash'` (BR-MIGRAR-096). `'post-trashed'`
 * **tambem** cabe na coluna e e justamente o valor que CA-2.4 diz nao ser
 * alcancavel pela interface de moderacao — a coluna nao o impede, o codigo
 * impede.
 */
export interface EstadoGuardadoDeComentario {
  readonly comentarioId: number;
  readonly estado: string;
}

/** Os dois marcadores que todo registro descartado carrega. */
export interface MarcadoresDeLixeira {
  /** A familia de metadado sobre a qual estes marcadores moram. */
  readonly metadados: RepositorioDeMetadados;

  /**
   * `get_*_meta( $id, '_wp_trash_meta_status', true )`, com o `(string)` que os
   * chamadores aplicam (`wp-includes/comment.php:1755`).
   *
   * Devolve **texto vazio** quando o marcador nao existe, e e esse vazio que
   * decide tres comportamentos ja escritos no pacote: o anexo cujo pai foi
   * descartado sem marcador assume `publish` (`wp-includes/post.php:1317`), o
   * comentario restaurado sem marcador volta para a **fila de moderacao** —
   * `'0'`, a borda de UT-048-6 — e o mapeamento de capacidade sobre quem esta na
   * lixeira cai no estado vazio (`wp-includes/capabilities.php:154`).
   */
  estadoAnterior(registroId: number): string;

  /**
   * `get_*_meta( $id, '_wp_trash_meta_time', true )`, como inteiro, e `null`
   * quando o marcador nao existe.
   *
   * ⚠️ **O legado nunca le este marcador por registro.** Ele o grava, o apaga e
   * o compara **dentro do SQL** da coleta
   * (`wp-includes/functions.php:6979`). Este leitor existe porque a entrega de
   * T002 pede os dois marcadores *"gravados **e lidos**"* e porque sem ele nao
   * ha como afirmar o byte gravado; **nenhum fluxo do legado o chama**, e quem
   * for construir a coleta nao deve usa-lo em lugar da varredura: filtrar em
   * memoria mudaria o conjunto de linhas e o numero de comandos.
   *
   * A coercao e a frouxa de `comoInteiro`, que e a que o MySQL aplica ao
   * comparar `meta_value < %d` sobre coluna de texto.
   */
  instanteDoDescarte(registroId: number): number | null;

  /** `add_*_meta( $id, '_wp_trash_meta_status', $estado )` — **sempre insere**. */
  acrescentarEstadoAnterior(registroId: number, estado: string): number;

  /**
   * `add_*_meta( $id, '_wp_trash_meta_time', time() )` — **sempre insere**.
   *
   * O instante chega por argumento, e nao do relogio: quem le o relogio e a
   * operacao de descarte (T003). O valor vai a coluna como **inteiro**, logo o
   * que `longtext` recebe e a cadeia decimal dele — a mesma que a coleta
   * compara.
   */
  acrescentarInstanteDoDescarte(
    registroId: number,
    instanteEmSegundos: number,
  ): number;

  /** `delete_*_meta( $id, '_wp_trash_meta_status' )` — dois comandos, ou nenhum. */
  apagarEstadoAnterior(registroId: number): number;

  /** `delete_*_meta( $id, '_wp_trash_meta_time' )` — dois comandos, ou nenhum. */
  apagarInstanteDoDescarte(registroId: number): number;
}

/**
 * Os marcadores do **conteudo**, que sao tres: os dois de todo registro mais o
 * estado anterior dos comentarios, agrupado.
 *
 * A terceira chave nao tem gemea em `commentmeta`: ela mora no conteudo e e o
 * *"guardado, agrupado, junto do conteudo"* de CA-2.2.
 */
export interface MarcadoresDeLixeiraDoConteudo extends MarcadoresDeLixeira {
  /**
   * `get_post_meta( $id, '_wp_trash_meta_comments_status', true )`
   * (`wp-includes/post.php:4340`), com as entradas na ordem em que foram
   * gravadas.
   *
   * `null` significa **marcador ausente**; lista vazia significa marcador
   * presente com arranjo vazio. No legado os dois caem no mesmo `! $statuses`
   * (`wp-includes/post.php:4342`), que encerra a restauracao sem emitir comando
   * — a distincao fica disponivel aqui porque sao dois estados diferentes do
   * banco, e quem decide o que fazer com cada um e T007.
   *
   * ⚠️ Valor presente que **nao** e arranjo tambem devolve `null`. O legado nao
   * trata esse caso: ele passaria a cadeia a `foreach` e a `array_keys()`, o que
   * e falha de tempo de execucao e nao comportamento. A unica escrita desta
   * chave no nucleo e a cascata de T005, que sempre grava arranjo.
   */
  estadosDosComentarios(
    conteudoId: number,
  ): readonly EstadoGuardadoDeComentario[] | null;

  /**
   * `add_post_meta( $id, '_wp_trash_meta_comments_status', $statuses )`
   * (`wp-includes/post.php:4299`).
   *
   * **A ordem das entradas e preservada e nao e ordenada.** No legado ela e a
   * ordem em que `SELECT comment_ID, comment_approved FROM $wpdb->comments WHERE
   * comment_post_ID = %d` (`wp-includes/post.php:4288`) devolveu as linhas — uma
   * consulta **sem `ORDER BY`** —, e essa ordem sai nos bytes do valor
   * serializado. Ordenar aqui mudaria o byte gravado, que e o criterio da area 3
   * da Decisao 2 e o que o cenario de `15-fronteira-do-banco-e-codec-serialize`
   * cobra: *"nenhuma das duas normaliza, reordena nem reindexa a estrutura"*.
   *
   * A chave do arranjo passa pela normalizacao de chave do PHP: o identificador
   * chega do driver como cadeia numerica, e `$statuses[ $comment->comment_ID ]`
   * a converte em chave **inteira**. E por isso que os bytes saem
   * `a:1:{i:5;s:1:"1";}` e nao `a:1:{s:1:"5";s:1:"1";}`.
   */
  acrescentarEstadosDosComentarios(
    conteudoId: number,
    estados: readonly EstadoGuardadoDeComentario[],
  ): number;

  /**
   * `delete_post_meta( $id, '_wp_trash_meta_comments_status' )`
   * (`wp-includes/post.php:4372`).
   *
   * No legado ele e apagado **depois** de os comentarios serem devolvidos, e nao
   * antes: a restauracao usa o valor e so entao o descarta.
   */
  apagarEstadosDosComentarios(conteudoId: number): number;
}

/** Os marcadores de uma familia de metadado qualquer das duas. */
export function criarMarcadoresDeLixeira(
  dados: PortaDeDados,
  tipo: TipoDeMetadado,
): MarcadoresDeLixeira {
  const metadados = criarRepositorioDeMetadados(dados, tipo);
  return marcadoresSobre(metadados);
}

/** Os marcadores do comentario, em `{site}commentmeta`. */
export function criarMarcadoresDeLixeiraDoComentario(
  dados: PortaDeDados,
): MarcadoresDeLixeira {
  return criarMarcadoresDeLixeira(dados, METADADO_DE_COMENTARIO);
}

/** Os marcadores do conteudo, em `{site}postmeta` — os tres. */
export function criarMarcadoresDeLixeiraDoConteudo(
  dados: PortaDeDados,
): MarcadoresDeLixeiraDoConteudo {
  const metadados = criarRepositorioDeMetadados(dados, METADADO_DE_CONTEUDO);

  return {
    ...marcadoresSobre(metadados),

    estadosDosComentarios(conteudoId) {
      const valor = metadados.valorUnicoBruto(
        conteudoId,
        MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
      );
      if (valor === null || valor.tipo !== 'arranjo') {
        return null;
      }
      return valor.entradas.map((entrada) => ({
        comentarioId: comoInteiro(nomeDaChave(entrada.chave)),
        estado: cadeiaDePhp(entrada.valor),
      }));
    },

    acrescentarEstadosDosComentarios(conteudoId, estados) {
      const entradas: EntradaDeArranjo[] = estados.map((guardado) => ({
        chave: normalizarChaveDeTexto(String(guardado.comentarioId)),
        valor: { tipo: 'texto', valor: guardado.estado },
      }));
      return metadados.acrescentar(
        conteudoId,
        MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
        arranjo(entradas),
      );
    },

    apagarEstadosDosComentarios(conteudoId) {
      return metadados.apagar(
        conteudoId,
        MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
      );
    },
  };
}

function marcadoresSobre(
  metadados: RepositorioDeMetadados,
): MarcadoresDeLixeira {
  return {
    metadados,

    estadoAnterior(registroId) {
      return cadeiaDePhp(
        metadados.valorUnico(registroId, MARCADOR_DE_ESTADO_ANTERIOR),
      );
    },

    instanteDoDescarte(registroId) {
      const valores = metadados.valoresDe(
        registroId,
        MARCADOR_DO_INSTANTE_DO_DESCARTE,
      );
      if (valores.length === 0) {
        return null;
      }
      return comoInteiro(valores[0]);
    },

    acrescentarEstadoAnterior(registroId, estado) {
      return metadados.acrescentar(registroId, MARCADOR_DE_ESTADO_ANTERIOR, {
        tipo: 'texto',
        valor: estado,
      });
    },

    acrescentarInstanteDoDescarte(registroId, instanteEmSegundos) {
      return metadados.acrescentar(
        registroId,
        MARCADOR_DO_INSTANTE_DO_DESCARTE,
        { tipo: 'inteiro', valor: instanteEmSegundos },
      );
    },

    apagarEstadoAnterior(registroId) {
      return metadados.apagar(registroId, MARCADOR_DE_ESTADO_ANTERIOR);
    },

    apagarInstanteDoDescarte(registroId) {
      return metadados.apagar(registroId, MARCADOR_DO_INSTANTE_DO_DESCARTE);
    },
  };
}

/**
 * O `(string)` do PHP sobre o valor lido, que e o que os chamadores do marcador
 * de estado aplicam (`(string) get_comment_meta( ... )`,
 * `wp-includes/comment.php:1755`).
 *
 * Nulo e `false` viram cadeia vazia, `true` vira `'1'`, numero vira a
 * representacao decimal dele e arranjo vira `'Array'` — que e o que o PHP emite,
 * com aviso, e e caso degenerado que esta feature nao cria.
 */
function cadeiaDePhp(valor: ValorPhp): string {
  switch (valor.tipo) {
    case 'nulo':
      return '';
    case 'booleano':
      return valor.valor ? '1' : '';
    case 'inteiro':
    case 'decimal':
      return String(valor.valor);
    case 'texto':
      return typeof valor.valor === 'string'
        ? valor.valor
        : new TextDecoder().decode(valor.valor);
    case 'arranjo':
      return 'Array';
  }
}
