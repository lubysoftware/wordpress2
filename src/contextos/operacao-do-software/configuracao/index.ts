/**
 * Os pontos de configuracao nomeados desta feature, com os valores de fabrica
 * do legado.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`: *"os pontos de
 * configuracao que guardam falha de atualizacao automatica, politica de
 * atualizacao e sessao de recuperacao existem com os valores de fabrica do
 * legado e sao lidos e gravados pela porta de dados"*. `satisfaz: —
 * (infraestrutura)`: **T002 nao fecha criterio de aceite de nenhuma historia e
 * nao implementa regra de negocio nenhuma.**
 *
 * O **P6** da constituicao cobra exatamente esta forma: *"cada numero vive num
 * ponto de configuracao nomeado, com o valor de fabrica do legado, e existe
 * teste que afirma o valor e o efeito da borda"*. Por isso nenhum arquivo desta
 * feature le `3600`, `86400`, `604800`, `'enabled'` ou `'unset'` de dentro de
 * uma expressao: tudo passa por aqui, e `configuracao.test.ts` afirma valor e
 * borda de cada um.
 *
 * | grupo | arquivo | o que a tarefa nomeia |
 * |---|---|---|
 * | falha da atualizacao automatica | `estado-de-atualizacao.ts` | `auto_core_update_failed` e `auto_core_update_notified`, as duas opcoes de rede |
 * | politica de atualizacao | `politica-de-atualizacao.ts` | as 3 opcoes, as 2 constantes, os 4 pontos de extensao e a precedencia de `A3` |
 * | sessao de recuperacao | `sessao-de-recuperacao.ts` | as 5 opcoes, os 2 prazos, os 4 comprimentos e os 3 pontos de extensao |
 * | as unidades de tempo | `prazos.ts` | de onde sai todo prazo acima |
 *
 * ── OS TRES GRUPOS, E SO ELES ──────────────────────────────────────────────
 *
 * A tarefa nomeia tres, e a secao *Modelo de dados* do `plan.md` tem **seis**
 * linhas. As outras tres nao estao aqui, e nao e esquecimento:
 *
 * - **versao do esquema** (`db_version`) e de **T013** (US-6): e o numero que
 *   dispara a migracao, e a migracao e por comparacao de estrutura.
 * - **marcador de manutencao** e de **T009** (US-4): o plano e explicito —
 *   *"continua no sistema de arquivos, porque precisa valer mesmo com o banco
 *   em migracao"* —, logo ele **nao e lido nem gravado pela porta de dados**,
 *   que e a condicao da entrega desta tarefa. O formato do arquivo e os 10
 *   minutos que vencem a manutencao presa
 *   (`wp-includes/load.php:444` e `:447`) nascem com CA-4.4.
 * - **extensoes pausadas** aparece aqui, e nao como quarta linha, porque o
 *   plano a poe como parte da **sessao de recuperacao**: o nome da opcao carrega
 *   o identificador da sessao, e e por isso que ela e configuracao da sessao e
 *   nao do site.
 *
 * ── NADA AQUI DECIDE, E NADA AQUI SE RESOLVE NO CARREGAMENTO ───────────────
 *
 * {@link criarConfiguracaoDeOperacaoDoSoftware} recebe os dois repositorios de
 * opcao e devolve objeto: **nenhuma consulta sai, nenhuma opcao e lida**
 * (`EXT-ORDEM`, BR-MIGRAR-106, e a tabela *Nao negociavel* da constituicao poe a
 * ordem de arranque como contrato publico). E nenhum destes pontos guarda estado
 * de modulo (`EXT-CONTEXTO`, BR-MIGRAR-105): o escopo de rede chega por
 * argumento em cada chamada de opcao de rede.
 *
 * ── 🔴 E UM CONFLITO QUE T002 ENCONTROU E NAO RESOLVEU ─────────────────────
 *
 * O valor de fabrica de `auto_update_core_major` e `'enabled'` no instalador e
 * `'unset'` na leitura, as duas coisas com ancora no legado. T002 declara as
 * duas e **nao escolhe** — a analise completa esta no cabecalho de
 * `politica-de-atualizacao.ts` e no `README.md` deste modulo, secao *O que T002
 * encontrou aberto*.
 */

import type {
  RepositorioDeOpcoesDeRede,
  RepositorioDeOpcoesDoSite,
} from '../armazenamento/index.js';
import {
  criarEstadoDeAtualizacao,
  type EstadoDeAtualizacao,
} from './estado-de-atualizacao.js';
import {
  criarPoliticaDeAtualizacao,
  type PoliticaDeAtualizacao,
} from './politica-de-atualizacao.js';
import {
  criarSessaoDeRecuperacao,
  type SessaoDeRecuperacao,
} from './sessao-de-recuperacao.js';

