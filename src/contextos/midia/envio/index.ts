/**
 * O envio de arquivo para a biblioteca — **US-1**, entrega de **T003**.
 *
 * | arquivo | o que e | criterios |
 * |---|---|---|
 * | `permissao-de-envio.ts` | as duas verificacoes de capacidade, e as **tres** superficies do legado | CA-1.1, CA-1.6 |
 * | `tipos-de-arquivo-permitidos.ts` | as 93 entradas de `wp_get_mime_types()`, a lista permitida e a decisao pela extensao | CA-1.2 |
 * | `tipo-real-do-arquivo.ts` | o confronto entre o tipo da extensao e o detectado no conteudo | CA-1.2, CA-1.3 |
 * | `nome-de-arquivo-unico.ts` | a sanitizacao do nome e os **tres** lacos de colisao | CA-1.4 |
 * | `area-de-envios.ts` | a subpasta de ano e mes, e as duas mensagens de falha | CA-1.5 |
 * | `contexto-de-envio.ts` | o contexto da operacao: autorizacao, BC-01, relogio, texto, deteccao | — |
 * | `enviar-arquivo.ts` | o fluxo, na ordem do legado | os seis |
 *
 * E o contorno do filtro de tipo — **US-9**, entrega de **T019**, que mora aqui
 * porque no legado ele e um ramo de `_wp_handle_upload()` e nao uma operacao
 * propria:
 *
 * | arquivo | o que e | criterios |
 * |---|---|---|
 * | `registro-de-envio-sem-filtro.ts` | o evento de auditoria do envio que passou pelo contorno, e o censo das cinco ancoras da capacidade | CA-9.4 |
 * | `us-9-envio-sem-filtro.test.ts` | os testes da entrega, pelo envio inteiro | os quatro |
 *
 * CA-9.1, CA-9.2 e CA-9.3 nao tem arquivo porque nao precisaram de codigo novo:
 * a negacao por omissao de `ALLOW_UNFILTERED_UPLOADS` e de
 * `plataforma/autorizacao/revogacao-por-constante.ts`, e o `if` que usa a
 * resposta esta em `enviar-arquivo.ts`, onde o legado o faz.
 *
 * O que esta pasta **nao** faz esta no cabecalho de `enviar-arquivo.ts`, item
 * por item, com a tarefa de cada coisa: derivada e T007, reducao na ingestao e
 * T009, relato de falha e T011.
 */

export {
  abrirAreaDeEnvios,
  caminhoEncurtado,
  MENSAGEM_DE_ARQUIVO_NAO_MOVIDO,
  MENSAGEM_DE_PASTA_NAO_CRIADA,
  subpastaDeAnoEMes,
  type AreaDeEnvios,
  type ContextoDaAreaDeEnvios,
} from './area-de-envios.js';

export type {
  ArmazenamentoNoEnvio,
  ArquivoRecebido,
  ConteudoNaMidia,
  ContextoDeEnvio,
  DadosDoAnexoInformados,
  DestinoDoEnvio,
  MetadadoDeArquivoNoEnvio,
  MetadadoDeAudioLido,
  MetadadoDeImagemLido,
  PedidoDeEnvio,
  RelogioNoEnvio,
  ResultadoDaInsercaoDeAnexo,
} from './contexto-de-envio.js';

export {
  CAPACIDADE_DE_ENVIO_SEM_FILTRO,
  CODIGO_DE_ERRO_DE_ENVIO,
  enviarArquivo,
  MENSAGEM_DE_ARQUIVO_NAO_RECEBIDO,
  MENSAGEM_DE_ARQUIVO_VAZIO,
  MENSAGEM_DE_ARQUIVO_VAZIO_EM_REDE,
  MENSAGEM_DE_FORMULARIO_INVALIDO,
  MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  MENSAGENS_DE_ERRO_DE_ENVIO,
  type EnvioConcluido,
  type RecusaDoEnvio,
  type ResultadoDoEnvio,
} from './enviar-arquivo.js';

export {
  CARACTERES_REMOVIDOS_DO_NOME,
  colideComNomeDeDerivada,
  CONVERSAO_DE_FORMATO_DO_EDITOR_DE_FABRICA,
  LIMITE_DE_TENTATIVAS_SEM_LISTAGEM,
  NOME_SEM_NOME,
  nomeDeArquivoUnico,
  sanitizarNomeDeArquivo,
  type NomeDeArquivoResolvido,
  type PedidoDeNomeUnico,
  type TextoNoEnvio,
} from './nome-de-arquivo-unico.js';

export {
  autorizarEnvio,
  CAPACIDADE_DE_EDITAR_CONTEUDO,
  CAPACIDADE_DE_ENVIAR_ARQUIVO,
  MENSAGEM_DE_ANEXO_NAO_PERMITIDO_NO_CONTEUDO,
  MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
  SUPERFICIES_QUE_DESCARTAM_O_DESTINO,
  type AutorizacaoNoEnvio,
  type DecisaoDeEnvio,
  type DestinoExiste,
  type SuperficieDeEnvio,
} from './permissao-de-envio.js';

export {
  ORIGEM_DO_ENVIO_SEM_FILTRO,
  registrarEnvioSemFiltro,
  SEVERIDADE_DO_ENVIO_SEM_FILTRO,
  type EnvioSemFiltroRegistrado,
  type RegistroDeEnvioSemFiltro,
} from './registro-de-envio-sem-filtro.js';

export {
  ESPERADOS_TOLERADOS_EM_CSV,
  ESPERADOS_TOLERADOS_EM_RTF,
  ESPERADOS_TOLERADOS_EM_TEXTO_PURO,
  EXTENSAO_CORRETA_DO_TIPO_DE_IMAGEM,
  EXTENSOES_DE_HEIC_SEMPRE_CORRIGIDAS,
  tipoRealDoArquivo,
  TIPOS_DUPLICADOS_PELO_FILEINFO,
  TIPOS_MAIORES_BINARIOS,
  TIPOS_REAIS_NAO_ESPECIFICOS,
  type DeteccaoDeTipoReal,
  type PedidoDeValidacaoDeTipo,
  type TipoRealDoArquivo,
} from './tipo-real-do-arquivo.js';

export {
  CAPACIDADE_DE_HTML_BRUTO,
  extensaoPadraoDoTipo,
  PADROES_DE_HTML_BRUTO,
  PADROES_SEMPRE_RETIRADOS,
  TIPO_NAO_RECONHECIDO,
  tipoPelaExtensao,
  TIPOS_DE_ARQUIVO_DE_FABRICA,
  tiposPermitidos,
  type ListaDeTiposDeArquivo,
  type TipoDeArquivoDeclarado,
  type TipoPelaExtensao,
} from './tipos-de-arquivo-permitidos.js';
