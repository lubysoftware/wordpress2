/**
 * Modulo de leitura publica — feature `004-leitura-publica`, epico EP-4.
 *
 * Tarefas fechadas aqui: **T001** (o esqueleto — a porta de dados, a ordem das
 * etapas do atendimento e a resposta de endereco inexistente), **T002** (a
 * tabela de regras de traducao como dado, o casamento do endereco contra ela e a
 * coleta dos criterios diretos, em `./traducao-de-endereco/`), **T003** (US-1:
 * a resolucao do endereco numa consulta de conteudo, em `./consulta/`, com os
 * tres ramos de excecao do `handle_404`) e **T005** (US-2: a hierarquia
 * declarada de modelos e a etapa 5 do atendimento, em `./apresentacao/`). A
 * paginacao (T007), o portao de `post_status` (T009), o 404 do tema (T011), a
 * senha de conteudo (T013), a pre-busca (T015) e a macro textual (T017) entram
 * nas tarefas delas. A leitura obrigatoria de quem pegar a tarefa seguinte e
 * `./README.md`.
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

import {
  escolherApresentacao,
  type ApresentacaoEscolhida,
  type OpcoesDaApresentacao,
} from './apresentacao/escolher-apresentacao.js';
import {
  consultarConteudo,
  type ConsultaDeConteudo,
  type OpcoesDaConsultaDeConteudo,
} from './consulta/consultar-conteudo.js';
import type { CriteriosDaConsulta } from './consulta/criterios-da-consulta.js';
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
export * from './traducao-de-endereco/index.js';
export * from './consulta/index.js';
export * from './apresentacao/index.js';
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
 * | `consultarConteudo` | **US-1** | T003 | **nenhuma capacidade**, declarada |
 * | `escolherApresentacao` | **US-2** | T005 | **nenhuma capacidade**, declarada |
 *
 * **As cinco declaram "nenhuma", e nesta feature isso e a regra e nao a
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
   *
   * T002 **nao acrescentou operacao** a esta superficie: ela acrescentou a
   * tabela de regras e o `extra_query_vars` as opcoes desta, porque no legado as
   * duas coisas sao argumento e leitura de `parse_request`, e nao funcao
   * separada. A tabela acima cresce na tarefa de cada historia, nunca antes.
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
   * Resolve os criterios numa consulta de conteudo (`WP_Query::query`), que e a
   * etapa 3 do atendimento e a entrega de **US-1**.
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4) — ver o
   * cabecalho desta interface. O portao de `post_status` (T009) age **dentro**
   * do recorte que esta operacao entrega ao repositorio, nao antes dela.
   *
   * ⚠️ Nao recebe o endereco: recebe os **criterios**, que e o que US-1 cobra em
   * CA-1.2 — *"os mesmos criterios podem ser informados diretamente, sem
   * endereco amigavel, e produzem o mesmo resultado"*. A equivalencia entre as
   * duas entradas e uma propriedade desta assinatura, e nao um teste.
   *
   * O repositorio de conteudo chega no contexto, por ligacao tardia: `posts` e
   * tabela de BC-01 e a regra de dependencia 3 proibe o `import`.
   */
  consultarConteudo(
    criterios: CriteriosDaConsulta,
    opcoes?: OpcoesDaConsultaDeConteudo,
  ): ConsultaDeConteudo;

  /**
   * Escolhe a apresentacao do resultado da consulta pela hierarquia declarada
   * de modelos (`wp-includes/template-loader.php`), que e a entrega de
   * **US-2**.
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4) — ver o
   * cabecalho desta interface. O unico `current_user_can()` de
   * `template-loader.php` esta no ramo de **inclusao** (`:133`), que nao e desta
   * tarefa, e ele nao decide a apresentacao: decide se quem pode trocar tema ve
   * os erros do tema.
   *
   * ⚠️ **Nao e etapa de `atender`**, e isso e fidelidade e nao desenho:
   * `wp-blog-header.php` chama `wp()` (`:16`) e so depois carrega
   * `template-loader.php` (`:19`), ja fora de `WP::main()` e depois da acao
   * `wp`. O que `atender` acrescentou em T005 e a etapa 5, `register_globals`,
   * cujo resultado esta em `AtendimentoDaLeitura.publicacao`.
   *
   * Recebe a consulta, e nao o endereco nem a publicacao: o legado le
   * `$wp_query` por dezessete predicados e dois criterios, e nada do endereco
   * original.
   */
  escolherApresentacao(
    consulta: ConsultaDeConteudo,
    opcoes?: OpcoesDaApresentacao,
  ): ApresentacaoEscolhida;

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
    consultarConteudo,
    escolherApresentacao,
    atender: atenderLeituraPublica,
  };
}
