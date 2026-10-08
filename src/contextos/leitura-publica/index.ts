/**
 * Modulo de leitura publica — feature `004-leitura-publica`, epico EP-4.
 *
 * Esqueleto da tarefa T001. O que existe aqui e o que T001 entrega: o modulo
 * carrega com a porta de dados declarada, resolve o endereco pedido para um
 * conjunto vazio de criterios e devolve a resposta de endereco inexistente. A
 * tabela de regras de traducao (T002), a consulta de conteudo (T003), a
 * hierarquia de modelos (T005), a paginacao (T007), o portao de `post_status`
 * (T009), o 404 do tema (T011), a senha de conteudo (T013), a pre-busca (T015) e
 * a macro textual (T017) entram nas tarefas delas. A leitura obrigatoria de quem
 * pegar a tarefa seguinte e `./README.md`.
 *
 * **Onde este modulo mora, e por que nao numa pasta de `bounded context`.** Esta
 * feature nao e um contexto do desenho: ela atravessa `BC-01` (a consulta e a
 * macro textual), `plataforma/rotas` (a traducao de endereco) e
 * `plataforma/tema` (a hierarquia de modelos), e `target_architecture.md` nao
 * declara mapa de feature para pasta. A pasta leva o nome da feature, como
 * `001-identidade-e-acesso` fez com a dela, por tres razoes: a tarefa nomeia *"o
 * modulo de leitura publica"*; `BC-01` e tambem o destino da feature `002`, que
 * esta sendo construida em paralelo, e duas features escrevendo a mesma pasta e
 * conflito de merge, nao arquitetura; e a escolha nao muda nada do que o teste de
 * borda da Opcao 3 mede — *"muda a saida HTTP, o efeito no banco ou o
 * comportamento de caso de uso?"*. Consolidar as pastas no desenho de
 * `target_architecture.md` e trabalho de quem tiver as 15 features na mao, e ele
 * e reversivel: nenhum nome publico depende do caminho do arquivo.
 *
 * Duas coisas que este arquivo faz de proposito, as mesmas que o esqueleto da
 * feature 001:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente, conexao e requisicao no escopo da
 *   REQUISICAO. Por isso as portas chegam por argumento e nao existe instancia
 *   compartilhada neste arquivo: duas composicoes nao se enxergam. Numa feature
 *   publica isso e mais grave do que parece — o vazamento apareceria como um
 *   visitante recebendo a pagina resolvida para outro.
 * - **Nao resolve nada no carregamento.** O modulo nao consulta dados ao ser
 *   criado. A ordem de arranque e contrato publico (BR-MIGRAR-106,
 *   `EXT-ORDEM`), e trabalho feito na importacao e trabalho fora da ordem.
 */

import type { PortaDeDados } from './portas/index.js';
import {
  atenderLeituraPublica,
  type AtendimentoDaLeitura,
  type OpcoesDoAtendimento,
} from './requisicao/atender-leitura-publica.js';
import type { EnderecoPedido } from './requisicao/endereco-pedido.js';
import {
  resolverEndereco,
  type OpcoesDaResolucao,
  type ResolucaoDeEndereco,
} from './requisicao/resolver-endereco.js';
import {
  situacaoDaResposta,
  type OpcoesDaSituacao,
  type RespostaDaLeitura,
} from './requisicao/situacao-da-resposta.js';

export * from './portas/index.js';
export * from './requisicao/endereco-pedido.js';
export * from './requisicao/resolver-endereco.js';
export * from './requisicao/situacao-da-resposta.js';
export * from './requisicao/atender-leitura-publica.js';

/** As portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeLeituraPublica {
  readonly dados: PortaDeDados;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o P4 da constituicao exige, e nenhuma antes da propria tarefa.
 *
 * | operacao | historia | tarefa | permissao exigida |
 * |---|---|---|---|
 * | `resolverEndereco` | — (infraestrutura) | T001 | **nenhuma capacidade**, declarada |
 * | `situacaoDaResposta` | — (infraestrutura) | T001 | **nenhuma capacidade**, declarada |
 * | `atender` | — (infraestrutura) | T001 | **nenhuma capacidade**, declarada |
 *
 * **As tres declaram "nenhuma", e nesta feature isso e a regra e nao a
 * ausencia dela.** UC-01 e literal: *"nao ha verificacao de capacidade. O portao
 * e o `post_status`"* — o ator e o visitante, que por definicao nao tem papel. As
 * duas unicas portas de autorizacao desta feature chegam depois, e nenhuma delas
 * e uma capacidade perguntada aqui: o portao de `post_status` em T009 (US-4), que
 * pergunta `read_private_posts` ou a capacidade de edicao **sobre o conteudo**, e
 * o atestado de senha de conteudo em T013 (US-6), que e um dos cinco pontos que
 * BR-MIGRAR-098 (`PERM-12`) registra como decidindo acesso **sem consultar o
 * modelo de capacidades**.
 */
export interface ModuloDeLeituraPublica {
  readonly nome: 'leitura-publica';
  readonly portas: PortasDeLeituraPublica;

  /**
   * Resolve o endereco pedido em criterios de consulta (`parse_request`).
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4) — ver o
   * cabecalho desta interface.
   *
   * O endereco chega por argumento, e nao pela composicao, porque a requisicao
   * corrente e escopo de REQUISICAO (BR-MIGRAR-105).
   */
  resolverEndereco(
    pedido: EnderecoPedido,
    opcoes?: OpcoesDaResolucao,
  ): ResolucaoDeEndereco;

  /**
   * Decide a situacao da resposta (`handle_404`), que hoje e sempre a de
   * endereco inexistente.
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). E mais do que
   * um default aberto: CA-4.4 e CA-5.3 exigem que a resposta de quem nao pode
   * ver seja **indistinguivel** da de conteudo inexistente, logo uma
   * verificacao aqui quebraria os dois criterios.
   */
  situacaoDaResposta(
    resolucao: ResolucaoDeEndereco,
    opcoes?: OpcoesDaSituacao,
  ): RespostaDaLeitura;

  /**
   * Atende uma leitura publica inteira, na ordem do legado (`WP::main`).
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4).
   *
   * A ordem das etapas e contrato publico (BR-MIGRAR-106) e a tabela *Nao
   * negociavel* da constituicao a tira das maos do agente de codificacao: ela
   * esta declarada, com as etapas que faltam e a posicao de cada uma, em
   * `requisicao/atender-leitura-publica.ts`.
   */
  atender(
    pedido: EnderecoPedido,
    opcoes?: OpcoesDoAtendimento,
  ): AtendimentoDaLeitura;
}

/**
 * Compoe o modulo de leitura publica com as portas recebidas.
 *
 * Nao toca em porta nenhuma: criar o modulo e so amarrar as dependencias.
 */
export function criarModuloDeLeituraPublica(
  portas: PortasDeLeituraPublica,
): ModuloDeLeituraPublica {
  return {
    nome: 'leitura-publica',
    portas,
    resolverEndereco,
    situacaoDaResposta,
    atender: atenderLeituraPublica,
  };
}
