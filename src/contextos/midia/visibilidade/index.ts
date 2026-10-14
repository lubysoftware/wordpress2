/**
 * A visibilidade herdada do anexo — **US-2**, entrega de **T005**.
 *
 * | arquivo | o que e | criterios |
 * |---|---|---|
 * | `visibilidade-de-anexo.ts` | `get_post_status()`, com os cinco desfechos do anexo | CA-2.1, CA-2.2, CA-2.3, CA-2.4 |
 * | `contexto-de-visibilidade.ts` | o contexto da operacao: as duas leituras do conteudo pai | — |
 * | `us-2-visibilidade-herdada.test.ts` | os testes da entrega | os quatro |
 *
 * A **outra metade** de `P2` (BR-MIGRAR-002) nao esta aqui, e nao e esquecimento:
 * a reescrita do estado na **gravacao** (`wp-includes/post.php:4705`) e de BC-01
 * e ja existe, em `contextos/conteudo/gravacao/estado-na-gravacao.ts`. O
 * cabecalho de `visibilidade-de-anexo.ts` tem a tabela das duas metades, com a
 * ancora e o dono de cada uma.
 */

export type {
  ConteudoNaVisibilidade,
  ContextoDeVisibilidade,
  RegistroNaVisibilidade,
} from './contexto-de-visibilidade.js';

export {
  ESTADO_PRESUMIDO_DO_ANEXO,
  ESTADOS_PROPRIOS_DO_ANEXO,
  PONTO_DE_EXTENSAO_DO_ESTADO,
  visibilidadeDoAnexo,
} from './visibilidade-de-anexo.js';
