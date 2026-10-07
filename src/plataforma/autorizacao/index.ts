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
 * | `traducao-de-capacidade.ts` | a forma do `map_meta_cap`, e o encaixe dos 86 casos (T017) |
 * | `revogacao-por-constante.ts` | as **quatro constantes** que retiram poder de quem o tem |
 * | `concessao-por-extensao.ts` | as **quatro capacidades** que nenhum papel concede, e o ponto de prioridade `1` que as concede (T019) |
 * | `decisao-de-capacidade.ts` | a pergunta, e a **ordem** dos sete passos |
 * | `quem-tem-capacidade.ts` | CA-7.4, em dois passos: o que o armazenamento alcanca e o que a decisao confirma |
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
