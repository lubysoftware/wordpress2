/**
 * Modulo de retencao e descarte — a feature `005-retencao-e-descarte`.
 *
 * Tarefas fechadas aqui: **T001** (o esqueleto — as tres portas e o prazo de
 * retencao), **T002** (os marcadores de lixeira como metadado, em
 * `./armazenamento/`), **T003** (o descarte para a lixeira, US-1, em
 * `./descarte/`) e **T005** (a suspensao dos comentarios em cascata, US-2, em
 * `./cascata-de-comentarios/`). **T009** (US-4) entregou CA-4.1, CA-4.3 e CA-4.4
 * na pasta do descarte e **parou em CA-4.2**, por conflito registrado entre o
 * criterio e UC-09 — a tarefa continua aberta em `tasks.md` e a parada esta em
 * `./descarte/aviso-de-exclusao-definitiva.ts`. Restaurar o conteudo, coletar o
 * que venceu, expirar rascunho automatico, tolerar estado inconsistente e
 * reparentar filhos entram nas tarefas delas (T007 em diante), e a leitura
 * obrigatoria de cada uma esta em `./README.md`.
 *
 * ## A qual bounded context este modulo pertence — e sao dois
 *
 * `target_architecture.md` divide esta feature em duas:
 *
 * - **BC-01 (Conteudo)** e dono do ciclo de vida — *"publicar, agendar, revisar,
 *   **descartar, restaurar, expirar**"* — e da *"cascata de 7 etapas de exclusao
 *   com reparenteamento"*, com as regras `R1`-`R4` e `R6`;
 * - **BC-11 (Operacao do Software)** e dono do **agendamento**, no aggregate
 *   `AGG-TarefaAgendada`, com a regra `A9`.
 *
 * Por isso a fila entra aqui como **porta** e nao como codigo: este modulo e
 * cliente dela. E por isso a pasta leva o nome da **feature**, nao do contexto —
 * a unidade de entrega do pacote e a feature, e `plan.md` declara na secao
 * *Sequencia* que esta depende de `001`, `002` e `011`.
 *
 * ## Duas coisas que este arquivo faz de proposito
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO, e
 *   `target_architecture.md` repete que nenhum modulo pode guarda-los em estado
 *   de modulo. Por isso as portas chegam por argumento e nao existe instancia
 *   compartilhada neste arquivo: duas composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados e nao toca na fila ao ser criado. A ordem de arranque e contrato
 *   publico (BR-MIGRAR-106, `EXT-ORDEM`), e trabalho feito na importacao e
 *   trabalho fora da ordem. Resolver o prazo de retencao e a unica coisa que a
 *   composicao faz, e ela e leitura de argumento com valor de fabrica: nenhuma
 *   porta e tocada.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo de
 * vida de framework"*, porque a ordem de arranque do legado e contrato publico e
 * framework com ciclo de vida proprio disputa com ela.
 */

import {
  criarArmazenamentoDeRetencao,
  type ArmazenamentoDeRetencao,
} from './armazenamento/index.js';
import {
  restaurarComentariosDoConteudo,
  suspenderComentariosDoConteudo,
  type ContextoDaCascataDeComentarios,
  type ResultadoDaRestauracao,
  type ResultadoDaSuspensao,
} from './cascata-de-comentarios/index.js';
import {
  PRAZO_DE_RETENCAO_DE_FABRICA,
  type PrazoDeRetencao,
} from './configuracao/index.js';
import {
  CONFIRMACAO_PEDIDA_AO_ATOR,
  acaoNoEditor,
  acoesEmMassa,
  acoesNaLinha,
  descartar,
  enderecoDeExclusao,
  recusaDeLixeiraNaoSuportadaNaApi,
  type ContextoDeDescarte,
  type PedidoDeDescarte,
  type ResultadoDoDescarte,
} from './descarte/index.js';
import type {
  PortaDeDados,
  PortaDeFilaAgendada,
  PortaDeRelogio,
} from './portas/index.js';

