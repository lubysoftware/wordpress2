/**
 * Porta de dados do modulo de superficies programaticas.
 *
 * Tarefa **T001** da feature `013-superficies-programaticas`, cuja entrega e
 * *"o despachante de rotas carrega com o registro de rotas vazio e
 * inspecionavel, e a porta de dados declarada"*. Este arquivo e a segunda
 * metade dela. `satisfaz: — (infraestrutura)`: nenhum criterio de aceite, e
 * nenhuma regra de negocio.
 *
 * E a unica porta deste modulo para o banco: nenhuma regra desta feature fala
 * com o driver, e nenhuma consulta e montada por concatenacao
 * (`.specify/specs/013-superficies-programaticas/plan.md`, secao Stack, slot
 * `persistencia`; REQ-164).
 *
 * ---
 *
 * ## Por que esta feature precisa de porta de dados, sendo *"quase toda
 * contrato e quase nada armazenamento"*
 *
 * A frase e do proprio `plan.md`, secao *Modelo de dados*, e a tabela dela diz
 * quem usa esta porta e quem **nao** usa:
 *
 * | o que | usa esta porta? |
 * |---|---|
 * | registro de rotas e registro de operacoes nomeadas | **nao.** *"em memoria, povoado por ponto de extensao no arranque"* |
 * | mapa do site e feeds (US-7, US-8) | **nao.** *"nao tem armazenamento: saem da mesma consulta publica da feature 004"* |
 * | registro de acesso (US-4) | **sim**, e e o unico caso em que a tabela nao existe no legado: *"REQ-141 o cria"* |
 * | cache de representacao embutivel (US-9) | 🔴 **o pacote e a arvore analisada discordam** — ver abaixo |
 *
 * 🔴 **A linha do cache de representacao embutivel esta registrada como
 * discordancia, e T001 nao a resolveu.** O `plan.md` diz que o cache *"e um
 * **registro de conteudo** de tipo proprio"* e que *"continua sendo conteudo:
 * outro caso em que o discriminador de tipo economizou uma tabela"* — e o tipo
 * existe: `oembed_cache`, em `wp-includes/post.php:267`. Mas quem o **escreve**
 * e o lado CONSUMIDOR, que embute conteudo de outro site neste
 * (`wp-includes/class-wp-embed.php:328` e `:514`), e US-9 e o lado PROVEDOR: a
 * rota `oembed/1.0/embed` chama `get_oembed_response_data()`
 * (`wp-includes/embed.php:561`, que e a ancora que a propria `spec.md` cita), e
 * aquela funcao **le** o conteudo e nao grava cache nenhum. Logo, pelo que a
 * arvore mostra, US-9 nao usa esta porta — ela le conteudo, que e BC-01 e entra
 * por ligacao tardia. Quem fechar T019 confere isso antes de abrir tabela, e a
 * pendencia esta em `../README.md`.
 *
 * ⚠️ **A consulta publica de US-7 e US-8 nao entra por aqui, e isso e regra de
 * arquitetura e nao preferencia.** A regra de dependencia 3 de
 * `target_architecture.md` e literal — *"`contextos/<a>/` para `contextos/<b>/`
 * por `import` no topo do modulo: proibido sempre, sem excecao"* — e AD-10 poe
 * toda chamada BC para BC em ligacao tardia. Logo a consulta de
 * `004-leitura-publica` chega a T015 e T017 como **campo do contexto da
 * operacao**, injetado por quem compoe, do mesmo jeito que
 * `ClassificacaoNaPublicacao` chega a `conteudo/publicacao/`. Quem escrever
 * aquelas tarefas e capaz de montar a consulta por SQL daqui — e nao deve:
 * seria um segundo dono para a mesma consulta, e CA-8.2 exige *"a mesma
 * consulta publica que a pagina, sem regra de visibilidade propria"*.
 *
 * ---
 *
 * ## As quatro ausencias desta interface, e a regra de cada uma
 *
 * 1. **Nao ha transacao.** BR-MIGRAR-104 mede zero `START TRANSACTION` e zero
 *    `COMMIT` em 1.467 arquivos, e o `plan.md` desta feature repete a medicao no
 *    slot `persistencia`. O P5 da constituicao poe a cascata de apagamento no
 *    contrato observavel: envolver uma sequencia numa transacao mudaria o que
 *    fica orfao.
 * 2. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas do
 *    legado tem 59 indices e zero chave estrangeira (P5). `REQ-169`, que pediria
 *    a restricao, esta em `do-not-rewrite.md`: escopo recusado.
 * 3. **Os metodos sao sincronos.** AD-04 fixa a fronteira de `await` em
 *    `adaptadores/`: `contextos/` e `plataforma/` sao sincronos. Aqui a razao e
 *    mais forte do que em outro contexto: o despacho do legado e uma pilha
 *    sincrona de ponta a ponta, e o ponto de extensao `rest_pre_dispatch`
 *    (`wp-includes/rest-api/class-wp-rest-server.php:1079`) devolve valor que
 *    **substitui** a resposta. Ponto de filtro que devolve valor e contrato byte
 *    a byte (Decisao 2), e nao sobrevive a uma fronteira assincrona no meio.
 * 4. **Nao ha prefixo base.** BC-05 declara os dois prefixos porque `users` e
 *    `usermeta` sao tabelas **globais** numa rede. Nenhuma linha da tabela acima
 *    e global: conteudo e **por site** (`target_data_model.md`), e o registro de
 *    acesso de REQ-141 nao tem tabela definida em lugar nenhum. Declarar o
 *    prefixo base aqui convidaria a montar nome de tabela global que este modulo
 *    nao tem.
 *
 * **Por que esta porta e declarada de novo aqui, e nao importada de BC-05 ou de
 * BC-04.** A borda e a mesma do legado — `$wpdb` —, mas a regra de dependencia 3
 * proibe a ligacao horizontal, e AD-08 poe a porta no contexto que a **consome**,
 * nao no primeiro contexto que a escreveu. Duas declaracoes da mesma forma e o
 * preco da regra, e o preco esta declarado.
 */

