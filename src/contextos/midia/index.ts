/**
 * Modulo de midia — BC-04 de `target_architecture.md`.
 *
 * Feature `006-biblioteca-de-midia`, tarefas fechadas **T001** e **T002**. O que
 * existe aqui e o que as duas entregam: T001, *"o modulo carrega com as portas
 * de dados, de sistema de arquivos e de processamento de imagem declaradas, e os
 * tamanhos de fabrica do legado registrados como dado"*; T002, *"o anexo existe
 * como registro de conteudo com estado herdado, e o metadado que descreve as
 * derivadas e gravado e lido pela porta de dados com a mesma forma do legado"*.
 * **Nenhuma regra de negocio esta implementada.** O envio com validacao de tipo,
 * a heranca de visibilidade, a geracao de derivadas, a reducao na ingestao, o
 * relato de falha, a escolha da derivada, a transformacao, o descarte do arquivo
 * e o contorno do filtro entram nas tarefas delas (T003 em diante), e a leitura
 * obrigatoria de cada uma esta em `./README.md`.
 *
 * A pasta e `contextos/midia/` porque e assim que `target_architecture.md`
 * nomeia BC-04 no esboco de arvore; a feature se chama `006-biblioteca-de-midia`
 * no pacote de specs, e sao a mesma coisa.
 *
 * Duas coisas que este arquivo faz de proposito, as mesmas que o esqueleto de
 * BC-05 faz, e pelos mesmos dois motivos:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO. Por isso as
 *   portas chegam por argumento e nao existe instancia compartilhada neste
 *   arquivo: duas composicoes nao se enxergam, e o armazenamento de cada uma
 *   nasce da porta dela. O unico dado compartilhado e a lista de tamanhos de
 *   fabrica, que e congelada.
 * - **Nao resolve nada no carregamento.** O modulo nao consulta dados, nao toca
 *   disco e nao abre imagem ao ser criado: compor o armazenamento monta nome de
 *   tabela e nada mais. A ordem de arranque e contrato publico (BR-MIGRAR-106,
 *   `EXT-ORDEM`), e trabalho feito na importacao e trabalho fora da ordem.
 *   `modulo.test.ts` afirma as duas coisas.
 */

import {
  criarArmazenamentoDeMidia,
  type ArmazenamentoDeMidia,
} from './armazenamento/index.js';
import type {
  PortaDeDados,
  PortaDeProcessamentoDeImagem,
  PortaDeSistemaDeArquivos,
} from './portas/index.js';
import {
  TAMANHOS_DE_IMAGEM_DE_FABRICA,
  type TamanhoDeImagemDeFabrica,
} from './tamanhos/index.js';

export * from './armazenamento/index.js';
export * from './portas/index.js';
export * from './tamanhos/index.js';

/** As tres portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeMidia {
  readonly dados: PortaDeDados;
  readonly sistemaDeArquivos: PortaDeSistemaDeArquivos;
  readonly processamentoDeImagem: PortaDeProcessamentoDeImagem;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o P4 da constituicao exige, e nenhuma antes da propria tarefa.
 * Hoje ha tres coisas, e nenhuma e operacao: as portas e os tamanhos de
 * fabrica, de T001, e o armazenamento, de T002.
 *
 * A tabela abaixo e o que a secao *Contratos* de `plan.md` lista, com a
 * capacidade que a `spec.md` cobra em cada uma. Ela esta aqui como **pauta**, e
 * nao como promessa de forma: quem fechar cada tarefa escreve a operacao dela e
 * declara a permissao na interface, como BC-05 fez.
 *
 * | operacao | historia | tarefa | permissao, como o pacote a declara |
 * |---|---|---|---|
 * | enviar arquivo | US-1 | T003 | `upload_files`, mais `edit_post` do destino quando ha destino — UC-12 nomeia as duas, CA-1.1 as cobra |
 * | gerar derivadas | US-3 | T007 | o pacote nao declara nenhuma; CA-3.3 pede uma acao explicita para regerar, e quem a expor declara a dela (P4) |
 * | servir derivada | US-6 | T013 | nenhuma: a historia e do visitante, e a rastreabilidade dela aponta UC-01 |
 * | transformar imagem | US-7 | T015 | *"a capacidade de editar aquele anexo"* (CA-7.1), sem que o pacote a nomeie |
 * | restaurar original | US-7 | T015 | a mesma (CA-7.4) |
 * | apagar anexo | US-8 | T017 | `plan.md` registra so o erro *"sem permissao"*, sem nomear capacidade — e o apagamento e **definitivo** (`R3`) |
 * | contornar filtro de tipo | US-9 | T019 | `unfiltered_upload`, que UC-12 nomeia e que **so existe se a instalacao declarar** (CA-9.1, CA-9.2) |
 */
export interface ModuloDeMidia {
  readonly nome: 'midia';
  readonly portas: PortasDeMidia;

  /**
   * A forma de armazenamento do anexo e das derivadas (T002). Le e grava
   * **somente** pela porta de dados.
   *
   * **Nao e operacao, e por isso nao declara permissao:** ele nao decide nada,
   * nao recusa nada e nao autoriza nada. A linha de `tasks.md` e literal —
   * `satisfaz: — (infraestrutura)`.
   */
  readonly armazenamento: ArmazenamentoDeMidia;

  /**
   * Os seis tamanhos de fabrica do legado, na ordem dele (`M2`,
   * BR-MIGRAR-058; CA-3.2).
   *
   * E dado, nao registro: acrescentar tamanho e `add_image_size()`, que e
   * estado de requisicao e nao de modulo. Ver `tamanhos/tamanhos-de-fabrica.ts`.
   */
  readonly tamanhosDeFabrica: readonly TamanhoDeImagemDeFabrica[];
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-MIGRAR-103
 * (`EXT-SUBST`) poe o registro explicito, resolvido antes do primeiro uso, no
 * lugar da redefinicao de funcao global. Trocar uma porta e passar outra
 * implementacao aqui — sem alterar arquivo deste modulo, que e o criterio de
 * "substituivel" que BR-MIGRAR-103 propoe, e que o cenario `@composicao` do
 * teste de paridade desta feature exercita quando substitui a porta de sistema
 * de arquivos por um duplo que registra cada operacao.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou "nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework", porque a ordem de arranque do legado e contrato publico
 * e framework com ciclo de vida proprio disputa com ela.
 */
export function criarModuloDeMidia(portas: PortasDeMidia): ModuloDeMidia {
  return {
    nome: 'midia',
    portas,
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui (`EXT-ORDEM`, BR-MIGRAR-106).
    armazenamento: criarArmazenamentoDeMidia(portas.dados),
    tamanhosDeFabrica: TAMANHOS_DE_IMAGEM_DE_FABRICA,
  };
}
