/**
 * Barril da area de despacho — o formato de esquema de rota, o registro de
 * rotas, as duas camadas de registro e o despachante que carrega o registro.
 *
 * Entrega de **T001** (o registro e o despachante) e **T002** (o formato, o ato
 * de registrar e a validacao de parametro declarada e vazia). O casamento de
 * caminho e metodo (T003) e a validacao de parametro de verdade (T005) entram
 * nesta pasta, nas tarefas delas.
 *
 * ⚠️ **Sao duas camadas de registro, e a diferenca e observavel:**
 * {@link criarRegistroDeRotas} devolve o `registrar` do **metodo**, que nao
 * confere nada, e {@link registrarRotaDeApi} e a **funcao**, que confere seis
 * coisas e avisa — inclusive a declaracao de permissao ausente, sem recusar o
 * registro. Ver `./registro-de-rota-de-api.ts`.
 */

export {
  ATALHOS_DE_METODO,
  FORMATOS_RECONHECIDOS_NO_ESQUEMA,
  FUNCAO_DO_AVISO_DE_PERMISSAO_NAO_DECLARADA,
  OPCAO_DO_ESPACO_DE_NOME,
  PADROES_DO_TRATADOR_NA_FUNCAO_DE_REGISTRO,
  PADROES_DO_TRATADOR_NO_LEITOR,
  PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS,
  TIPOS_RECONHECIDOS_NO_ESQUEMA,
  VERSAO_DO_AVISO_DE_PERMISSAO_NAO_DECLARADA,
  avisoDePermissaoNaoDeclarada,
  normalizarMetodos,
  normalizarTratador,
  type ArgumentosDaRota,
  type DeclaracaoDeOpcaoDeRota,
  type DeclaracaoDeRota,
  type EsquemaDeArgumento,
  type EsquemaDeValor,
  type EsquemaDosArgumentos,
  type FormatoReconhecidoNoEsquema,
  type FuncaoDaRota,
  type MetodosNormalizados,
  type NomeDeFormatoNoEsquema,
  type NomeDeTipoNoEsquema,
  type OpcoesDeclaradasDaRota,
  type PalavraChaveDeEsquemaPublicada,
  type PermissaoDaRota,
  type RequisicaoDeRota,
  type SanitizacaoDeArgumento,
  type TipoReconhecidoNoEsquema,
  type TratadorDeRota,
  type ValidacaoDaRequisicao,
  type ValidacaoDeArgumento,
} from './esquema-de-rota.js';

export {
  conferirParametros,
  conferirValor,
  type ConferenciaDeParametros,
  type ParametroRecusado,
} from './validacao-de-parametro.js';

export {
  criarRegistroDeRotas,
  declaracaoDoIndiceDeEspacoDeNome,
  type MapaDeRotas,
  type OpcoesDaRota,
  type RegistroDeRotas,
} from './registro-de-rotas.js';

export {
  FUNCAO_DE_REGISTRO_DE_ROTA_DE_API,
  GANCHO_DE_REGISTRO_DE_ROTA,
  avisoDeArgumentoQueNaoEVetor,
  avisoDeCaminhoVazio,
  avisoDeEspacoDeNomeComBarra,
  avisoDeEspacoDeNomeVazio,
  avisoDeRegistroForaDoGancho,
  registrarRotaDeApi,
  type ArgumentosDeRegistroDeRota,
  type PedidoDeRegistroDeRotaDeApi,
} from './registro-de-rota-de-api.js';

export {
  criarDespachanteDeRotas,
  type DespachanteDeRotas,
} from './despachante-de-rotas.js';
