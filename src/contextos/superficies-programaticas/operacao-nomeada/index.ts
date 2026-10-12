/**
 * Barril da area de operacao nomeada — o formato da *ability* e da categoria
 * dela, e os dois registros que as guardam.
 *
 * Entrega de **T002**, metade do *"os dois formatos existem como declaracao"*.
 * A **execucao** — localizar pelo nome, normalizar e validar o insumo, conferir
 * a permissao, executar, validar a saida e o curto-circuito — e **T013** (US-6),
 * e entra nesta pasta.
 *
 * ⚠️ Nenhuma das tres operacoes do nucleo esta registrada aqui. Elas tem funcao
 * de execucao que le informacao do site, da conta e do ambiente, e sao de T013;
 * `../README.md` diz onde cada uma mora no legado.
 */

export {
  ANOTACOES_PADRAO_DA_OPERACAO,
  CAMPOS_DA_CATEGORIA_DE_OPERACAO,
  CAMPOS_DA_OPERACAO_NOMEADA,
  MENSAGENS_DE_RECUSA_DE_CATEGORIA,
  MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA,
  MOSTRAR_NO_REST_PADRAO_DA_OPERACAO,
  PADRAO_DO_APELIDO_DE_CATEGORIA,
  PADRAO_DO_NOME_DE_OPERACAO,
  PUBLICO_PADRAO_DA_OPERACAO,
  avisoDeCampoDesconhecido,
  avisoDeCampoDesconhecidoNaCategoria,
  ehRecusaDeDeclaracao,
  prepararCategoriaDeOperacao,
  prepararOperacaoNomeada,
  recusaDeDeclaracao,
  type CategoriaDeOperacao,
  type DeclaracaoDeCategoriaDeOperacao,
  type DeclaracaoDeOperacaoNomeada,
  type ExecucaoDaOperacao,
  type InsumoDaOperacao,
  type MetaDaOperacaoNomeada,
  type OperacaoNomeada,
  type PermissaoDaOperacao,
  type RecusaDeDeclaracao,
} from './esquema-de-operacao-nomeada.js';

export {
  MENSAGENS_DE_AVISO_DE_GANCHO_DE_OPERACAO,
  METODOS_DOS_REGISTROS_DE_OPERACAO,
  avisoDeApelidoDeCategoriaInvalido,
  avisoDeCategoriaJaRegistrada,
  avisoDeCategoriaNaoEncontrada,
  avisoDeCategoriaNaoRegistrada,
  avisoDeDeclaracaoDeCategoriaRecusada,
  avisoDeDeclaracaoRecusada,
  avisoDeNomeDeOperacaoInvalido,
  avisoDeOperacaoJaRegistrada,
  avisoDeOperacaoNaoEncontrada,
  criarRegistroDeCategoriasDeOperacao,
  criarRegistroDeOperacoesNomeadas,
  type RegistroDeCategoriasDeOperacao,
  type RegistroDeOperacoesNomeadas,
} from './registro-de-operacoes-nomeadas.js';