export * from './portas/index.js';
export * from './configuracao/index.js';
export * from './armazenamento/index.js';
export * from './descarte/index.js';
export * from './cascata-de-comentarios/index.js';

/**
 * **US-4, T009**: o que cada superficie oferece e diz ao ator **antes** de a
 * exclusao definitiva acontecer.
 *
 * Nao e operacao e nao escreve nada: e leitura de contrato de tela e de API, e e
 * por isso que entra como um grupo, do mesmo jeito que `armazenamento`. A
 * **capacidade** continua sendo a de US-1 — `delete_post` daquele registro —, e
 * ela chega **respondida**, no campo `podeApagar`: no legado as tres superficies
 * do painel ja estao dentro de `current_user_can( 'delete_post', $post->ID )`
 * (`wp-admin/includes/meta-boxes.php:363`,
 * `class-wp-posts-list-table.php:1613`) e `get_delete_post_link()` pergunta de
 * novo por conta propria, devolvendo `null` a quem nao pode
 * (`wp-includes/link-template.php:1573`).
 *
 * 🔴 **CA-4.2 nao esta aqui, e a falta e deliberada.** `confirmacaoPedidaAoAtor`
 * e a tabela do que o legado pede hoje — **nada**, nas cinco superficies de
 * conteudo —, e o criterio pede o oposto do que UC-09 afirma. A caixa de PARADA
 * esta em `descarte/aviso-de-exclusao-definitiva.ts`.
 */
export interface AvisoDeExclusaoDefinitiva {
  /** `get_delete_post_link()` — a acao da rota e o `nonce` (CA-4.3). */
  readonly enderecoDeExclusao: typeof enderecoDeExclusao;
  /** A unica acao da caixa de publicacao do editor (CA-4.3, CA-4.4). */
  readonly acaoNoEditor: typeof acaoNoEditor;
  /** As acoes da linha da lista, na ordem do legado (CA-4.3, CA-4.4). */
  readonly acoesNaLinha: typeof acoesNaLinha;
  /** As acoes em massa que o descarte decide (CA-4.3, CA-4.4). */
  readonly acoesEmMassa: typeof acoesEmMassa;
  /** 🔴 O que o legado pede ao ator: `null` nas cinco superficies. */
  readonly confirmacaoPedidaAoAtor: typeof CONFIRMACAO_PEDIDA_AO_ATOR;
  /**
   * A **unica** parada do legado antes da exclusao definitiva: a recusa de
   * `501` da API ao `DELETE` sem `force`.
   */
  readonly recusaNaApiSemForca: typeof recusaDeLixeiraNaoSuportadaNaApi;
}

/** As tres portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeRetencaoEDescarte {
  readonly dados: PortaDeDados;
  readonly relogio: PortaDeRelogio;
  readonly filaAgendada: PortaDeFilaAgendada;
}

/**
 * O que a instalacao informa ao modulo.
 *
 * E o equivalente, no alvo, do `define()` em `wp-config.php`: o legado altera
 * `EMPTY_TRASH_DAYS` por constante redefinida **antes** do arranque, nao por opcao
 * e nao por ponto de extensao. Ver `configuracao/prazo-de-retencao.ts`.
 */
