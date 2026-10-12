/**
 * A porta do canal: para onde o evento vai, e de onde ele volta.
 *
 * Tarefa **T002** da feature `015-plataforma-transversal` — *"as portas
 * declaradas e nenhuma regra implementada"*. `satisfaz: — (infraestrutura)`.
 * US-1 e **T003**.
 *
 * ---
 *
 * ## Por que o registro tem porta, e por que a porta tem dois metodos
 *
 * A `Sequencia` do `plan.md` diz os dois em uma frase: *"a camada de dados
 * (REQ-164) antes do registro de operacao (REQ-159), **porque o registro e
 * consultavel e precisa de porta**"*. Consultavel e CA-1.2 (*"por periodo, por
 * severidade e por origem"*), e a tabela *Contratos* do mesmo arquivo lista as
 * duas operacoes separadas — *registrar evento de operacao* e *consultar o
 * registro* —, logo a borda serve as duas.
 *
 * ⚠️ **Registrar nao devolve nada, e isso e o P7 da constituicao e nao uma
 * simplificacao.** O principio e literal: *"registro e diagnostico novos podem
 * ser acrescentados, mas nenhuma decisao do sistema pode passar a depender
 * deles"*, e a forma de conferir e *"o registro acrescentado e so escrita:
 * nenhuma ramificacao do codigo testa o resultado de escrever log"*. Uma porta
 * que devolvesse sucesso convidaria a primeira ramificacao, e a primeira
 * ramificacao e a que troca o produto. `../modulo.test.ts` afirma o `void`.
 *
 * ⚠️ **E a porta nao falha.** Mesma linha da tabela *Contratos*: *"nenhum: falha
 * de registro **nao** pode alterar o fluxo (P7)"*. Se o canal nao escrever, o
 * sistema segue como se tivesse escrito — que e, alias, o comportamento de hoje
 * em toda a arvore, onde `error_log()` devolve booleano que ninguem le.
 *
 * ---
 *
 * ## 🔴 Qual das cinco bordas de AD-08 e esta, ninguem decidiu
 *
 * O registro nao existe no legado, logo nao ha borda do legado para copiar. Os
 * dois caminhos que o pacote admite:
 *
 * | caminho | o que o pacote diz |
 * |---|---|
 * | **sistema de arquivos** | o slot `observabilidade` recomenda *"registro estruturado em linha JSON"*, e linha JSON se escreve em arquivo. Seria a borda de arquivos de AD-08 |
 * | **banco, pela camada de dados** | a `Sequencia` do `plan.md` manda construir a camada de dados **antes** justamente porque *"o registro e consultavel e precisa de porta"*, e consulta por periodo, severidade e origem e o que um indice resolve |
 *
 * **T002 nao escolhe**, e a forma da porta nao depende da escolha: os dois
 * metodos sao os mesmos nos dois casos, e e o adaptador que muda. Registrar a
 * ambiguidade e a tarefa; resolve-la e de quem fechar T003, com a conferencia
 * que `plan.md` pede — e se a escolha implicar tabela nova, ela entra em
 * `target_data_model.md`, que AD-11 congela nesta fase (*"nenhuma mudanca de
 * esquema e permitida"*), o que **por si** e motivo para parar e perguntar.
 */

import type {
  EventoDeOperacao,
  RecorteDeConsulta,
} from '../evento-de-operacao.js';

export interface PortaDeCanal {
  /**
   * Escreve o evento. Nao devolve nada, e nao lanca.
   *
   * O `void` e contrato: ver o segundo aviso do cabecalho deste arquivo.
   */
  registrar(evento: EventoDeOperacao): void;

  /**
   * Devolve os eventos do recorte, na ordem em que foram escritos.
   *
   * Recorte vazio significa **sem filtro**. A ordem e a de escrita porque e a
   * unica que o canal conhece sem ordenar por um campo que o recorte nao pede.
   */
  consultar(recorte: RecorteDeConsulta): readonly EventoDeOperacao[];
}
