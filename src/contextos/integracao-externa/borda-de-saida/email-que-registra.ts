/**
 * A implementacao de {@link PortaDeEmail} que esta tarefa entrega: **registra
 * cada mensagem e devolve o que foi programado.**
 *
 * Tarefa **T001** da feature `014-integracao-externa`, a segunda metade de *"a
 * porta de cliente externo e a de envio de e-mail existem com uma implementacao
 * cada"*. As quatro razoes de a implementacao de T001 ser esta, e nao um
 * transporte de verdade, estao em `./cliente-externo-que-registra.ts` e valem
 * igual aqui — com um agravante proprio deste slot: o transporte de fabrica do
 * legado e `mail()` do PHP (`wp-includes/pluggable.php:505`), que **nao existe
 * neste runtime**. Qual transporte ocupa o lugar dele e `adaptadores/` com a
 * configuracao de CA-6.1, que e **T013**.
 *
 * **Registrar a mensagem e o que torna a paridade de e-mail conferivel.** AD-06
 * poe **o numero de e-mails ao administrador** como criterio de aceite de `A5`,
 * `A6` e `A7`, e `parity_specs.md` lista *"contagem de e-mails ao administrador
 * divergente do oraculo"* entre as divergencias que reprovam paridade. Contagem
 * se confere contando — {@link EmailQueRegistra.mensagens} e a contagem, e lista
 * vazia e **afirmacao**: e assim que se prova o caso em que o legado **nao**
 * avisa ninguem, que e o que o `@divida-herdada` de outras features cobra
 * ("nenhuma das duas avisa o ator").
 */

import type {
  MensagemDeEmail,
  PortaDeEmail,
  ResultadoDeEnvio,
} from '../portas/index.js';

/**
 * O resultado de um envio para o qual nada foi programado: **aceito pelo
 * transporte**.
 *
 * Aqui o padrao e sucesso, e a assimetria com
 * `FALHA_SEM_RESPOSTA_PROGRAMADA` do cliente externo e deliberada: o sucesso
 * desta porta **nao carrega dado nenhum**, logo nao ha observavel a inventar —
 * no legado `wp_mail()` devolve o booleano do `send()` do transporte
 * (`pluggable.php:653`, o `return $send;` que segue a acao
 * `wp_mail_succeeded` de `:651`), e o caminho de
 * fabrica nao devolve nada alem disso. O sucesso do cliente externo, ao
 * contrario, exigiria codigo, cabecalhos e corpo inventados.
 *
 * Quem quiser a falha a programa com {@link EmailQueRegistra.responder}, com o
 * motivo que o canal informaria — que e o que CA-6.2 manda registrar e o que o
 * legado poe no `WP_Error` da acao `wp_mail_failed` (`pluggable.php:665`).
 */
export const ENVIO_ACEITO_PELO_TRANSPORTE: ResultadoDeEnvio = Object.freeze({
  enviado: true as const,
});

export interface EmailQueRegistra {
  /** A porta, para passar a {@link criarModuloDeIntegracaoExterna}. */
  readonly porta: PortaDeEmail;
  /** Toda mensagem pedida, na ordem, com os seis argumentos inteiros. */
  readonly mensagens: MensagemDeEmail[];
  /** Programa o proximo resultado. Chamadas repetidas enfileiram, na ordem. */
  responder(resultado: ResultadoDeEnvio): void;
}

export interface OpcoesDoEmailQueRegistra {
  /** O que devolver quando a fila de respostas esta vazia. */
  readonly resultadoPadrao?: ResultadoDeEnvio;
}

/**
 * Cria a implementacao. Cada chamada devolve uma nova: sem estado de modulo
 * (BR-MIGRAR-105, `EXT-CONTEXTO`), porque numa rede cada site tem o seu canal e
 * a sua credencial, e duas composicoes nao podem se enxergar.
 */
export function criarEmailQueRegistra(
  opcoes: OpcoesDoEmailQueRegistra = {},
): EmailQueRegistra {
  const resultadoPadrao =
    opcoes.resultadoPadrao ?? ENVIO_ACEITO_PELO_TRANSPORTE;
  const mensagens: MensagemDeEmail[] = [];
  const programados: ResultadoDeEnvio[] = [];

  return {
    porta: {
      enviar(mensagem) {
        mensagens.push(mensagem);
        return programados.shift() ?? resultadoPadrao;
      },
    },
    mensagens,
    responder(resultado) {
      programados.push(resultado);
    },
  };
}