export interface OpcoesDeRetencaoEDescarte {
  /** O prazo de retencao da lixeira. Omitido, vale o valor de fabrica: 30 dias. */
  readonly prazoDeRetencao?: PrazoDeRetencao;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o **P4** da constituicao exige, e nenhuma antes da propria tarefa.
 * Hoje ha sete coisas e **tres delas sao operacao**: as portas e o prazo de
 * retencao (T001), o armazenamento dos marcadores (T002), o **descarte** (T003,
 * US-1), a **suspensao** e a **restauracao** dos comentarios em cascata (T005,
 * US-2) e o aviso de exclusao definitiva (T009, US-4). O armazenamento nao
 * declara permissao porque nao decide nada — ele le e grava metadado, e quem
 * cobra a capacidade e a operacao que o chama; o aviso declara a **mesma**
 * capacidade do descarte, e a recebe respondida porque no legado a tela ja a
 * perguntou; e as duas da cascata declaram **nenhuma**, que e o que o legado
 * tem.
 *
 * As operacoes que a tabela *Contratos* de `plan.md` nomeia, com a permissao que o
 * pacote declara para cada uma — a primeira **declarada e construida** por T003,
 * as tres seguintes **citadas, nao decididas aqui**, para que a tarefa que
 * construir cada uma nasca com a declaracao que o P4 cobra:
 *
 * | operacao | historia | tarefa | permissao, como o pacote a declara |
 * |---|---|---|---|
 * | descartar para a lixeira | US-1 | **T003, feita** | `delete_post` do registro, *"resolvida conforme autoria e estado"* (UC-09) |
 * | suspender e restaurar os comentarios em cascata | US-2 | **T005, feita** | **nenhuma.** As duas funcoes do legado nao tem portao e sao publicadas; quem verifica e o chamador |
 * | avisar que apagar nao tem volta | US-4 | **T009, feita menos CA-4.2** | `delete_post` do registro, a mesma — e no legado ela decide se a acao **aparece** |
 * | restaurar | US-3 | T007 | decidida **pelo estado anterior gravado no descarte** (CA-3.5, UC-10) |
 * | apagar em definitivo | US-8 | T017 | `delete_post`, com o reparenteamento de filhos e anexos (UC-09, fluxo alternativo) |
 * | coletar o que venceu | US-5 | T011 | **nenhuma.** UC-11 e literal: *"a coleta roda sem usuario autenticado e sem verificacao de capacidade: o prazo e a autorizacao"* |
 *
 * A ultima linha e a que o P4 mais cobra que esteja escrita: ela e uma das
 * operacoes que *"decidem acesso sem consultar capacidade alguma"*, e uma matriz
 * que a ignore descreve um sistema mais fechado do que o real.
 */
export interface ModuloDeRetencaoEDescarte {
  readonly nome: 'retencao-e-descarte';
  readonly portas: PortasDeRetencaoEDescarte;
  /**
   * O prazo de retencao em vigor nesta composicao, lido do ponto de configuracao
   * nomeado (T001). De fabrica, 30 dias — `R1` / BR-MIGRAR-030.
   */
  readonly prazoDeRetencao: PrazoDeRetencao;
  /**
   * Os marcadores de lixeira como metadado, para conteudo e para comentario
   * (T002). Le e grava **somente** pela porta de dados.
   */
  readonly armazenamento: ArmazenamentoDeRetencao;

