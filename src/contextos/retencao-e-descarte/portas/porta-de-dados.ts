/**
 * Porta de dados do modulo de retencao e descarte.
 *
 * E a unica porta deste modulo para o banco: nenhuma regra desta feature fala
 * com o driver, e nenhuma consulta e montada por concatenacao
 * (`.specify/specs/005-retencao-e-descarte/plan.md`, secao Stack, slot
 * `persistencia`; REQ-164).
 *
 * As quatro estruturas que esta feature le e grava sao `posts`, `postmeta`,
 * `comments` e `commentmeta` — a lixeira nao acrescenta tabela nenhuma, ela
 * acrescenta **marcadores em metadado** e um **prazo em configuracao**
 * (`plan.md`, secao *Modelo de dados*). Quem monta os nomes e grava os
 * marcadores e **T002**; esta porta so declara a forma.
 *
 * Quatro ausencias desta interface sao deliberadas, e cada uma e regra lida do
 * sistema analisado:
 *
 * 1. **Nao ha transacao, e nesta feature isso e o contrato.** BR-MIGRAR-104 mede
 *    zero `START TRANSACTION` e zero `COMMIT` em 1.467 arquivos, e o **P5** poe a
 *    cascata de apagamento no contrato observavel. Aqui a consequencia e direta:
 *    a coleta do legado percorre registro por registro (`wp_scheduled_delete`,
 *    `wp-includes/functions.php:6977`) e, interrompida no meio, deixa **parte**
 *    apagada — e CA-5.4 cobra exatamente a retomada desse estado. Envolver a
 *    coleta numa transacao desfaria o que CA-5.4 descreve.
 * 2. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas do
 *    legado tem 59 indices e zero chave estrangeira (P5), e `plan.md` avisa, na
 *    secao *Migracao de dados*, que declarar cascata no destino **muda o
 *    comportamento**: ao apagar em definitivo, filhos e anexos sao
 *    **reparentados ao avo**, nao apagados (US-8, `wp-includes/post.php:3908`).
 *    Declarar a restricao "mais correta" e a violacao que o P5 existe para
 *    impedir.
 * 3. **Os metodos sao sincronos.** AD-04 de `target_architecture.md` fixa a
 *    fronteira de `await` em `adaptadores/`: `contextos/` e `plataforma/` sao
 *    sincronos, e a I/O e resolvida antes de entrar no dominio ou exposta por
 *    fachada sincrona. Promessa aqui contaminaria o chamador e mudaria a ordem
 *    de emissao, que AD-03 poe no contrato.
 * 4. **Nao ha `prefixoBaseDeTabela`.** O legado tem **dois** prefixos, e as
 *    quatro tabelas desta feature estao todas no **do site**:
 *    `target_data_model.md` poe `posts`, `postmeta`, `comments` e `commentmeta`
 *    entre as 10 tabelas de *"ESCOPO POR SITE -- Prefixo {p} no site principal,
 *    {p}<blog_id>_ nos demais"*. O prefixo base serve `users` e `usermeta`, que
 *    sao globais e nao sao desta feature. Declarar o segundo prefixo aqui seria
 *    superficie que este modulo nao usa.
 *
 * **Esta interface e deliberadamente a mesma forma que a porta de dados de
 * `identidade-e-acesso`, e a duplicacao e a regra, nao descuido.** AD-10 proibe
 * contexto importar contexto no topo do modulo, e a regra de dependencia 4 poe a
 * porta no modulo que a **consome**, nao no adaptador que a implementa. Um unico
 * adaptador satisfaz as duas por forma. A camada de dados de verdade e trabalho
 * da feature 015 (`015-plataforma-transversal`, T007); enquanto ela nao existe,
 * cada contexto declara a sua.
 */

/** Valor que pode ocupar um marcador de consulta. */
export type ValorDeParametro = string | number | null | Uint8Array;

/** Valor que uma coluna devolve. O formato serializado e bytes, nao objeto. */
export type ValorDeColuna = string | number | null | Uint8Array;

/**
 * Consulta parametrizada: o texto do SQL e os valores viajam separados, e e essa
 * separacao que faz a concatenacao desnecessaria.
 *
 * O texto precisa poder ser a MESMA string que o legado envia. Nesta feature
 * isso tem um caso concreto: a coleta compara metadado com `meta_value < %d`
 * sobre uma coluna de texto (`wp-includes/functions.php:6979` e `:6997`), e o
 * rascunho automatico compara data **dentro do SQL**, com o relogio do banco
 * (`wp-includes/post.php:8377`). Quem reescrever essas duas consultas numa forma
 * "melhor" muda o conjunto de linhas apagadas.
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
   * Esta na porta porque e fato da borda, nao regra: numa rede o identificador
   * do site entra **dentro** do nome da tabela (`{p}7_posts`,
   * `target_data_model.md`), e nenhuma consulta deste modulo se monta sem ele.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
