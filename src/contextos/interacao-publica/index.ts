/**
 * Modulo de interacao publica — BC-03 de `target_architecture.md`.
 *
 * Esqueleto da feature `007-interacao-publica-e-moderacao`, tarefa T001. O que
 * existe aqui e o que T001 entrega: o modulo carrega com as **quatro portas**
 * declaradas — dados, relogio, envio de e-mail e cliente externo — e com os
 * **pontos de configuracao de moderacao** criados com os valores de fabrica do
 * legado. **Nenhuma regra de negocio esta implementada.** O comentario e o
 * metadado dele entram em T002, a cascata nomeada e ordenada em T003, e cada
 * historia na tarefa dela (T004 em diante). A leitura obrigatoria de quem pegar
 * a tarefa seguinte esta em `./README.md`.
 *
 * **Por que este contexto existe separado, sendo 1-para-1 com uma tabela.**
 * `target_architecture.md` exige justificativa para contexto que nao funde nada,
 * e a desta e medida: esta e *"a area de maior densidade de regra de negocio do
 * sistema"*, com doze regras **em que a ordem de avaliacao importa e cada etapa
 * pode encerrar a decisao**, devolvendo 409 e 429 na mesma resposta ao
 * visitante. Fundir com `BC-01` dissolveria a ordem — e a ordem **e** a regra.
 *
 * Duas coisas que este arquivo faz de proposito:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO. Aqui isso
 *   tem um cenario de paridade proprio, `@concorrencia`: *"duas submissoes
 *   simultaneas de identidades diferentes nao trocam de decisao... o comentario
 *   do visitante nao recebe o atalho de confianca do moderador"*. O atalho de
 *   confianca de `C3` depende de quem submeteu, e estado de modulo o entregaria
 *   a pessoa errada. Por isso as portas chegam por argumento: duas composicoes
 *   nao se enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados, nao envia e-mail e nao faz chamada externa ao ser criado. A ordem de
 *   arranque e contrato publico (BR-MIGRAR-106, `EXT-ORDEM`), e trabalho feito
 *   na importacao e trabalho fora da ordem.
 */

import {
  LIMITES_DA_MODERACAO_DE_FABRICA,
  OPCOES_DE_MODERACAO_DE_FABRICA,
  type LimitesDaModeracao,
  type OpcoesDeModeracao,
} from './configuracao/index.js';
import type {
  PortaDeClienteExterno,
  PortaDeDados,
  PortaDeEmail,
  PortaDeRelogio,
} from './portas/index.js';

export * from './portas/index.js';
export * from './configuracao/index.js';

/** As quatro portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeInteracaoPublica {
  readonly dados: PortaDeDados;
  readonly relogio: PortaDeRelogio;
  readonly email: PortaDeEmail;
  readonly clienteExterno: PortaDeClienteExterno;
}

/**
 * A configuracao da moderacao desta instalacao, resolvida.
 *
 * As duas metades vem de lugares diferentes do legado e por isso continuam
 * separadas: {@link OpcoesDeModeracao} e o que a instalacao gravou em `options`,
 * e {@link LimitesDaModeracao} e o que o codigo impoe. Ver
 * `configuracao/configuracao-de-moderacao.ts`.
 */
export interface ConfiguracaoDaInteracaoPublica {
  readonly moderacao: OpcoesDeModeracao;
  readonly limites: LimitesDaModeracao;
}

/** O que quem compoe pode informar; o resto fica no valor de fabrica. */
export interface ConfiguracaoParcialDaInteracaoPublica {
  readonly moderacao?: Partial<OpcoesDeModeracao>;
  readonly limites?: Partial<LimitesDaModeracao>;
}

/** A configuracao de uma instalacao nova, com os valores de fabrica do legado. */
export const CONFIGURACAO_DA_INTERACAO_PUBLICA_DE_FABRICA: ConfiguracaoDaInteracaoPublica =
  {
    moderacao: OPCOES_DE_MODERACAO_DE_FABRICA,
    limites: LIMITES_DA_MODERACAO_DE_FABRICA,
  };

