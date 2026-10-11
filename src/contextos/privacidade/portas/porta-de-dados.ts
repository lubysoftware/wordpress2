/**
 * Porta de dados do modulo de privacidade (BC-06).
 *
 * Tarefa **T001** da feature `008-privacidade-e-dados-pessoais`:
 * *"o modulo carrega com as portas de dados, de relogio, de envio de e-mail e de
 * sistema de arquivos declaradas"*. `satisfaz: — (infraestrutura)`: nenhum
 * criterio de aceite de nenhuma historia fecha aqui.
 *
 * E a unica porta deste modulo para o banco, e nenhuma consulta e montada por
 * concatenacao (`plan.md`, slot `persistencia`; REQ-164).
 *
 * **Por que a solicitacao se le e se grava por esta porta, e nao por uma tabela
 * propria.** `D1` / BR-MIGRAR-038 e literal: *"a solicitacao e um Post"* —
 * `register_post_type( 'user_request', ... )` em `wp-includes/post.php:284`, com
 * os quatro estados dedicados em `:767` (`request-pending`), `:782`
 * (`request-confirmed`), `:797` (`request-failed`) e `:812`
 * (`request-completed`). `target_architecture.md` chama isso de **efeito no
 * banco** e `AD-11` proibe mudar o esquema; o cenario `@invariante` de
 * `parity_tests/12-solicitacao-de-dado-pessoal.feature` cobra que *"nenhuma das
 * duas cria tabela propria para a solicitacao"*. Portar a forma das linhas e de
 * **T002**, nao desta tarefa.
 *
 * **Por que esta porta e declarada de novo aqui, e nao importada de BC-01 ou de
 * BC-05.** A borda e a mesma do legado — `$wpdb` —, mas a regra de dependencia 3
 * de `target_architecture.md` e literal: *"`contextos/<a>/` para `contextos/<b>/`
 * por `import` no topo do modulo: proibido sempre, sem excecao"*, e AD-10 poe
 * toda chamada entre contextos em ligacao tardia. A porta pertence ao modulo que
 * a consome, nao ao primeiro modulo que a escreveu. Duas declaracoes da mesma
 * forma e o preco da regra, e o preco esta declarado.
 *
 * Quatro ausencias desta interface sao deliberadas, e cada uma e regra lida do
 * sistema analisado:
 *
 * 1. **Nao ha transacao, e nesta feature a ausencia tem nome.** BR-MIGRAR-104
 *    mede zero `START TRANSACTION` e zero `COMMIT` em 1.467 arquivos.
 *    BR-MIGRAR-041 (`D3b`) depende disso: a expiracao grava o estado de falha
 *    **e** esvazia a chave no mesmo `UPDATE`
 *    (`wp-admin/includes/privacy-tools.php:222`, um `wp_update_post` com
 *    `post_status` e `post_password`), e o documento registra que isso e
 *    *"atomicidade obtida por uma unica instrucao, nao por transacao — e nao ha
 *    transacao no sistema para quebrar"*. Envolver os dois campos em transacao
 *    mudaria a forma do comando sem mudar o resultado; separa-los em dois
 *    comandos mudaria o resultado, porque o link continuaria existindo entre um
 *    e outro.
 * 2. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas do
 *    legado tem 59 indices e zero chave estrangeira (P5, resposta 2). `REQ-169`
 *    esta em `do-not-rewrite.md`: escopo recusado.
 * 3. **Os metodos sao sincronos.** AD-04 fixa a fronteira de `await` em
 *    `adaptadores/`: `contextos/` e `plataforma/` sao sincronos.
 * 4. **Nao ha prefixo base.** BC-05 declara os dois prefixos porque `users` e
 *    `usermeta` sao tabelas **globais** numa rede. A solicitacao e conteudo, e
 *    conteudo e **por site** (`target_data_model.md`). A unica leitura desta
 *    feature numa tabela global e `get_user_by( 'email', ... )`, que
 *    `wp_create_user_request` usa para resolver o autor da solicitacao
 *    (`wp-includes/user.php:4820`) — e essa e dado de BC-05, logo chega por
 *    **ligacao tardia**, como campo do contexto da operacao, e nunca por
 *    consulta montada aqui. Declarar o prefixo base convidaria a montar o nome
 *    de uma tabela global que este modulo nao escreve.
 */

/** Valor que pode ocupar um marcador de consulta. */
export type ValorDeParametro = string | number | null | Uint8Array;

/** Valor que uma coluna devolve. O formato serializado e bytes, nao objeto. */
export type ValorDeColuna = string | number | null | Uint8Array;

/**
 * Consulta parametrizada: o texto do SQL e os valores viajam separados, e e essa
 * separacao que faz a concatenacao desnecessaria.
 *
 * O texto precisa poder ser a MESMA string que o legado envia (`plan.md`, slot
 * `persistencia`). Construir a camada de dados e trabalho da feature `015`
 * (T007); esta porta so declara a forma.
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
   * Esta na porta porque e fato da borda, nao regra: a solicitacao e uma linha
   * de `{prefixo}posts` e os instantes de confirmacao e de conclusao sao
   * metadado em `{prefixo}postmeta`
   * (`_wp_user_request_confirmed_timestamp` e `_wp_user_request_completed_timestamp`,
   * `wp-includes/class-wp-user-request.php:117` e `:118`), as duas por site.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
