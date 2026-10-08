/**
 * Os pontos de configuracao do modulo de interacao publica.
 *
 * Hoje ha um grupo: a moderacao, de T001. Cada tarefa que trouxer numero novo o
 * poe num ponto nomeado aqui, com o valor de fabrica do legado e a linha que o
 * semeia, como o P6 da constituicao exige.
 *
 * ⚠️ **O que NAO esta aqui, e nao e esquecimento.** Quatro familias de numero
 * tocam comentario no legado e nao sao configuracao de moderacao:
 *
 * - **Os limites de coluna** (nome, e-mail, URL e texto acima do tamanho da
 *   coluna sao ERRO e nao truncamento, `C10` / BR-MIGRAR-018) sao a forma de
 *   armazenamento, que e T002, e a recusa e T012.
 * - **A apresentacao da lista** (`page_comments`, `comments_per_page`,
 *   `default_comments_page`, `comment_order`) e leitura publica, nao moderacao:
 *   nenhuma historia da `spec.md` desta feature os nomeia.
 * - **A imagem de quem comenta** (`show_avatars`, `avatar_default`,
 *   `avatar_rating`) e US-18 / T038, e a `spec.md` registra que ela carrega uma
 *   **divergencia deliberada do observavel** que precisa de decisao humana (P1).
 *   Semear o valor de fabrica dela aqui, antes dessa decisao, seria decidi-la.
 * - **O prazo e o lote do spam** (15 dias, lotes de 10.000) estao em
 *   `discard_log.md`: a regra `C13` foi descartada com a resposta 13, porque vive
 *   no classificador externo e nao no nucleo clonado. O descarte e decisao
 *   registrada, e o P8 proibe traze-lo de volta sem uma linha que o autorize.
 */

export {
  LIMITES_DA_MODERACAO_DE_FABRICA,
  OPCOES_DE_MODERACAO_DE_FABRICA,
  SEGUNDOS_POR_DIA,
  SEGUNDOS_POR_HORA,
  TIPOS_DE_CONTEUDO_COM_FECHAMENTO_AUTOMATICO_DE_FABRICA,
  type LimitesDaModeracao,
  type OpcoesDeModeracao,
} from './configuracao-de-moderacao.js';