/**
 * Resolve a configuracao: o que foi informado vence, e o que nao foi fica no
 * valor de fabrica do legado.
 *
 * E a forma que a resposta 1 de `questions.md` fixa e que o P6 cobra: *"o
 * default do codigo E a especificacao, porque nao existe instalacao cujo
 * comportamento possa divergir dele"*. Informar um ponto nao mexe nos outros, e
 * nao informar nada da a instalacao de fabrica.
 *
 * Nao muta a constante de fabrica: cada chamada devolve objeto novo, e
 * `../modulo.test.ts` afirma isso — uma composicao que vazasse para a constante
 * mudaria o default de todas as outras, que e `EXT-CONTEXTO` pela porta de
 * tras.
 */
export function configuracaoDaInteracaoPublica(
  parcial: ConfiguracaoParcialDaInteracaoPublica = {},
): ConfiguracaoDaInteracaoPublica {
  return {
    moderacao: { ...OPCOES_DE_MODERACAO_DE_FABRICA, ...parcial.moderacao },
    limites: { ...LIMITES_DA_MODERACAO_DE_FABRICA, ...parcial.limites },
  };
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o P4 da constituicao exige, e **nenhuma antes da propria
 * tarefa**. Hoje ha duas coisas, as duas de T001: as portas e a configuracao.
 *
 * As operacoes que vao entrar sao as da tabela *Contratos* do `plan.md`, e a
 * permissao de cada uma ja esta lida dos casos de uso — fica registrada aqui
 * para que nenhuma delas nasca sem declaracao, e para que a tarefa que a
 * escrever nao precise redescobri-la:
 *
 * | operacao | historia | tarefa | permissao exigida |
 * |---|---|---|---|
 * | submeter comentario | US-1 | T004 | **nenhuma capacidade.** UC-14: *"nao e capacidade. Os portoes sao a opcao de exigir conta, a de exigir nome e e-mail, o estado do conteudo e a senha de post"* |
 * | decidir o estado inicial | US-4 | T010 | **nenhuma**, e e decisao interna: `C3` CONSULTA `moderate_comments` para conceder o atalho, o que e o oposto de exigi-la |
 * | moderar | US-10 | T022 | **`edit_comment`, que resolve em `edit_post` do conteudo comentado** (UC-16). Comentario orfao cai em `edit_posts` (CA-10.6) |
 * | descartar para a lixeira | US-11 | T024 | a mesma de moderar |
 * | registrar nota editorial | US-14 | T030 | **a capacidade de editar aquele conteudo, NAO a de moderar** (CA-14.2, `C12`), e exige login (CA-14.1) |
 * | receber notificacao de link | US-15 | T032 | **nenhuma credencial: a autorizacao e a PROVA** (UC-17) |
 * | classificar por servico externo | US-16 | T034 | 🔴 conflito registrado na `spec.md`, nao resolvido |
 * | apagar spam vencido | US-17 | T036 | 🔴 mesmo conflito, e `C13` esta em `discard_log.md` |
 *
 * As duas primeiras declaram *"nenhuma capacidade"* e isso **e** a declaracao
 * que o P4 pede: o default desta superficie e aberto por regra lida do legado, e
 * acrescentar verificacao aqui fecharia o sistema mais que o original.
 */
export interface ModuloDeInteracaoPublica {
  readonly nome: 'interacao-publica';
  readonly portas: PortasDeInteracaoPublica;
  readonly configuracao: ConfiguracaoDaInteracaoPublica;
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-MIGRAR-103
 * (`EXT-SUBST`) poe no lugar das 176 guardas `function_exists` o registro
 * explicito, resolvido antes do primeiro uso. Trocar uma porta e passar outra
 * implementacao aqui — sem alterar arquivo deste modulo, que e o criterio de
 * "substituivel" que aquela regra propoe, e e o que o cenario `@composicao` de
 * paridade exercita ao rodar a cadeia com as portas substituidas por duplo.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework"*, porque a ordem de arranque do legado e contrato
 * publico e framework com ciclo de vida proprio disputa com ela.
 */
export function criarModuloDeInteracaoPublica(
  portas: PortasDeInteracaoPublica,
  configuracao: ConfiguracaoDaInteracaoPublica = CONFIGURACAO_DA_INTERACAO_PUBLICA_DE_FABRICA,
): ModuloDeInteracaoPublica {
  return {
    nome: 'interacao-publica',
    portas,
    configuracao,
  };
}