  /**
   * Tira o conteudo do ar sem perde-lo, guardando o estado que ele tinha e o
   * instante do descarte (US-1, T003). E `wp_trash_post()`
   * (`wp-includes/post.php:4084`).
   *
   * **Permissao exigida: `delete_post` daquele conteudo** — a meta-capacidade
   * com o objeto, e nao uma cadeia fixa. Ela e **traduzida** antes de ser
   * comparada (`PERM-3`), e e a traducao que resolve os tres criterios de
   * permissao desta historia: por **autoria e estado** (CA-1.3), negando a
   * **versao anterior** a qualquer ator, inclusive ao super administrador
   * (CA-1.4), e trocando ou somando a capacidade das paginas de **funcao
   * especial** — `manage_options` na pagina inicial e na de conteudos,
   * `manage_privacy_options` somada na de politica de privacidade (CA-1.5). A
   * recusa e **valor**, com o texto e o numero que a superficie do legado
   * devolve; ver `descarte/permissao-de-descarte.ts`.
   *
   * ⚠️ **Com a lixeira desligada esta operacao APAGA EM DEFINITIVO**, na
   * primeira linha, e **nenhuma confirmacao e pedida ao ator** — `R1`/BR-MIGRAR-030
   * e UC-09 (*"a mesma acao, dois comportamentos irreconciliaveis"*). O que
   * **muda** antes da acao e o rotulo, a acao da rota e o `nonce`, e isso e
   * {@link ModuloDeRetencaoEDescarte.avisoDeExclusaoDefinitiva} (T009, CA-4.3);
   * a confirmacao que CA-4.2 cobra **nao existe no legado e continua sem decisao
   * humana**. A cascata de exclusao, com o reparenteamento de filhos e anexos, e
   * **T017**, e entra pelo contexto no ponto exato em que o legado a chama.
   *
   * O contexto chega por argumento, e nao pela composicao, porque identidade,
   * matriz de papeis e estado de rede sao escopo de REQUISICAO (`EXT-CONTEXTO`,
   * BR-MIGRAR-105) — e porque a colaboracao com BC-01 (ler o conteudo e gravar o
   * estado) e de **ligacao tardia** (AD-10, regra de dependencia 3).
   */
  descartar(
    contexto: ContextoDeDescarte,
    pedido: PedidoDeDescarte,
  ): ResultadoDoDescarte;

  /**
   * Suspende os comentarios do conteudo descartado, guardando o estado de cada
   * um, agrupado, junto do conteudo (US-2, T005). E
   * `wp_trash_post_comments()` (`wp-includes/post.php:4268`), o passo 5 de
   * UC-09, e e ela que `descartar` chama no passo 11 do seu fluxo.
   *
   * ⚠️ **Permissao exigida: NENHUMA, e isso e declaracao e nao esquecimento.**
   * A funcao do legado nao verifica capacidade, nao le o usuario corrente e e
   * **publicada** — chamavel direto por extensao e por `wp_delete_post()`. Quem
   * verifica e o chamador, com `delete_post` daquele conteudo. O **P4** manda
   * *"declarar permissao explicita em toda operacao exposta"* **e** *"preservar
   * o default de cada camada, inclusive quando o default e permissivo"*: esta
   * linha e a primeira metade, e a ausencia de portao no codigo e a segunda. Ver
   * a secao da declaracao em `cascata-de-comentarios/contexto-da-cascata.ts`.
   *
   * Ela tambem **nao pergunta se o conteudo esta na lixeira**: chamada sobre
   * conteudo publicado, suspende os comentarios dele do mesmo jeito.
   */
  suspenderComentarios(
    contexto: ContextoDaCascataDeComentarios,
    conteudoId: number,
  ): ResultadoDaSuspensao;

  /**
   * Devolve cada comentario ao estado que tinha, em lote por estado (US-2,
   * T005). E `wp_untrash_post_comments()` (`wp-includes/post.php:4329`), o passo
   * 5 de UC-10.
   *
   * ⚠️ **Permissao exigida: NENHUMA**, pelo mesmo motivo da gemea acima — e
   * quem verifica e `wp_untrash_post()` (US-3, T007), **pelo estado anterior
   * gravado no descarte**, que e CA-3.5.
   *
   * Esta aqui, e nao em T007, porque CA-2.3 esta na lista de criterios de T005 e
   * porque e `tasks.md` que declara a direcao da dependencia: *"T007 depende de
   * ... T005"*. O que T007 acrescenta e a **posicao** da chamada dentro da
   * restauracao do conteudo (`:4242`).
   *
   * 🔴 **O comentario cuja memoria se perdeu nao volta para onde estava:** o
   * estado guardado `post-trashed` vira `'0'`, a fila de moderacao
   * (`:4363`). E a regra que US-2 carrega e a borda de UT-048-6.
   */
  restaurarComentarios(
    contexto: ContextoDaCascataDeComentarios,
    conteudoId: number,
  ): ResultadoDaRestauracao;

