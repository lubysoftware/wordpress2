/**
 * `plataforma/autorizacao/` — a **decisao** de capacidade.
 *
 * Entrega de **T015** da feature `001-identidade-e-acesso`: *"decidir toda
 * autorizacao por capacidade, com papel como agrupamento de dados"* (US-7).
 *
 * `target_architecture.md` separa esta pasta de BC-05 em uma linha: aqui mora *"a
 * **decisao** de capacidade e a traducao de capacidade sobre objeto
 * (`map_meta_cap`)"*, dividida de `capacidades-e-papeis` por ser dependencia de 48
 * dos 71 modulos. O **dado** do papel fica em
 * `contextos/identidade-e-acesso/armazenamento/`, e a ponte entre os dois e
 * {@link FonteDeAutorizacao} — declarada aqui embaixo, implementada la em cima,
 * porque a regra de dependencia 2 proibe o contrario.
 *
 * `target_domain_model.md` classifica isto como `POL-Autorizacao`, **politica e
 * nao aggregate**: *"e decisao, nao entidade: chamada 1.279 vezes em 224 arquivos.
 * Modela-la como aggregate criaria um aggregate consultado por todos os outros"*.
 * Por isso nao ha objeto com estado nesta pasta: ha funcoes que recebem o contexto
 * da requisicao e devolvem booleano.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `capacidade.ts` | capacidade, concessao, matriz e as **duas sinteticas** |
 * | `contexto-de-autorizacao.ts` | quem pergunta, com que matriz, em que instalacao — tudo por argumento |
 * | `capacidades-do-ator.ts` | o `allcaps`: papeis fundidos, individuais por cima |
 * | `traducao-de-capacidade.ts` | a forma do `map_meta_cap`, e o encaixe dos 86 casos |
 * | `revogacao-por-constante.ts` | as **quatro constantes** que retiram poder de quem o tem |
 * | `concessao-por-extensao.ts` | as **quatro capacidades** que nenhum papel concede, e o ponto de prioridade `1` que as concede (T019) |
 * | `decisao-de-capacidade.ts` | a pergunta, e a **ordem** dos sete passos |
 * | `quem-tem-capacidade.ts` | CA-7.4, em dois passos: o que o armazenamento alcanca e o que a decisao confirma |
 * | `catalogo-de-capacidades.ts` | CA-7.5, a conferencia — e o que ela **nao** fecha |
 * | `conteudo-na-autorizacao.ts` | **T017**: o que o mapeamento le do conteudo, como porta |
 * | `traducao-de-conteudo.ts` | **T017**: a resolucao por autoria e por estado do objeto (US-8) |
 * | `conta-na-autorizacao.ts` | **T023**: as tres leituras que os `case` de conta fazem, como porta |
 * | `traducao-de-conta.ts` | **T023**: os cinco `case` de conta, inclusive a lista vazia de si mesmo (US-11) |
 *
 * **O que esta pasta nao tem, e de proposito:** os `case` de objeto que nao sao de
 * conteudo nem de conta — termo, comentario, metadado, senha de aplicacao, rede —,
 * cada um na feature do seu objeto; as quatro capacidades que o legado concede so
 * por ponto de extensao (US-9 / T019); os dez atalhos de nomenclatura de `PERM-6`
 * (chegam com os casos deles); e o recorte de rede de `PERM-10` — este ultimo com a
 * consequencia declarada em `revogacao-por-constante.ts`.
 * | `catalogo-de-capacidades.ts` | CA-7.5 e CA-9.3, a conferencia — e o que ela **nao** fecha |
 *
 * **O que esta pasta nao tem, e de proposito:** os 86 casos de traducao de
 * capacidade sobre objeto (US-8 / T017), os dez atalhos de nomenclatura de
 * `PERM-6` (chegam com os casos deles) e o recorte de rede de `PERM-10` — este
 * ultimo com a consequencia declarada em `revogacao-por-constante.ts`. E o
 * **barramento** que dispararia os pontos de extensao continua fora: `REQ-162`
 * esta em `do-not-rewrite.md`, e por isso a prioridade `1` de T019 e cumprida pela
 * posicao na ordem da decisao, com o numero declarado em
 * `concessao-por-extensao.ts`.
 */

