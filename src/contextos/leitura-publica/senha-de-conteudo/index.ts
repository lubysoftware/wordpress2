/**
 * A senha de conteudo — a entrega de **T013** (US-6).
 *
 * Sete arquivos, e a divisao entre eles e a do legado:
 *
 * | arquivo | o que e | legado |
 * |---|---|---|
 * | `hash-do-atestado.ts` | `PasswordHash( 8, true )`: `encode64`, `gensalt_private`, `crypt_private`, `HashPassword`, `CheckPassword` | `wp-includes/class-phpass.php` |
 * | `contexto-de-senha-de-conteudo.ts` | as colaboracoes tardias e o cookie que chegou | — |
 * | `senha-exigida.ts` | o portao, e os dois interceptadores do pedido REST | `post-template.php:882` · `class-wp-rest-posts-controller.php:188` e `:629` |
 * | `atestado-de-senha.ts` | o cookie: nome, dez dias, marca de cifrado e a gravacao sem conferencia | `wp-login.php:760-792` · `default-constants.php:249` |
 * | `formulario-de-senha.ts` | `SCR-011` como dado: campos, mensagens, classes e a deteccao de senha errada | `post-template.php:1779-1848` |
 * | `corpo-protegido.ts` | o corpo, o resumo, o titulo e as classes — o que o portao governa e o que ele nao governa | `post-template.php:319`, `:423`, `:125`, `:531` |
 * | `recusa-de-comentario.ts` | CA-6.5, e a unica peca cujo chamador e de BC-07 | `comment.php:4053` e `:4064` |
 *
 * Nada aqui guarda estado: o atestado de **um** visitante chega por argumento,
 * porque a requisicao corrente e escopo de REQUISICAO (BR-MIGRAR-105,
 * `EXT-CONTEXTO`). Numa feature publica o vazamento apareceria como um visitante
 * recebendo o corpo que outro desbloqueou.
 */

export type {
  FonteDeBytesAleatorios,
  HashDoAtestado,
  OpcoesDoHashDoAtestado,
} from './hash-do-atestado.js';
export {
  ALFABETO_DO_PHPASS,
  BYTES_DA_SEMEADURA,
  cifrarComoPhpass,
  CIFRA_RECUSADA,
  CIFRA_RECUSADA_DE_RECUSA,
  codificarComoPhpass,
  COMPRIMENTO_DA_SEMEADURA,
  COMPRIMENTO_DO_HASH_PORTAVEL,
  COMPRIMENTO_MAXIMO_DA_SENHA,
  criarHashDoAtestado,
  DESLOCAMENTO_DO_EXPOENTE,
  EXPOENTE_DECLARADO_DO_ATESTADO,
  EXPOENTE_MAXIMO,
  EXPOENTE_MINIMO_ACEITO,
  HASH_AUSENTE,
  HASH_DO_ATESTADO_DO_NUCLEO,
  PREFIXO_DO_ATESTADO,
  PREFIXO_PORTAVEL,
  PREFIXO_PORTAVEL_DE_PHPBB,
  semeaduraDoPhpass,
} from './hash-do-atestado.js';

export type {
  ContextoDaSenhaDeConteudo,
  ContextoDaSenhaResolvido,
  EnderecoDoConteudo,
  EnderecoDoSite,
  PodeEditarConteudo,
} from './contexto-de-senha-de-conteudo.js';
export {
  contextoDeSenhaResolvido,
  TETO_DO_SORTEIO,
} from './contexto-de-senha-de-conteudo.js';

export type {
  ConteudoProtegido,
  FiltroDeSenhaExigida,
  OpcoesDoFiltroDoPedidoRest,
  OpcoesDoPortaoDeSenha,
  PedidoDeConteudoProtegido,
} from './senha-exigida.js';
export {
  acessoAoCorpoProtegidoNoPedido,
  CAPACIDADE_DE_EDITAR_CONTEUDO,
  CONTEXTO_DE_EDICAO,
  filtroDeSenhaDoPedidoRest,
  senhaDoConteudoExigida,
} from './senha-exigida.js';

export type {
  AtestadoParaGravar,
  EnvioDeSenhaDeConteudo,
  FiltroDoPrazoDoAtestado,
  OpcoesDaGravacaoDoAtestado,
  ResultadoDaGravacaoDoAtestado,
  ValorNaoTextual,
} from './atestado-de-senha.js';
export {
  CAMINHO_DO_COOKIE_NA_RAIZ,
  DOMINIO_DO_COOKIE_DE_FABRICA,
  esquemaDoDestino,
  ESQUEMA_CIFRADO,
  gravarAtestadoDeSenha,
  hashDoCookie,
  nomeDoCookieDoAtestado,
  PRAZO_DO_ATESTADO_EM_SEGUNDOS,
  PREFIXO_DO_COOKIE_DO_ATESTADO,
  SEGUNDOS_EM_UM_DIA,
  VALOR_NAO_TEXTUAL,
} from './atestado-de-senha.js';

export type {
  CampoDoFormularioDeSenha,
  FiltroDaMensagemDeSenhaInvalida,
  FiltroDoFormularioDeSenha,
  FormularioDeSenha,
  OpcoesDoFormularioDeSenha,
} from './formulario-de-senha.js';
export {
  AVISO_DE_CONTEUDO_PROTEGIDO,
  CAMINHO_DO_ENVIO,
  CAMPO_DA_SENHA,
  CAMPO_DE_ENVIO,
  CAMPO_DE_RETORNO,
  CLASSE_DE_ELEMENTO_DO_BOTAO,
  CLASSE_DE_ERRO_DO_FORMULARIO,
  CLASSE_DO_AVISO_DE_ERRO,
  CLASSE_DO_BOTAO_DE_BLOCO,
  CLASSE_DO_ENVOLTORIO_DO_BOTAO,
  CLASSE_DO_FORMULARIO,
  CONTEXTO_DO_TEXTO_DO_BOTAO,
  ESQUEMA_DO_ENVIO,
  ESTILO_DO_BOTAO_DE_BLOCO,
  MENSAGEM_DE_SENHA_INVALIDA,
  METODO_DO_ENVIO,
  montarFormularioDeSenha,
  PAPEL_DO_AVISO_DE_ERRO,
  PREFIXO_DO_ID_DO_CAMPO,
  PREFIXO_DO_ID_DO_ERRO,
  ROTULO_DA_SENHA,
  TAMANHO_DO_CAMPO_DE_SENHA,
  TEXTO_DO_BOTAO,
} from './formulario-de-senha.js';

export type {
  ClassesDaSenhaNoConteudo,
  ConteudoComCorpo,
  CorpoOuFormulario,
  FiltroDoTituloProtegido,
  OpcoesDaLiberacaoDoCorpo,
} from './corpo-protegido.js';
export {
  AVISO_DE_RESUMO_PROTEGIDO,
  classesDaSenhaNoConteudo,
  CLASSE_DE_IMAGEM_DESTACADA,
  CLASSE_DE_SENHA_EXIGIDA,
  CLASSE_DE_SENHA_INFORMADA,
  corpoOuFormulario,
  FORMATO_DO_TITULO_PROTEGIDO,
  resumoOuAviso,
  tituloComPrefixoDeProtecao,
} from './corpo-protegido.js';

export type {
  ObservadorDeComentarioRecusado,
  OpcoesDaRecusaDeComentario,
  RecusaDeComentarioProtegido,
} from './recusa-de-comentario.js';
export {
  MOTIVO_DE_COMENTARIO_EM_CONTEUDO_PROTEGIDO,
  recusaDeComentarioEmConteudoProtegido,
} from './recusa-de-comentario.js';
