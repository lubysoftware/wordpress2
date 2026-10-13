/**
 * Modulo de leitura publica — feature `004-leitura-publica`, epico EP-4.
 *
 * Tarefas fechadas aqui: **T001** (o esqueleto — a porta de dados, a ordem das
 * etapas do atendimento e a resposta de endereco inexistente), **T002** (a
 * tabela de regras de traducao como dado, o casamento do endereco contra ela e a
 * coleta dos criterios diretos, em `./traducao-de-endereco/`), **T003** (US-1:
 * a resolucao do endereco numa consulta de conteudo, em `./consulta/`, com os
 * tres ramos de excecao do `handle_404`), **T005** (US-2: a hierarquia
 * declarada de modelos e a etapa 5 do atendimento, em `./apresentacao/`),
 * **T013** (US-6: o portao de senha de conteudo, o atestado de dez dias, o
 * formulario e a recusa do comentario, em `./senha-de-conteudo/`), **T015**
 * (US-7: a declaracao de pre-busca do proximo destino, em `./pre-busca/`) e
 * **T017** (US-8: a expansao de macro textual no corpo, em `./macro-textual/`).
 * A paginacao (T007), o portao de `post_status` (T009) e o 404 do tema (T011)
 * entram nas tarefas delas. A leitura obrigatoria de quem pegar a tarefa
 * seguinte e `./README.md`.
 *
 * **Onde este modulo mora, e por que nao numa pasta de `bounded context`.** Esta
 * feature nao e um contexto do desenho: ela atravessa `BC-01` (a consulta e a
 * macro textual), `plataforma/rotas` (a traducao de endereco),
 * `plataforma/tema` (a hierarquia de modelos) e `BC-07` (a pre-busca, que
 * `topology_decision.md` funde em `BC-07-apresentacao`), e
 * `target_architecture.md` nao declara mapa de feature para pasta. A pasta leva o nome da feature, como
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
import {
  expandirMacros,
  type ExpansaoDeMacros,
  type OpcoesDaExpansao,
} from './macro-textual/expandir-macros.js';
import type { PortaDeDados } from './portas/index.js';
import {
  declararPreBusca,
  type DeclaracaoDaPreBusca,
  type OpcoesDaPreBusca,
} from './pre-busca/declarar-pre-busca.js';
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
import {
  gravarAtestadoDeSenha,
  type EnvioDeSenhaDeConteudo,
  type OpcoesDaGravacaoDoAtestado,
  type ResultadoDaGravacaoDoAtestado,
} from './senha-de-conteudo/atestado-de-senha.js';
import {
  corpoOuFormulario,
  type ConteudoComCorpo,
  type CorpoOuFormulario,
  type OpcoesDaLiberacaoDoCorpo,
} from './senha-de-conteudo/corpo-protegido.js';
import {
  recusaDeComentarioEmConteudoProtegido,
  type OpcoesDaRecusaDeComentario,
  type RecusaDeComentarioProtegido,
} from './senha-de-conteudo/recusa-de-comentario.js';
import {
  senhaDoConteudoExigida,
  type ConteudoProtegido,
  type OpcoesDoPortaoDeSenha,
} from './senha-de-conteudo/senha-exigida.js';

export * from './portas/index.js';
export * from './traducao-de-endereco/index.js';
export * from './consulta/index.js';
export * from './apresentacao/index.js';
export * from './pre-busca/index.js';
export * from './senha-de-conteudo/index.js';
export * from './macro-textual/index.js';
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
 * | `senhaDoConteudoExigida` | **US-6** | T013 | **nenhuma capacidade**, e aqui isso e a regra |
 * | `liberarCorpoProtegido` | **US-6** | T013 | **nenhuma capacidade**, e aqui isso e a regra |
 * | `gravarAtestadoDeSenha` | **US-6** | T013 | **nenhuma capacidade**, e aqui isso e a regra |
 * | `recusarComentarioEmConteudoProtegido` | **US-6** | T013 | **nenhuma capacidade**, e aqui isso e a regra |
 * | `declararPreBusca` | **US-7** | T015 | **nenhuma capacidade**, declarada |
 * | `expandirMacros` | **US-8** | T017 | **nenhuma capacidade**, declarada |
 *
 * **As onze declaram "nenhuma", e nesta feature isso e a regra e nao a ausencia
 * dela.** UC-01 e literal: *"nao ha verificacao de capacidade. O portao e o
 * `post_status`"* — o ator e o visitante, que por definicao nao tem papel. As
 * duas unicas portas de autorizacao desta feature sao o portao de `post_status`
 * em T009 (US-4), que pergunta `read_private_posts` ou a capacidade de edicao
 * **sobre o conteudo**, e o atestado de senha de conteudo, que **T013 trouxe** e
 * que e um dos cinco pontos que BR-MIGRAR-098 (`PERM-12`) registra como decidindo
 * acesso **sem consultar o modelo de capacidades** — por isso as quatro operacoes
 * de T013 continuam declarando "nenhuma", e a declaracao delas e mais do que
 * formalidade: um porte que acrescentasse capacidade ali fecharia a cara publica
 * do produto.
 *
 * ⚠️ **`declararPreBusca` le `is_user_logged_in()` e isso NAO e excecao a
 * tabela acima.** A pergunta e "ha alguem autenticado", e o legado a usa para
 * **desligar** a pre-busca de quem esta autenticado (`:28`), nunca para
 * conceder acesso a quem quer que seja. Tratar a leitura como camada de
 * autorizacao poria autorizacao numa operacao que nao tem nenhuma; a razao
 * completa esta em `pre-busca/configuracao-da-pre-busca.ts`.
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
   * Declara ao navegador quais destinos podem ser pre-buscados e com que
   * agressividade (`wp-includes/speculative-loading.php:330`), que e a entrega
   * de **US-7**.
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4) — ver o
   * cabecalho desta interface, inclusive a nota sobre `is_user_logged_in()`.
   *
   * ⚠️ **Nao e etapa de `atender` nem de `escolherApresentacao`**, e isso e
   * fidelidade e nao desenho: `default-filters.php:367` a pendura em
   * `wp_footer`, logo ela roda quando o tema emite o rodape — depois de tudo
   * que as outras operacoes de leitura enxergam.
   *
   * 🔴 **Na instalacao de fabrica ela nao declara nada**, porque
   * `permalink_structure` nasce em texto vazio
   * (`wp-admin/includes/schema.php:443`) e a configuracao fica ausente. E o
   * comportamento, nao lacuna — ver `pre-busca/configuracao-da-pre-busca.ts`.
   *
   * Nao recebe a consulta nem o endereco: `speculative-loading.php` nao le
   * `$wp_query` em nenhuma das suas 343 linhas. O que decide a declaracao e a
   * instalacao, e ela chega no contexto.
   */
  declararPreBusca(opcoes?: OpcoesDaPreBusca): DeclaracaoDaPreBusca;

  /**
   * Expande a macro textual no corpo do conteudo (`do_shortcode()`,
   * `wp-includes/shortcodes.php:243`), que e a entrega de **US-8**.
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4) — ver o
   * cabecalho desta interface. Aqui a declaracao e mais forte do que um default
   * aberto: `shortcodes.php` nao tem **uma** chamada de `current_user_can()` em
   * 764 linhas. A unica fronteira de autorizacao que o arquivo toca e
   * `wp_kses_one_attr()`, no caminho de atributo entre aspas, e ela chega por
   * ligacao tardia em `ContextoDaMacro.sanearAtributo` — este modulo nao
   * pergunta capacidade a ninguem, exatamente como o legado.
   *
   * ⚠️ **Recebe texto e devolve texto, e e isso que satisfaz CA-8.3** — *"a
   * expansao acontece na renderizacao, nao na gravacao: o corpo gravado continua
   * com a marca"*. Nao recebe identificador de conteudo, nao recebe a porta de
   * dados e nao tem como gravar. O risco 4 do plano desta feature nomeia o jeito
   * de perder o criterio: expandir na gravacao.
   *
   * ⚠️ **Nao e etapa de `atender` nem de `escolherApresentacao`**, e isso e
   * fidelidade e nao desenho: no legado a expansao e um interceptador de
   * `the_content` com prioridade 11 (`default-filters.php:209`), que roda quando
   * o tema pede o corpo — depois de `wp()` e depois de `template-loader.php`.
   * Quem liga ponto de extensao e o barramento, que nao existe nesta arvore; os
   * quatro pontos em que o legado a liga estao declarados como dado em
   * `LIGACAO_NA_RENDERIZACAO`.
   *
   * O registro de marcas chega nas opcoes, por ligacao tardia: o
   * `$shortcode_tags` do legado e montado no arranque por `media.php` e por
   * `class-wp-embed.php`, que sao de BC-01 e de BC-04, e a regra de dependencia
   * 3 proibe o `import`.
   */
  expandirMacros(corpo: string, opcoes?: OpcoesDaExpansao): ExpansaoDeMacros;

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

  /**
   * `post_password_required()` — o portao de senha de conteudo, entrega de
   * **US-6**.
   *
   * **Permissao exigida: nenhuma capacidade, e aqui a declaracao e o ponto**
   * (P4). E um dos cinco atestados de BR-MIGRAR-098 (`PERM-12`): decide acesso
   * **sem** consultar o modelo de capacidades, e a razao inteira esta em
   * `senha-de-conteudo/senha-exigida.ts`.
   *
   * Esta na superficie porque dois contextos de fora a consultam por ligacao
   * tardia: BC-07 recusa o comentario (CA-6.5) e BC-08 monta feed e mapa do
   * site. A regra de dependencia 3 proibe os dois de importar esta pasta.
   */
  senhaDoConteudoExigida(
    conteudo: ConteudoProtegido,
    opcoes?: OpcoesDoPortaoDeSenha,
  ): boolean;

  /**
   * O corpo, ou o formulario de senha em lugar dele — `get_the_content()` no
   * ponto do portao (`wp-includes/post-template.php:318-321`), entrega de
   * **US-6** (CA-6.1, CA-6.2 e CA-6.3).
   *
   * **Permissao exigida: nenhuma capacidade** (P4).
   */
  liberarCorpoProtegido(
    conteudo: ConteudoComCorpo,
    opcoes?: OpcoesDaLiberacaoDoCorpo,
  ): CorpoOuFormulario;

  /**
   * Grava o atestado de senha — `case 'postpass'` de `wp-login.php:760-792`,
   * entrega de **US-6** (CA-6.2).
   *
   * **Permissao exigida: nenhuma capacidade** (P4): nao ha conta envolvida.
   *
   * ⚠️ O relogio e argumento, e e o **unico** desta area: a leitura do atestado
   * nao recebe relogio nenhum, porque o servidor nunca confere a idade dele
   * (resposta 8 de `questions.md`).
   */
  gravarAtestadoDeSenha(
    envio: EnvioDeSenhaDeConteudo,
    opcoes: OpcoesDaGravacaoDoAtestado,
  ): ResultadoDaGravacaoDoAtestado;

  /**
   * A recusa do comentario em conteudo protegido — `comment.php:4053` e
   * `:4064`, entrega de **US-6** (CA-6.5).
   *
   * **Permissao exigida: nenhuma capacidade** (P4) — as recusas vizinhas da
   * cadeia perguntam `read_post`, esta nao pergunta nada.
   *
   * ⚠️ A **posicao** desta recusa na cadeia de `wp_handle_comment_submission()`
   * e de BC-07, e e contrato: ela e a oitava, depois do ramo de estado. A tabela
   * esta em `senha-de-conteudo/recusa-de-comentario.ts`.
   */
  recusarComentarioEmConteudoProtegido(
    conteudo: ConteudoProtegido,
    opcoes?: OpcoesDaRecusaDeComentario,
  ): RecusaDeComentarioProtegido | undefined;
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
    declararPreBusca,
    expandirMacros,
    atender: atenderLeituraPublica,
    senhaDoConteudoExigida,
    liberarCorpoProtegido: corpoOuFormulario,
    gravarAtestadoDeSenha,
    recusarComentarioEmConteudoProtegido: recusaDeComentarioEmConteudoProtegido,
  };
}
