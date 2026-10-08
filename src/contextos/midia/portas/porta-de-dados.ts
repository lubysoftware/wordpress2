/**
 * Porta de dados do modulo de midia (BC-04).
 *
 * E a unica porta deste modulo para o banco: nenhuma regra desta feature fala
 * com o driver, e nenhuma consulta e montada por concatenacao
 * (`.specify/specs/006-biblioteca-de-midia/plan.md`, secao Stack, slot
 * `persistencia`; REQ-164).
 *
 * **Por que esta porta e declarada de novo aqui, e nao importada de BC-05.** A
 * borda e a mesma do legado — `$wpdb` —, mas a regra de dependencia 3 de
 * `target_architecture.md` e literal: *"`contextos/<a>/` para `contextos/<b>/`
 * por `import` no topo do modulo: proibido sempre, sem excecao"*, e AD-10 poe
 * toda chamada BC para BC em ligacao tardia. A porta pertence ao modulo que a
 * consome, nao ao primeiro modulo que a escreveu. Duas declaracoes da mesma
 * forma e o preco da regra, e o preco esta declarado.
 *
 * Quatro ausencias desta interface sao deliberadas, e cada uma e regra lida do
 * sistema analisado:
 *
 * 1. **Nao ha transacao.** `target_business_rules.md` BR-MIGRAR-104 mede zero
 *    `START TRANSACTION` e zero `COMMIT` em 1.467 arquivos, e o `plan.md` desta
 *    feature repete a medicao. O P5 da constituicao poe a cascata de apagamento
 *    no contrato observavel, e aqui ela pesa mais do que em qualquer outro
 *    modulo: apagar anexo apaga arquivo em disco, e disco nao volta atras.
 *    Envolver a sequencia numa transacao mudaria o que fica orfao.
 * 2. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas do
 *    legado tem 59 indices e zero chave estrangeira (P5). `REQ-169`, que pediria
 *    a restricao, esta em `do-not-rewrite.md`: escopo recusado.
 * 3. **Os metodos sao sincronos.** AD-04 fixa a fronteira de `await` em
 *    `adaptadores/`: `contextos/` e `plataforma/` sao sincronos, e a I/O e
 *    resolvida antes de entrar no dominio ou exposta por fachada sincrona.
 * 4. **Nao ha prefixo base.** BC-05 declara os dois prefixos porque `users` e
 *    `usermeta` sao tabelas **globais** numa rede. Este modulo nao escreve
 *    nenhuma tabela global: anexo e metadado de anexo sao conteudo, e conteudo
 *    e **por site** (`target_data_model.md`). Declarar o prefixo base aqui
 *    convidaria a montar nome de tabela global que este modulo nao tem.
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
 * `persistencia`). Como conferir que nenhuma consulta e montada por
 * concatenacao e trabalho da feature 015 (`015-plataforma-transversal`, T007),
 * que constroi a camada de dados. Esta porta so declara a forma.
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
   * Esta na porta porque e fato da borda, nao regra: o anexo e uma linha de
   * `{prefixo}posts` e as derivadas vivem em `{prefixo}postmeta`, as duas por
   * site. Nenhum nome de tabela deste modulo se monta sem ele.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
