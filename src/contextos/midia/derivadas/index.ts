/**
 * A geracao das derivadas de imagem — **US-3**, entrega de **T007**.
 *
 * | arquivo | o que e | criterios |
 * |---|---|---|
 * | `tamanhos-registrados.ts` | a resolucao dos tamanhos em execucao: opcao, registro de requisicao, e a regra que salta tamanho sem medida | CA-3.1, CA-3.2 |
 * | `dimensoes-de-redimensionamento.ts` | `image_resize_dimensions()` e `wp_constrain_dimensions()` — as medidas reais, de onde sai o nome | CA-3.1, CA-3.4 |
 * | `nome-da-derivada.ts` | o sufixo `-{largura}x{altura}` e o formato de saida, que e **endereco publico** | CA-3.4 |
 * | `orientacao-exif.ts` | `maybe_exif_rotate()`, que roda **antes** do laco | CA-3.1 |
 * | `contexto-de-derivadas.ts` | o contexto da operacao, com as duas portas e os cinco colaboradores | — |
 * | `gerar-derivadas.ts` | `_wp_make_subsizes()`: o laco, a ordem de prioridade e os **dois** silencios de `M4` | CA-3.1, CA-3.4 |
 * | `criar-derivadas-na-ingestao.ts` | `wp_create_image_subsizes()` sem o passo de T009, com o conflito aberto nomeado no lugar | CA-3.1, CA-3.4 |
 * | `regerar-derivadas.ts` | `wp_get_missing_image_subsizes()` e a **acao explicita** de `wp_update_image_subsizes()` | CA-3.3 |
 * | `us-3-gerar-derivadas.test.ts` | os testes da entrega | os quatro |
 *
 * O que esta pasta **nao** faz esta no cabecalho de
 * `criar-derivadas-na-ingestao.ts`, item por item, com a tarefa de cada coisa: a
 * reducao na ingestao e a conversao de formato do arquivo principal sao **T009**
 * (US-4), o relato da falha e **T011** (US-5), a escolha da derivada servida e
 * **T013** (US-6) e a regeneracao depois de transformar a imagem e **T015**
 * (US-7).
 *
 * 🔴 **Antes de pegar T009 ou T015**, a secao *O que T001 encontrou aberto* de
 * `../README.md`: a `spec.md` e a arvore analisada discordam sobre de qual
 * arquivo as derivadas saem quando houve reducao, e o conflito **nao** foi
 * resolvido por esta tarefa — ela recebe o caminho por argumento.
 */

export type {
  ArmazenamentoNasDerivadas,
  ConteudoNasDerivadas,
  ContextoDeDerivadas,
  DimensoesLidasDoArquivo,
  LeituraDeArquivoDeImagem,
} from './contexto-de-derivadas.js';

export {
  CHAVE_DO_METADADO_DE_IMAGEM,
  caminhoRelativoDeEnvio,
  criarDerivadasDeImagem,
  type PedidoDeIngestaoDeImagem,
} from './criar-derivadas-na-ingestao.js';

export {
  dimensoesContidas,
  dimensoesDeRedimensionamento,
  numerosQuaseIguais,
  type DimensoesDeCopia,
} from './dimensoes-de-redimensionamento.js';

export {
  gerarDerivadas,
  TAMANHOS_PRIORITARIOS,
  type PedidoDeDerivadas,
} from './gerar-derivadas.js';

export {
  caminhoDaDerivada,
  formatoDeSaidaDaDerivada,
  TIPO_MIME_PADRAO_DO_EDITOR,
  type FormatoDeSaida,
  type FormatoPedido,
} from './nome-da-derivada.js';

export {
  rotacionarPorOrientacaoExif,
  TIPO_COM_ORIENTACAO_EXIF,
  type RotacaoPorExif,
} from './orientacao-exif.js';

export {
  caminhoDaImagemOriginal,
  CODIGO_DE_ANEXO_INVALIDO,
  derivadasQueFaltam,
  MENSAGEM_DE_ARQUIVO_NAO_ENCONTRADO,
  regerarDerivadasQueFaltam,
  type ResultadoDaRegeracao,
} from './regerar-derivadas.js';

export {
  nomesDeTamanhosIntermediarios,
  NOMES_DE_TAMANHO_FIXOS,
  normalizarRecorte,
  TAMANHOS_ADICIONAIS_DE_FABRICA,
  tamanhosRegistrados,
  type OpcoesDeTamanhoDeImagem,
  type TamanhoAdicional,
  type ValorDeRecorteGravado,
} from './tamanhos-registrados.js';
