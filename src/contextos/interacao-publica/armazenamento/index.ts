/**
 * A forma de armazenamento do comentario e do metadado dele.
 *
 * Entrega de **T002** da feature `007-interacao-publica-e-moderacao`: *"a
 * estrutura de comentario existe com o vocabulario de estado e de tipo do
 * legado, a auto-referencia que encadeia respostas e o vinculo opcional com
 * conta, e e lida e gravada pela porta de dados"*.
 *
 * As duas estruturas da secao *Modelo de dados* do plano, e onde cada uma mora:
 *
 * | estrutura do plano | onde | arquivo |
 * |---|---|---|
 * | `comments` | `{site}comments`, 15 colunas | `comentario.ts` |
 * | `commentmeta` | `{site}commentmeta`, 4 colunas | `metadado.ts` |
 *
 * E as duas pecas que atravessam as duas:
 *
 * | peca | arquivo | por que existe |
 * |---|---|---|
 * | o vocabulario de estado e de tipo, e os dois zeros de vinculo ausente | `vocabulario.ts` | o plano manda: *"o modelo novo precisa dos cinco valores"* |
 * | o DDL das duas tabelas, byte a byte, e os quatro limites de coluna | `esquema.ts` | e o contrato que `DB-MIG` compara, e e dele que `C10` deriva os limites |
 *
 * E as tres estruturas do plano que **nao** estao aqui, cada uma com o dono:
 *
 * - **o contador no conteudo** (`posts.comment_count`) e tabela de BC-01, e
 *   quem a escreve e a operacao de contagem — T026 (US-12). `DB-TRG1`
 *   (BR-MIGRAR-077) a descreve como desnormalizada, recalculada em PHP e
 *   **suspensivel**, e nenhuma escrita deste armazenamento a menciona;
 * - **a configuracao de moderacao** e de T001 e vive em `../configuracao/`:
 *   sao opcoes de `options`, nao colunas destas duas tabelas;
 * - **`_wp_trash_meta_comments_status`**, o estado de todos os comentarios
 *   quando o conteudo vai para a lixeira, mora em `postmeta`
 *   (`wp-includes/post.php:4299`) e e da feature 005.
 *
 * **Nada aqui resolve no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106): criar o
 * armazenamento monta nome de tabela e nada mais — nenhuma consulta sai, nenhuma
 * opcao e lida, nenhum DDL e emitido. **E nada aqui guarda estado de modulo**
 * (`EXT-CONTEXTO`, BR-MIGRAR-105): os repositorios nascem da porta que recebem,
 * e duas composicoes de sites diferentes nao se enxergam — que e o que o cenario
 * `@concorrencia` de `PT-001` cobra, *"o comentario do visitante nao recebe o
 * atalho de confianca do moderador"*.
 *
 * **E nenhuma regra de negocio desta feature esta aqui.** A cascata de
 * moderacao (T003 e T010) e as doze regras que ela percorre, a recusa da
 * duplicata (T006), o limite de vazao (T008), a recusa do campo longo (T012), o
 * fechamento por idade (T014), o encadeamento (T016), a moderacao (T022), a
 * lixeira (T024) e o contador (T026) sao as tarefas delas. O que este
 * armazenamento entrega e a linha, a consulta e a sequencia de comandos — e e
 * por isso que ele **nao** recusa estado fora do vocabulario, **nao** exige
 * conteudo, pai ou conta existentes e **nao** cobra limite de campo nenhum:
 * tolerar e o que o legado faz, e os cinco motivos estao em `comentario.ts`.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  criarRepositorioDeComentarios,
  type RepositorioDeComentarios,
} from './comentario.js';
import {
  criarRepositorioDeMetadadosDeComentario,
  type RepositorioDeMetadadosDeComentario,
} from './metadado.js';

export interface ArmazenamentoDeInteracao {
  /** `{site}comments` — comentario, notificacao de link e nota editorial. */
  readonly comentarios: RepositorioDeComentarios;
  /** `{site}commentmeta` — a extensao aberta em par chave e valor. */
  readonly metadados: RepositorioDeMetadadosDeComentario;
}

export function criarArmazenamentoDeInteracao(
  dados: PortaDeDados,
): ArmazenamentoDeInteracao {
  return {
    comentarios: criarRepositorioDeComentarios(dados),
    metadados: criarRepositorioDeMetadadosDeComentario(dados),
  };
}

export {
  tabelaDeComentarios,
  tabelaDeMetadadosDeComentario,
} from './chaves-e-tabelas.js';

export {
  campoDaColuna,
  criarRepositorioDeComentarios,
  lerComentario,
  COLUNAS_DA_ATUALIZACAO,
  COLUNAS_DA_INSERCAO,
  type CamposDeComentario,
  type Comentario,
  type ComentarioGravavel,
  type RepositorioDeComentarios,
} from './comentario.js';

export {
  ddlDeComentarios,
  ddlDeMetadadosDeComentario,
  ddlDoArmazenamentoDeInteracao,
  ESTADO_PADRAO_DO_ARMAZENAMENTO,
  LIMITES_DE_COLUNA_DO_COMENTARIO,
  TAMANHO_MAXIMO_DE_INDICE,
  TIPO_PADRAO_DO_ARMAZENAMENTO,
  type OpcoesDoEsquema,
} from './esquema.js';

export {
  criarRepositorioDeMetadadosDeComentario,
  valorDeMetadado,
  valorEntraNaClausula,
  vazioComoNoPhp,
  CHAVES_DO_DESCARTE,
  type MetadadoDeComentario,
  type RepositorioDeMetadadosDeComentario,
  type ResultadoDaGravacaoDeMetadado,
  type ValorDeMetadado,
} from './metadado.js';

export {
  eAnonimo,
  eDePrimeiroNivel,
  tipoNormalizado,
  DATA_SENTINELA,
  ESTADO_ALCANCAVEL_PELA_API_DE_ESTADO,
  ESTADO_APROVADO,
  ESTADO_CONTEUDO_NA_LIXEIRA,
  ESTADO_NA_FILA,
  ESTADO_NA_LIXEIRA,
  ESTADO_SPAM,
  ESTADOS_DO_COMENTARIO,
  SEM_CONTA,
  SEM_RESPOSTA,
  TIPO_COMENTARIO,
  TIPO_NOTA_EDITORIAL,
  TIPO_PINGBACK,
  TIPO_TRACKBACK,
  TIPOS_DE_COMENTARIO,
  type EstadoDoComentario,
  type TipoDeComentario,
} from './vocabulario.js';