  /**
   * **US-4, T009.** O que a tela e a API oferecem e dizem ao ator quando a
   * lixeira esta desligada — CA-4.3 (*"a diferenca ... e visivel na tela antes
   * da acao"*) e CA-4.4 (*"a tela nao oferece acao de restaurar"*).
   *
   * **Permissao exigida: `delete_post` daquele conteudo**, a mesma de
   * `descartar` — e ela chega respondida; ver
   * {@link AvisoDeExclusaoDefinitiva}.
   *
   * ⚠️ **CA-4.1 nao esta aqui: esta em `descartar`**, na primeira linha, desde
   * T003 — com a lixeira desligada a operacao devolve
   * `apagado-em-definitivo` sem emitir marcador, estado, cascata nem ponto de
   * extensao.
   *
   * 🔴 **CA-4.2 esta PARADO.** O criterio exige confirmacao que o legado nao
   * pede em nenhuma superficie de conteudo, e UC-09 afirma a ausencia palavra
   * por palavra. T009 **nao escolheu** entre as duas fontes: `tasks.md`
   * continua com a tarefa aberta e a caixa de PARADA, com o censo que sustenta
   * a leitura, esta em `descarte/aviso-de-exclusao-definitiva.ts`.
   */
  readonly avisoDeExclusaoDefinitiva: AvisoDeExclusaoDefinitiva;
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-DESCARTAR-009
 * descarta a redefinicao de funcao global e as 176 guardas `function_exists`, e
 * `target_business_rules.md` BR-MIGRAR-103 (`EXT-SUBST`) poe no lugar o registro
 * explicito, resolvido antes do primeiro uso. Trocar uma porta e passar outra
 * implementacao aqui — sem alterar arquivo deste modulo, que e o criterio de
 * "substituivel" que BR-MIGRAR-103 propoe.
 */
export function criarModuloDeRetencaoEDescarte(
  portas: PortasDeRetencaoEDescarte,
  opcoes: OpcoesDeRetencaoEDescarte = {},
): ModuloDeRetencaoEDescarte {
  return {
    nome: 'retencao-e-descarte',
    portas,
    // Ler o argumento com o valor de fabrica no lugar do ausente e a unica coisa
    // que a composicao resolve: nenhuma porta e tocada, que e o que `EXT-ORDEM`
    // cobra e o que `modulo.test.ts` afirma.
    prazoDeRetencao: opcoes.prazoDeRetencao ?? PRAZO_DE_RETENCAO_DE_FABRICA,
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui, e nenhum DDL — esta feature nao acrescenta tabela.
    armazenamento: criarArmazenamentoDeRetencao(portas.dados),
    // A operacao entra por referencia, sem nada resolvido: tudo o que ela decide
    // vem do contexto que o chamador monta por requisicao (`EXT-CONTEXTO`).
    descartar,
    // US-2 (T005): as duas metades da cascata, tambem por referencia. Elas NAO
    // sao ligadas ao `descartar` aqui: quem liga uma na outra e a composicao da
    // requisicao, com `cascataNoDescarte()`, porque o contexto de cada uma e
    // montado por requisicao e porque ligar aqui faria o modulo guardar estado.
    suspenderComentarios: suspenderComentariosDoConteudo,
    restaurarComentarios: restaurarComentariosDoConteudo,
    // US-4 (T009): so referencias. Nenhuma destas le o prazo da composicao — ele
    // chega por argumento em cada chamada, porque a tela de uma requisicao e o
    // `DELETE` de outra nao compartilham nada (`EXT-CONTEXTO`).
    avisoDeExclusaoDefinitiva: {
      enderecoDeExclusao,
      acaoNoEditor,
      acoesNaLinha,
      acoesEmMassa,
      confirmacaoPedidaAoAtor: CONFIRMACAO_PEDIDA_AO_ATOR,
      recusaNaApiSemForca: recusaDeLixeiraNaoSuportadaNaApi,
    },
  };
}