export interface ConfiguracaoDeOperacaoDoSoftware {
  /** `auto_core_update_failed` e `auto_core_update_notified` (opcao de rede). */
  readonly estadoDeAtualizacao: EstadoDeAtualizacao;
  /** As tres opcoes de `auto_update_core_*`, com a precedencia de `A3`. */
  readonly politicaDeAtualizacao: PoliticaDeAtualizacao;
  /** As cinco opcoes da sessao de recuperacao, por site e de rede. */
  readonly sessaoDeRecuperacao: SessaoDeRecuperacao;
}

export function criarConfiguracaoDeOperacaoDoSoftware(
  opcoesDoSite: RepositorioDeOpcoesDoSite,
  opcoesDeRede: RepositorioDeOpcoesDeRede,
): ConfiguracaoDeOperacaoDoSoftware {
  return {
    estadoDeAtualizacao: criarEstadoDeAtualizacao(opcoesDeRede),
    politicaDeAtualizacao: criarPoliticaDeAtualizacao(opcoesDeRede),
    sessaoDeRecuperacao: criarSessaoDeRecuperacao(opcoesDoSite, opcoesDeRede),
  };
}

export {
  SEGUNDOS_POR_DIA,
  SEGUNDOS_POR_HORA,
  SEGUNDOS_POR_MINUTO,
  SEGUNDOS_POR_SEMANA,
} from './prazos.js';

export {
  criarEstadoDeAtualizacao,
  registroDeAvisoDaAtualizacao,
  registroDeFalhaComum,
  registroDeFalhaCritica,
  SEM_AVISO_ENVIADO,
  SEM_FALHA_REGISTRADA,
  TIPOS_DE_AVISO_DA_ATUALIZACAO,
  type AvisoDaAtualizacao,
  type EstadoDeAtualizacao,
  type FalhaDeAtualizacao,
  type PedidoDeAviso,
  type PedidoDeFalhaComum,
  type PedidoDeFalhaCritica,
} from './estado-de-atualizacao.js';

export {
  AUTOCARREGAMENTO_DA_POLITICA_SEMEADA,
  CANAIS_DE_PRE_LANCAMENTO,
  CANAL_SO_DE_VERSAO_MENOR,
  CONSTANTE_DA_POLITICA_DO_NUCLEO,
  CONSTANTE_QUE_DESLIGA_A_AUTOMACAO,
  criarPoliticaDeAtualizacao,
  POLITICA_DESLIGADA,
  POLITICA_LIGADA,
  POLITICA_NA_AUSENCIA_DA_OPCAO,
  POLITICA_NAO_DECLARADA,
  POLITICA_SEM_ESCOLHA,
  POLITICA_SEMEADA_NA_INSTALACAO,
  PONTO_DE_EXTENSAO_QUE_DESLIGA_A_AUTOMACAO,
  PONTOS_DE_EXTENSAO_DA_POLITICA,
  resolverPoliticaDeAtualizacao,
  type DeclaracaoDeAtualizacaoDoNucleo,
  type OpcoesDaPoliticaDeAtualizacao,
  type PoliticaDeAtualizacao,
  type PoliticaDeAtualizacaoResolvida,
} from './politica-de-atualizacao.js';

export {
  ACAO_DE_SAIR_DA_RECUPERACAO,
  COMPRIMENTO_DA_CHAVE_DE_RECUPERACAO,
  COMPRIMENTO_DO_ALEATORIO_DO_COOKIE,
  COMPRIMENTO_DO_SEGREDO_DE_ASSINATURA,
  COMPRIMENTO_DO_TOKEN_DE_RECUPERACAO,
  CONSTANTE_DA_SESSAO_DE_RECUPERACAO,
  CONSTANTE_DO_COOKIE_DE_RECUPERACAO,
  criarSessaoDeRecuperacao,
  EVENTO_DE_LIMPEZA_DE_CHAVES_DE_RECUPERACAO,
  LIMITE_ENTRE_AVISOS_DE_RECUPERACAO_EM_SEGUNDOS,
  MARCA_ASSINADA_DO_COOKIE_DE_RECUPERACAO,
  PARTES_DO_COOKIE_DE_RECUPERACAO,
  PONTO_DE_EXTENSAO_DO_LIMITE_DE_AVISO,
  PONTO_DE_EXTENSAO_DO_PRAZO_DO_COOKIE,
  PONTO_DE_EXTENSAO_DO_PRAZO_DO_LINK,
  prazoDoLinkDeRecuperacao,
  PRAZO_DO_COOKIE_DE_RECUPERACAO_EM_SEGUNDOS,
  PREFIXO_DO_COOKIE_DE_RECUPERACAO,
  registroDeChavesDeRecuperacao,
  registroDeExtensoesPausadas,
  SEM_CHAVES_DE_RECUPERACAO,
  SEM_EXTENSAO_PAUSADA,
  TIPO_DE_EXTENSAO_PLUGIN,
  TIPO_DE_EXTENSAO_TEMA,
  type ChaveDeRecuperacaoGravada,
  type ExtensaoPausada,
  type ExtensoesPausadas,
  type SessaoDeRecuperacao,
} from './sessao-de-recuperacao.js';