export {
  CAPACIDADES_SINTETICAS,
  CAPACIDADE_CONCEDIDA_A_TODOS,
  CAPACIDADE_NEGADA,
  capacidadesDoPapel,
  papeisQueConcedem,
  temPapel,
  type Capacidade,
  type ConcessaoDeCapacidade,
  type MatrizDePapeis,
  type PapelDeclarado,
} from './capacidade.js';

export {
  ATOR_ANONIMO,
  REDE_INATIVA_NA_AUTORIZACAO,
  comAtor,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type ContextoDeAutorizacao,
  type EstadoDaRedeNaAutorizacao,
  type GanchosDeAutorizacao,
} from './contexto-de-autorizacao.js';

export { capacidadesDoAtor, papeisDoAtor } from './capacidades-do-ator.js';

export {
  traduzirCapacidade,
  type CasoDeTraducao,
  type PedidoDeTraducao,
} from './traducao-de-capacidade.js';

export {
  CONSTANTES_DE_FABRICA,
  capacidadesAlcancadasPorConstante,
  revogacaoPorConstante,
  type ConstantesDoServidor,
} from './revogacao-por-constante.js';

export {
  CAPACIDADES_QUE_HABILITAM_O_IDIOMA,
  CONCESSOES_POR_EXTENSAO_DE_FABRICA,
  PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO,
  aplicarConcessoesPorExtensao,
  capacidadesConcedidasPorExtensao,
  type ConcessaoDeclarada,
  type ConcessaoPorExtensao,
  type PedidoDeConcessao,
} from './concessao-por-extensao.js';

export {
  capacidadesExigidas,
  ehSuperAdmin,
  perguntarPermissao,
} from './decisao-de-capacidade.js';

export {
  atorDeAutorizacao,
  type FonteDeAutorizacao,
} from './fonte-de-autorizacao.js';

export {
  candidatosComCapacidade,
  quemTemCapacidade,
} from './quem-tem-capacidade.js';

export {
  capacidadesDaMatriz,
  capacidadesDeclaradas,
  capacidadesDeclaradasPorRegra,
  capacidadesExigidasSemDeclaracao,
  conferirMatrizDeclarada,
  type ConferenciaDaMatriz,
} from './catalogo-de-capacidades.js';

export {
  CHAVE_DO_ESTADO_ANTERIOR_NA_LIXEIRA,
  ESTADOS_PUBLICADOS,
  ESTADO_DE_LIXEIRA,
  ESTADO_PRIVADO,
  OPCAO_DA_PAGINA_DE_CONTEUDOS,
  OPCAO_DA_PAGINA_DE_POLITICA,
  OPCAO_DA_PAGINA_INICIAL,
  TIPO_DE_REVISAO,
  type AvisoDeUsoIndevido,
  type ConteudoNaAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type RelatorDeUsoIndevido,
  type TipoDeConteudoNaAutorizacao,
} from './conteudo-na-autorizacao.js';

export { type FonteDeContaNaAutorizacao } from './conta-na-autorizacao.js';

export {
  CAPACIDADES_DE_EDICAO_DE_CONTA,
  CAPACIDADES_DE_EXCLUSAO_DE_CONTA,
  CAPACIDADES_DE_PROMOCAO_DE_CONTA,
  CAPACIDADE_DE_ADMINISTRACAO_DE_CONTAS_DA_REDE,
  CAPACIDADE_DE_CRIACAO_DE_CONTAS,
  CAPACIDADE_DE_EDICAO_DE_CONTA,
  CAPACIDADE_DE_EDICAO_DE_CONTAS,
  CAPACIDADE_DE_EXCLUSAO_DE_CONTAS,
  CAPACIDADE_DE_PROMOCAO_DE_CONTAS,
  CAPACIDADE_DE_REMOCAO_DE_CONTA,
  CAPACIDADE_DE_REMOCAO_DE_CONTAS,
  casoDeConta,
} from './traducao-de-conta.js';

export {
  CAPACIDADE_DA_PAGINA_ESPECIAL,
  CAPACIDADE_DE_PRIVACIDADE,
  CAPACIDADE_DE_PRIVACIDADE_EM_REDE,
  CAPACIDADE_DE_PRIVACIDADE_FORA_DA_REDE,
  CAPACIDADE_MAIS_ALTA,
  capacidadesDePrivacidade,
  casoDeConteudo,
  traducaoDePrivacidade,
} from './traducao-de-conteudo.js';
