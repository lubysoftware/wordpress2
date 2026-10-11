/**
 * A escolha da apresentacao — a entrega de **T005** (US-2).
 *
 * Sete arquivos, e a divisao entre eles e a do legado:
 *
 * | arquivo | o que e | legado |
 * |---|---|---|
 * | `caminho-de-modelo.ts` | `wp_normalize_path`, `trailingslashit`, `validate_file` | `functions.php:2194`, `:6372` · `formatting.php:2825` |
 * | `objeto-consultado.ts` | o `get_queried_object()` como a hierarquia o le, mais `is_front_page` e `is_page( $pagina )` | `class-wp-query.php:3988`, `:4496`, `:4578` |
 * | `tema-ativo.ts` | o tema como ligacao tardia: dois caminhos, dois nomes e tres perguntas | `template.php:694` · `theme.php:163` |
 * | `localizar-modelo.ts` | `locate_template` e o portao de caminho permitido | `template.php:713`, `:784` |
 * | `hierarquia-de-modelos.ts` | as dezessete regras como DADO, e `get_query_template` | `template-loader.php:67` · `template.php:23-684` |
 * | `escolher-apresentacao.ts` | `template-loader.php` inteiro: a ordem, a reserva final e `template_include` | `template-loader.php:1-139` |
 * | `publicacao-para-o-tema.ts` | `register_globals` — a etapa 5 do atendimento | `class-wp.php:662` |
 *
 * Quem poe a etapa 5 na ordem do atendimento e
 * `../requisicao/atender-leitura-publica.ts`; a escolha de apresentacao **nao**
 * e etapa de `WP::main()` e por isso e operacao propria do modulo — a razao
 * esta no cabecalho de `./escolher-apresentacao.ts`. Nada aqui guarda estado:
 * tudo chega por argumento, porque tema ativo e consulta corrente sao escopo de
 * REQUISICAO (BR-MIGRAR-105, `EXT-CONTEXTO`).
 */

export {
  comBarraNoFim,
  normalizarCaminho,
  semBarraNoFim,
  validarArquivo,
} from './caminho-de-modelo.js';

export type { ObjetoConsultadoNoTema } from './objeto-consultado.js';
export {
  consultaDaPaginaDaFrente,
  consultaDePagina,
  criterioDaConsulta,
  identificadorDoObjetoConsultado,
  objetoConsultadoNoTema,
} from './objeto-consultado.js';

export type { TemaAtivo } from './tema-ativo.js';
export { temaFilho, TEMA_SEM_MODELOS } from './tema-ativo.js';

export {
  caminhoDeModeloPermitido,
  localizarModelo,
} from './localizar-modelo.js';

export type {
  ContextoDaApresentacao,
  ContextoDaApresentacaoResolvido,
  DadosDaConta,
  FormatoDoConteudo,
  ModeloDeclaradoNoConteudo,
} from './contexto-da-apresentacao.js';
export {
  contextoDaApresentacaoResolvido,
  METODO_PADRAO,
} from './contexto-da-apresentacao.js';

export type {
  EntradaDaHierarquia,
  IntercepcaoDaHierarquia,
  IntercepcaoDoModelo,
  LeituraDaConsulta,
  PontosDaHierarquia,
  RegraDeModelo,
} from './hierarquia-de-modelos.js';
export {
  HIERARQUIA_DE_MODELOS,
  modeloDaConsulta,
  TIPO_DA_RESERVA_FINAL,
  tipoSaneado,
} from './hierarquia-de-modelos.js';

export type {
  ApresentacaoEscolhida,
  IntercepcaoDeSaidaNoCabecalho,
  IntercepcaoDoModeloIncluido,
  ObservadorDaApresentacao,
  OpcoesDaApresentacao,
  PassoDaProcura,
  PontosDaApresentacao,
  SaidaDaApresentacao,
} from './escolher-apresentacao.js';
export {
  escolherApresentacao,
  FILTRO_DE_ANEXO_NO_CORPO,
  METODO_SEM_CORPO,
} from './escolher-apresentacao.js';

export type { PublicacaoParaOTema } from './publicacao-para-o-tema.js';
export { publicarParaOTema } from './publicacao-para-o-tema.js';
