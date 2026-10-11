/**
 * A implementacao de {@link PortaDeClienteExterno} que esta tarefa entrega:
 * **registra cada requisicao e devolve o que foi programado.**
 *
 * Tarefa **T001** da feature `014-integracao-externa` — *"a porta de cliente
 * externo e a de envio de e-mail existem com **uma implementacao cada**, e toda
 * chamada de saida do sistema passa por elas, sem nenhuma politica de prazo ou
 * de repeticao definida"*. `satisfaz: — (infraestrutura)`.
 *
 * **Por que a implementacao que T001 pode entregar e esta, e nao um cliente de
 * rede.** Quatro razoes, e as quatro sao de fora desta tarefa:
 *
 * 1. **A regra de dependencia 4** de `target_architecture.md`: *"`contextos/` ou
 *    `plataforma/` para adaptador concreto: proibido. So pela porta"*. E a
 *    descricao de BC-13 e ainda mais direta — *"a politica mora aqui"*, o
 *    adaptador em `adaptadores/`, porque *"sem essa divisao, o contexto seria o
 *    unico com dependencia de infraestrutura dentro de si"*.
 * 2. **AD-04**: `adaptadores/` e assincrono e `contextos/` e sincrono. Um
 *    cliente de rede dentro do contexto empurraria `await` para dentro do
 *    dominio, que e o que aquela decisao existe para impedir.
 * 3. **Nenhuma dependencia nova entra em `package.json`.** O slot `cliente-http`
 *    (undici) e implementacao de adaptador; a arvore hoje tem zero dependencia
 *    de execucao, e o portao desta arvore e `tsc` mais `npm test`, sem rede.
 * 4. **E o duplo que a propria spec de paridade exige.** O `Contexto` de
 *    `PT-017`
 *    (`.specify/migration/parity_tests/17-integracao-externa-e-rebaixamento-http.feature`)
 *    comeca com *"a porta de cliente HTTP substituida por duplo que registra
 *    cada requisicao nas duas metades"*, e e so com ele que os cenarios
 *    `@divida-herdada` podem comparar *"o esquema de URL usado em cada canal"*,
 *    *"o conjunto de canais que repete"* e *"o corpo da requisicao repetida"*.
 *
 * **Registra comando, nao simula servidor.** E a mesma escolha das portas falsas
 * de dados desta arvore, e aqui ela e mais importante ainda: o que `PT-017`
 * compara e **qual requisicao sai, com qual esquema, quantas vezes** — inclusive
 * os casos em que nenhuma sai. Um servidor de mentira esconderia exatamente
 * isso. {@link ClienteExternoQueRegistra.requisicoes} vazio e **afirmacao**, nao
 * ausencia de teste.
 *
 * **O que esta implementacao nao faz, de proposito:** nao promove esquema, nao
 * recusa esquema, nao define prazo, nao repete, nao valida destino, nao limita
 * taxa e nao escreve registro. Cada uma dessas ausencias tem a razao dela no
 * cabecalho de `../portas/porta-de-cliente-externo.ts`, e a primeira delas e o
 * conflito 🔴 REQ-149 x resposta 12, que T001 **nao** resolve.
 */

import type {
  PedidoExterno,
  PortaDeClienteExterno,
  ResultadoExterno,
} from '../portas/index.js';

/**
 * O resultado de uma chamada para a qual nada foi programado.
 *
 * E **falha**, e nao sucesso, por um motivo que e de paridade e nao de gosto:
 * sucesso exigiria inventar codigo, cabecalhos e corpo, e corpo inventado e
 * observavel inventado — a area 1 da Decisao 2 de `parity_specs.md` compara
 * *"saida byte a byte"*. Falha nao inventa nada: no legado a chamada que nao
 * produz resposta devolve `WP_Error( 'http_request_failed', $e->getMessage() )`
 * (`wp-includes/class-wp-http.php:425`), e o identificador e esse.
 *
 * A mensagem e **vazia** pela mesma razao: no legado ela vem do transporte, e
 * escrever um texto aqui seria escrever texto que o oraculo nao tem. Quem
 * precisar de mensagem a programa com
 * {@link ClienteExternoQueRegistra.responder}.
 */
export const FALHA_SEM_RESPOSTA_PROGRAMADA: ResultadoExterno = Object.freeze({
  completou: false as const,
  codigo: 'http_request_failed',
  mensagem: '',
});

export interface ClienteExternoQueRegistra {
  /** A porta, para passar a {@link criarModuloDeIntegracaoExterna}. */
  readonly porta: PortaDeClienteExterno;
  /**
   * Toda requisicao pedida, na ordem, com o pedido inteiro — inclusive o esquema
   * da URL, o tempo limite declarado e os campos de canal
   * ({@link PedidoExterno.verificarCertificado},
   * {@link PedidoExterno.bloqueante}), que e o que os cenarios de
   * `@divida-herdada` comparam.
   */
  readonly requisicoes: PedidoExterno[];
  /**
   * Programa o proximo resultado. Chamadas repetidas enfileiram, na ordem — e e
   * assim que se exercita o par "primeira chamada falha, segunda em claro
   * responde" dos 7 pontos de `ESC-HTTP` sem que a porta tenha politica alguma.
   */
  responder(resultado: ResultadoExterno): void;
}

export interface OpcoesDoClienteQueRegistra {
  /** O que devolver quando a fila de respostas esta vazia. */
  readonly resultadoPadrao?: ResultadoExterno;
}

/**
 * Cria a implementacao. Cada chamada devolve uma nova: nao ha estado de modulo
 * aqui, e e isso que o cenario `@concorrencia` de `PT-017` cobra — *"o estado de
 * rebaixamento de canal de um nao afeta o do outro"* (BR-MIGRAR-105,
 * `EXT-CONTEXTO`).
 */
export function criarClienteExternoQueRegistra(
  opcoes: OpcoesDoClienteQueRegistra = {},
): ClienteExternoQueRegistra {
  const resultadoPadrao =
    opcoes.resultadoPadrao ?? FALHA_SEM_RESPOSTA_PROGRAMADA;
  const requisicoes: PedidoExterno[] = [];
  const programados: ResultadoExterno[] = [];

  return {
    porta: {
      chamar(pedido) {
        requisicoes.push(pedido);
        return programados.shift() ?? resultadoPadrao;
      },
    },
    requisicoes,
    responder(resultado) {
      programados.push(resultado);
    },
  };
}