/** Valor que pode ocupar um marcador de consulta. */
export type ValorDeParametro = string | number | null | Uint8Array;

/** Valor que uma coluna devolve. O formato serializado e bytes, nao objeto. */
export type ValorDeColuna = string | number | null | Uint8Array;

/**
 * Consulta parametrizada: o texto do SQL e os valores viajam separados, e e
 * essa separacao que faz a concatenacao desnecessaria.
 *
 * O texto precisa poder ser a MESMA string que o legado envia (`plan.md`, slot
 * `persistencia`). Construir a camada de dados que o confere e trabalho da
 * feature `015-plataforma-transversal`; esta porta so declara a forma.
 */
export interface Consulta {
  /** SQL com marcadores de parametro, na mesma forma que o legado envia. */
  readonly texto: string;
  /** Valores dos marcadores, na ordem em que aparecem no texto. */
  readonly parametros: readonly ValorDeParametro[];
}

/** Uma linha devolvida por leitura, com as colunas como o banco as nomeia. */
export interface LinhaDeResultado {
  readonly [coluna: string]: ValorDeColuna | undefined;
}

/** O que uma escrita informa de volta. */
export interface ResultadoDeEscrita {
  readonly linhasAfetadas: number;
  /** Chave gerada pelo banco, quando a escrita gerou uma. */
  readonly idGerado: number | null;
}

export interface PortaDeDados {
  /**
   * Prefixo das tabelas deste site (o `$wpdb->prefix` do legado).
   *
   * Esta na porta porque e fato da borda, nao regra: toda tabela que este modulo
   * possa vir a tocar e por site, e nenhum nome de tabela se monta sem ele.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
