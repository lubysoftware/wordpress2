/**
 * O despachante de rotas — o `WP_REST_Server` do legado
 * (`wp-includes/rest-api/class-wp-rest-server.php:16`), visto de T001.
 *
 * Tarefa **T001** da feature `013-superficies-programaticas`: *"o despachante de
 * rotas carrega com o registro de rotas vazio e inspecionavel"*. Carregar e tudo
 * que ele faz hoje. `satisfaz: — (infraestrutura)`.
 *
 * ---
 *
 * ## A ordem do atendimento, que e contrato antes de ser codigo
 *
 * Nao ha etapa implementada aqui, e a tabela abaixo esta neste arquivo por um
 * motivo: a tabela *Nao negociavel* da constituicao poe *"mudar a ordem de
 * carregamento do arranque"* fora do que o agente de codificacao decide, e
 * `EXT-ORDEM` (BR-MIGRAR-106) a poe no contrato publico. A ordem do legado, do
 * fluxo principal de `UC-44`, com o dono de cada etapa neste pacote:
 *
 * | # | etapa no legado | ancora | onde esta neste porte |
 * |---|---|---|---|
 * | 1 | o filtro de autenticacao da API, que **antecede todo o despacho** | `:197` (`rest_authentication_errors`) | **T003** (CA-1.2: *"a resolucao de identidade acontece antes do despacho, num ponto unico"*); o token de sessao de navegador e **T011** (US-5) |
 * | 2 | casar caminho e metodo com uma rota registrada | `:285` (`serve_request`), `:1063` (`dispatch`) | **T003** (CA-1.1) |
 * | 3 | executar a declaracao de permissao da rota | `:1063` em diante | **T003**, e a camada falha **ABERTA** — ver abaixo |
 * | 4 | validar e sanitizar cada parametro contra o esquema | `wp-includes/rest-api.php:122` declara o esquema | **T005** (US-2) |
 * | 5 | executar a funcao da rota | — | de cada rota, nao do despachante |
 * | 6 | devolver a resposta no formato de dados, com os campos pedidos | — | **T003** (CA-1.4) |
 *
 * ⚠️ **Antes da etapa 2 existe um desvio, e ele e ponto de extensao.**
 * `rest_pre_dispatch` (`:1079`) recebe `null` e, se devolver qualquer coisa nao
 * vazia, **aquilo passa a ser a resposta** — sem casar rota, sem permissao e sem
 * validar parametro. Fica declarado aqui porque e produto (P2) e porque quem
 * escrever T003 precisa poe-lo na posicao certa, e nao no fim.
 *
 * ## As duas camadas de autorizacao deste modulo falham para lados opostos
 *
 * E o fato de maior valor de diagnostico do desenho de `BC-09`, e a razao pela
 * qual `target_architecture.md` juntou as superficies num contexto so — *"hoje
 * elas moram em pastas separadas e **ninguem ve a divergencia**"*:
 *
 * - **A camada de rotas falha ABERTA.** Rota registrada sem declaracao de
 *   permissao **funciona**, e o legado so emite aviso de uso indevido
 *   (`wp-includes/rest-api.php:121-133`), cujo texto ensina a declarar liberacao
 *   explicita para rota publica. E `I7`/BR-MIGRAR-074, e reproduzi-lo e o que o
 *   pacote manda: REQ-138, que fecharia a falha, ficou `bloqueado` e **nao
 *   entrou** (`spec.md`, *Perguntas em aberto*), `BR-HUMANA-008` registra que
 *   mudar isso *"produz um sistema mais fechado que o legado, e e decisao
 *   humana"*, e o cenario `@divida-herdada` de
 *   `parity_tests/18-superficies-de-escrita-paralelas.feature` afirma que **as
 *   duas metades atendem**. O aviso e de **T002**.
 * - **A camada de operacao nomeada falha FECHADA.** Declaracao de permissao
 *   ausente ou nao chamavel e **erro**, nao liberacao (`I4`/BR-MIGRAR-071,
 *   `wp-includes/abilities-api/class-wp-ability.php:623`) — e ainda assim o
 *   resultado e filtravel **inclusive para conceder** (`I5`/BR-MIGRAR-072), com
 *   *"elevacao temporaria de permissao para contextos confiaveis"* citada como
 *   caso de uso no proprio codigo. ⚠️ O filtro esta em
 *   `class-wp-ability.php:652` **nesta arvore**, que e onde `UC-46` tambem o
 *   poe; BR-MIGRAR-072 cita `:634`. Confira a ancora antes de afirmar. O
 *   registro dessas operacoes e **T002**, e a execucao e **T013**.
 *
 * 🔴 **`UC-44` contem uma recomendacao que este porte nao segue, e isso esta
 * registrado e nao resolvido.** A secao *O que um porte precisa saber* daquele
 * caso de uso diz, sobre a falha aberta: *"num porte, essa e a inversao mais
 * importante a nao copiar"*. O P1 da constituicao, `BR-HUMANA-008`, a
 * `spec.md` e o cenario de paridade mandam o contrario — preservar. T001 nao
 * escolheu: nao implementa camada de autorizacao nenhuma. A pendencia esta em
 * `../README.md`, secao *O que ninguem decidiu*, para quem fechar T002 e T003.
 */

import { criarRegistroDeRotas, type RegistroDeRotas } from './registro-de-rotas.js';

/**
 * O despachante carregado.
 *
 * Hoje tem uma coisa so, que e a entrega de T001: o registro. `despachar` e
 * **T003**, e nasce com a ordem da tabela do cabecalho deste arquivo.
 */
export interface DespachanteDeRotas {
  /** O registro desta requisicao: vazio ao carregar, e inspecionavel. */
  readonly registro: RegistroDeRotas;
}

/**
 * Carrega o despachante com um registro de rotas vazio.
 *
 * **Nao recebe a porta de dados, e isso e de proposito.** O construtor do legado
 * (`:103`) nao recebe nada: o servidor nao fala com o banco para existir. Quem
 * precisar da porta a recebe pelo modulo, nao pelo despachante — a tabela de
 * quem a usa, com a linha em discordancia marcada, esta no cabecalho de
 * `../portas/porta-de-dados.ts`.
 *
 * **E nao recebe configuracao.** `blog_public`, que decide se as rotas de mapa
 * do site existem (CA-7.1 e CA-7.3), e ponto de configuracao de **T015**:
 * semear o valor de fabrica dele aqui seria antecipar a tarefa que o le, e o P6
 * cobra que cada numero viva num ponto de configuracao nomeado com teste de
 * borda proprio.
 */
export function criarDespachanteDeRotas(): DespachanteDeRotas {
  return {
    registro: criarRegistroDeRotas(),
  };
}
